import mongoose from 'mongoose';
import Conversation from '../models/conversationModel.js';
import Message from '../models/messageModel.js';
import AppError from '../utils/appError.js';
import { sanitizeText } from '../utils/sanitize.js';
import { uploadPostMedia, deleteMediaAssets } from './postService.js';
import { createNotification } from './notificationService.js';
import { emitToUsers } from '../utils/realtime.js';

const CONVERSATION_POPULATE = [
  { path: 'participants', select: 'username fullName avatarUrl' },
  { path: 'admins', select: 'username fullName avatarUrl' },
  {
    path: 'lastMessage',
    populate: {
      path: 'sender',
      select: 'username fullName avatarUrl',
    },
  },
];

export const serializeConversation = (conversation, currentUserId) => ({
  id: conversation.id,
  name: conversation.name,
  isGroup: conversation.isGroup,
  avatarUrl: conversation.avatarUrl,
  participants: (conversation.participants ?? []).map((user) => ({
    id: user.id,
    username: user.username,
    fullName: user.fullName,
    avatarUrl: user.avatarUrl,
  })),
  admins: (conversation.admins ?? []).map((user) => user.id),
  lastMessage: conversation.lastMessage
    ? {
        id: conversation.lastMessage.id,
        content: conversation.lastMessage.content,
        sender: conversation.lastMessage.sender
          ? {
              id: conversation.lastMessage.sender.id,
              username: conversation.lastMessage.sender.username,
              fullName: conversation.lastMessage.sender.fullName,
              avatarUrl: conversation.lastMessage.sender.avatarUrl,
            }
          : null,
        createdAt: conversation.lastMessage.createdAt,
      }
    : null,
  updatedAt: conversation.updatedAt,
  createdAt: conversation.createdAt,
  isMine: conversation.participants
    ?.some((user) => user.id.toString() === currentUserId?.toString()),
});

export const serializeMessage = (message, currentUserId) => ({
  id: message.id,
  conversationId: message.conversation.toString(),
  sender: message.sender
    ? {
        id: message.sender.id,
        username: message.sender.username,
        fullName: message.sender.fullName,
        avatarUrl: message.sender.avatarUrl,
      }
    : null,
  content: message.content,
  attachments: (message.attachments ?? []).map((asset) => ({
    id: asset.id,
    url: asset.url,
    key: asset.key,
    mimeType: asset.mimeType,
    size: asset.size,
  })),
  createdAt: message.createdAt,
  updatedAt: message.updatedAt,
  isMine: currentUserId
    ? message.sender?._id?.toString() === currentUserId.toString()
    : false,
  deliveredTo: (message.deliveredTo ?? []).map((userId) => userId.toString()),
  readBy: (message.readBy ?? []).map((userId) => userId.toString()),
});

export const ensureParticipants = (participants, currentUserId) => {
  const unique = Array.from(
    new Set(
      [...participants, currentUserId].map((id) => id.toString()),
    ),
  );

  if (unique.length < 2) {
    throw new AppError('Conversation requires at least two participants', 400);
  }

  return unique;
};

export const createConversation = async ({
  creatorId,
  participantIds,
  name,
  isGroup = false,
}) => {
  const participants = ensureParticipants(participantIds, creatorId);
  const admins = [creatorId];

  if (!isGroup && participants.length !== 2) {
    throw new AppError('Direct conversation must have exactly two participants', 400);
  }

  if (!isGroup) {
    const existing = await Conversation.findOne({
      isGroup: false,
      participants: { $all: participants, $size: participants.length },
    });
    if (existing) {
      return populateConversation(existing);
    }
  }

  const conversation = await Conversation.create({
    name: isGroup ? name : undefined,
    isGroup,
    participants,
    admins: isGroup ? admins : [],
  });

  const populated = await populateConversation(conversation);

  emitToUsers(
    'conversation:new',
    serializeConversation(populated, creatorId),
    participants,
  );

  return populated;
};

export const populateConversation = (conversation) =>
  conversation.populate(CONVERSATION_POPULATE);

export const getConversations = async ({ userId }) => {
  const conversations = await Conversation.find({
    participants: userId,
  })
    .sort({ updatedAt: -1 })
    .populate(CONVERSATION_POPULATE);

  return conversations.map((conversation) =>
    serializeConversation(conversation, userId),
  );
};

export const getConversationById = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).populate(CONVERSATION_POPULATE);

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  return conversation;
};

export const addParticipants = async ({ conversationId, userId, newParticipants }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (!conversation.isGroup) {
    throw new AppError('Cannot add participants to a direct conversation', 400);
  }

  if (!conversation.admins.some((adminId) => adminId.toString() === userId.toString())) {
    throw new AppError('Only admins can add participants', 403);
  }

  const toAdd = newParticipants
    .map((id) => id.toString())
    .filter((id) => !conversation.participants.some((existing) => existing.toString() === id));

  if (!toAdd.length) {
    return populateConversation(conversation);
  }

  conversation.participants.push(
    ...toAdd.map((id) => new mongoose.Types.ObjectId(id)),
  );

  await conversation.save();
  const populated = await populateConversation(conversation);

  emitToUsers(
    'conversation:update',
    serializeConversation(populated, userId),
    conversation.participants,
  );

  return populated;
};

export const removeParticipant = async ({ conversationId, userId, targetId }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  if (!conversation.isGroup) {
    throw new AppError('Cannot remove participants from a direct conversation', 400);
  }

  const isAdmin = conversation.admins.some((adminId) => adminId.toString() === userId.toString());
  if (!isAdmin && userId.toString() !== targetId.toString()) {
    throw new AppError('Only admins can remove participants', 403);
  }

  conversation.participants = conversation.participants.filter(
    (participantId) => participantId.toString() !== targetId.toString(),
  );
  conversation.admins = conversation.admins.filter(
    (adminId) => adminId.toString() !== targetId.toString(),
  );

  await conversation.save();
  const populated = await populateConversation(conversation);

  emitToUsers(
    'conversation:update',
    serializeConversation(populated, userId),
    conversation.participants,
  );

  emitToUsers(
    'conversation:removed',
    { conversationId: conversation.id },
    [targetId],
  );

  return populated;
};

export const createMessage = async ({
  conversationId,
  senderId,
  content,
  files = [],
}) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: senderId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const sanitized = sanitizeText(content);
  if (!sanitized && !files.length) {
    throw new AppError('Message cannot be empty', 400);
  }

  let attachments = [];
  if (files.length) {
    attachments = await uploadPostMedia({ files, owner: senderId, folder: 'messages' });
  }

  const message = await Message.create({
    conversation: conversationId,
    sender: senderId,
    content: sanitized,
    attachments: attachments.map((asset) => asset._id),
    deliveredTo: [senderId],
  });

  await message.populate([
    { path: 'sender', select: 'username fullName avatarUrl' },
    { path: 'attachments' },
  ]);

  const serializedMessage = serializeMessage(message, senderId);

  emitToUsers(
    'message:new',
    serializedMessage,
    conversation.participants.map((id) => id.toString()),
  );
  const io = global.io;
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message:new', serializedMessage);
  }

  await Promise.all(
    conversation.participants
      .filter((participantId) => participantId.toString() !== senderId.toString())
      .map((participantId) =>
        createNotification({
          userId: participantId,
          actorId: senderId,
          type: 'message',
          entityId: message._id,
          entityType: 'Message',
          metadata: {
            conversationId,
          },
        }),
      ),
  );

  return message;
};

export const getMessages = async ({
  conversationId,
  userId,
  page = 1,
  limit = 30,
}) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const messages = await Message.find({ conversation: conversationId })
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(Number(limit))
    .populate([
      { path: 'sender', select: 'username fullName avatarUrl' },
      { path: 'attachments' },
    ]);

  const total = await Message.countDocuments({ conversation: conversationId });

  const items = messages
    .map((message) => serializeMessage(message, userId))
    .reverse();

  return {
    items,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      count: items.length,
      total,
    },
  };
};

export const markMessagesDelivered = async ({
  conversationId,
  messageIds,
  userId,
}) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).select('participants');

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      _id: { $in: messageIds },
      deliveredTo: { $ne: userId },
    },
    { $push: { deliveredTo: userId } },
  );

  const payload = {
    conversationId,
    messageIds: messageIds.map((id) => id.toString()),
    userId: userId.toString(),
  };

  emitToUsers('message:delivered', payload, conversation.participants);
  const io = global.io;
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message:delivered', payload);
  }
};

export const markMessagesRead = async ({
  conversationId,
  messageIds,
  userId,
}) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  }).select('participants');

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  await Message.updateMany(
    {
      conversation: conversationId,
      _id: { $in: messageIds },
      readBy: { $ne: userId },
    },
    { $push: { readBy: userId } },
  );

  const payload = {
    conversationId,
    messageIds: messageIds.map((id) => id.toString()),
    readerId: userId.toString(),
  };

  emitToUsers('message:read', payload, conversation.participants);
  const io = global.io;
  if (io) {
    io.to(`conversation:${conversationId}`).emit('message:read', payload);
  }
};

export const leaveConversation = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  conversation.participants = conversation.participants.filter(
    (participantId) => participantId.toString() !== userId.toString(),
  );
  conversation.admins = conversation.admins.filter(
    (adminId) => adminId.toString() !== userId.toString(),
  );

  await conversation.save();

  emitToUsers(
    'conversation:update',
    serializeConversation(await populateConversation(conversation), userId),
    conversation.participants,
  );

  emitToUsers(
    'conversation:removed',
    { conversationId: conversation.id },
    [userId],
  );

  return conversation;
};

export const deleteConversation = async ({ conversationId, userId }) => {
  const conversation = await Conversation.findOne({
    _id: conversationId,
    participants: userId,
  });

  if (!conversation) {
    throw new AppError('Conversation not found', 404);
  }

  const isAdmin = conversation.admins.some((adminId) => adminId.toString() === userId.toString());
  if (!isAdmin) {
    throw new AppError('Only admins can delete the conversation', 403);
  }

  const messageDocs = await Message.find({ conversation: conversationId }).select('attachments');
  await Message.deleteMany({ conversation: conversationId });
  await Conversation.deleteOne({ _id: conversationId });

  emitToUsers(
    'conversation:deleted',
    { conversationId },
    conversation.participants.map((id) => id.toString()),
  );

  if (messageDocs.length) {
    const flatAttachments = messageDocs.flatMap((message) => message.attachments ?? []);
    if (flatAttachments.length) {
      await deleteMediaAssets(flatAttachments);
    }
  }
};
