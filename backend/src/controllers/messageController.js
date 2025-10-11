import asyncHandler from '../utils/asyncHandler.js';
import {
  createMessage,
  getMessages,
  markMessagesDelivered,
  markMessagesRead,
  serializeMessage,
} from '../services/messagingService.js';

export const createMessageController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { content } = req.body;
  const files = req.files ?? [];

  const message = await createMessage({
    conversationId,
    senderId: req.user.id,
    content,
    files,
  });

  res.status(201).json({
    status: 'success',
    data: serializeMessage(message, req.user.id),
  });
});

export const getMessagesController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { page = 1, limit = 30 } = req.query;

  const result = await getMessages({
    conversationId,
    userId: req.user.id,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    status: 'success',
    data: result,
  });
});

export const markDeliveredController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { messageIds = [] } = req.body;

  await markMessagesDelivered({
    conversationId,
    messageIds,
    userId: req.user.id,
  });

  res.json({
    status: 'success',
  });
});

export const markReadController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { messageIds = [] } = req.body;

  await markMessagesRead({
    conversationId,
    messageIds,
    userId: req.user.id,
  });

  res.json({
    status: 'success',
  });
});
