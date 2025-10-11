import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
} from '../services/notificationService.js';

export const listNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  const { items, totalUnread } = await getNotifications({
    userId: req.user.id,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    status: 'success',
    data: {
      items,
      totalUnread,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        count: items.length,
      },
    },
  });
});

export const markSingleNotification = asyncHandler(async (req, res) => {
  const { notificationId } = req.params;

  const notification = await markNotificationRead({
    userId: req.user.id,
    notificationId,
  });

  if (!notification) {
    throw new AppError('Notification not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      notification,
    },
  });
});

export const markAllNotifications = asyncHandler(async (req, res) => {
  await markAllNotificationsRead({ userId: req.user.id });

  res.json({
    status: 'success',
    message: 'All notifications marked as read',
  });
});
