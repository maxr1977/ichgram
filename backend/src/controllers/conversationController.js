import asyncHandler from '../utils/asyncHandler.js';
import {
  createConversation,
  getConversations,
  getConversationById,
  addParticipants,
  removeParticipant,
  leaveConversation,
  deleteConversation,
  serializeConversation,
  populateConversation,
} from '../services/messagingService.js';
import { uploadBufferToS3, deleteFromS3 } from '../services/s3Service.js';
import Conversation from '../models/conversationModel.js';
import AppError from '../utils/appError.js';
import { emitToUsers } from '../utils/realtime.js'; 

export const createConversationController = asyncHandler(async (req, res) => {
  const { participants = [], name, isGroup } = req.body;

  const conversation = await createConversation({
    creatorId: req.user.id,
    participantIds: participants,
    name,
    isGroup,
  });

  res.status(201).json({
    status: 'success',
    data: serializeConversation(conversation, req.user.id),
  });
});

export const getConversationsController = asyncHandler(async (req, res) => {
  const conversations = await getConversations({ userId: req.user.id });

  res.json({
    status: 'success',
    data: {
      items: conversations,
    },
  });
});

export const getConversationController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const conversation = await getConversationById({
    conversationId,
    userId: req.user.id,
  });

  res.json({
    status: 'success',
    data: serializeConversation(conversation, req.user.id),
  });
});

export const addParticipantsController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;
  const { participants } = req.body;

  const conversation = await addParticipants({
    conversationId,
    userId: req.user.id,
    newParticipants: participants ?? [],
  });

  res.json({
    status: 'success',
    data: serializeConversation(conversation, req.user.id),
  });
});

export const removeParticipantController = asyncHandler(async (req, res) => {
  const { conversationId, participantId } = req.params;

  const conversation = await removeParticipant({
    conversationId,
    userId: req.user.id,
    targetId: participantId,
  });

  res.json({
    status: 'success',
    data: serializeConversation(conversation, req.user.id),
  });
});

export const leaveConversationController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  await leaveConversation({ conversationId, userId: req.user.id });

  res.json({
    status: 'success',
    message: 'Conversation left',
  });
});

export const deleteConversationController = asyncHandler(async (req, res) => {
  const { conversationId } = req.params;

  await deleteConversation({ conversationId, userId: req.user.id });

  res.json({
    status: 'success',
    message: 'Conversation deleted',
  });
});

export const updateConversationAvatarController = asyncHandler(async (req, res) => {
    const { conversationId } = req.params;
    const userId = req.user.id;
  
    if (!req.file) {
      throw new AppError('No image file uploaded', 400);
    }
  
    const conversation = await Conversation.findById(conversationId);
  
    if (!conversation || !conversation.isGroup) {
      throw new AppError('Group conversation not found', 404);
    }
  
    const isAdmin = conversation.admins.some(adminId => adminId.toString() === userId);
    if (!isAdmin) {
      throw new AppError('Only admins can change the group avatar', 403);
    }
  
    
    const { key, url } = await uploadBufferToS3(req.file.buffer, req.file.mimetype, 'avatars');
  
    if (conversation.avatarKey) {
      await deleteFromS3(conversation.avatarKey);
    }
  
    conversation.avatarKey = key;
    conversation.avatarUrl = url;
    await conversation.save();
    
    const populatedConversation = await populateConversation(conversation);
    
    emitToUsers(
      'conversation:update',
      serializeConversation(populatedConversation, userId),
      conversation.participants,
    );
  
    res.json({
      status: 'success',
      data: serializeConversation(populatedConversation, req.user.id),
    });
  });