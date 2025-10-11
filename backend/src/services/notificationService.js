import Notification from '../models/notificationModel.js';
import User from '../models/userModel.js';
import Post from '../models/postModel.js';
import logger from '../utils/logger.js';

const emittedEvents = new Set();
const EVENT_TTL_MS = 5 * 1000;

const buildEventKey = (userId, notificationId) => `${userId}:${notificationId}`;

const scheduleCleanup = (key) => {
  setTimeout(() => {
    emittedEvents.delete(key);
  }, EVENT_TTL_MS);
};

const emitOnce = (io, userId, eventName, payload) => {
  if (!io) return;
  const key = buildEventKey(userId, payload.id ?? payload._id ?? '');
  if (emittedEvents.has(key)) {
    return;
  }
  emittedEvents.add(key);
  scheduleCleanup(key);
  io.to(userId.toString()).emit(eventName, payload);
};

export const createNotification = async ({
  userId,
  actorId,
  type,
  entityId,
  entityType,
  metadata = {},
}) => {
  if (userId?.toString() === actorId?.toString()) {
    return null;
  }

  try {
    const notification = await Notification.create({
      user: userId,
      actor: actorId,
      type,
      entityId,
      entityType,
      metadata,
    });

    const io = global.io;
    emitOnce(io, userId, 'notification:new', notification);
    return notification;
  } catch (error) {
    logger.error('Failed to create notification', error);
    return null;
  }
};

export const getNotifications = async ({ userId, page = 1, limit = 20 }) => {
  const skip = (page - 1) * limit;

  const notificationsPromise = Notification.find({ user: userId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit)
    .populate('actor', 'username fullName avatarUrl')
    .lean();

  const totalUnreadPromise = Notification.countDocuments({ user: userId, isRead: false });

  const [items, totalUnread] = await Promise.all([notificationsPromise, totalUnreadPromise]);

  const postIds = items
    .map((item) => item?.metadata?.postId)
    .filter(Boolean)
    .map((id) => id.toString());

  let previewMap = new Map();
  if (postIds.length) {
    const posts = await Post.find({ _id: { $in: postIds } })
      .select('media')
      .populate('media', 'url');

    previewMap = new Map(
      posts.map((post) => [
        post._id.toString(),
        Array.isArray(post.media) && post.media.length > 0 ? post.media[0].url : null,
      ]),
    );
  }

  const enrichedItems = items.map((item) => {
    const metadataPostId = item?.metadata?.postId
      ? item.metadata.postId.toString()
      : null;
    return {
      ...item,
      previewUrl: metadataPostId ? previewMap.get(metadataPostId) ?? null : null,
    };
  });

  return { items: enrichedItems, totalUnread };
};

export const markNotificationRead = async ({ userId, notificationId }) => {
  const notification = await Notification.findOne({
    _id: notificationId,
    user: userId,
  });

  if (!notification) {
    return null;
  }

  if (!notification.isRead) {
    notification.isRead = true;
    notification.readAt = new Date();
    await notification.save();
  }

  return notification;
};

export const markAllNotificationsRead = async ({ userId }) => {
  await Notification.updateMany(
    { user: userId, isRead: false },
    { isRead: true, readAt: new Date() },
  );
};

export const deleteNotificationsByEntity = async ({ entityId, type }) => {
  await Notification.deleteMany({ entityId, type });
};
