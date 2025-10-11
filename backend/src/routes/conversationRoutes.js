import { Router } from 'express';
import {
  createConversationController,
  getConversationsController,
  getConversationController,
  addParticipantsController,
  removeParticipantController,
  leaveConversationController,
  deleteConversationController,
  updateConversationAvatarController,
} from '../controllers/conversationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.use(authenticate);

router.get('/', getConversationsController);
router.post('/', createConversationController);
router.get('/:conversationId', getConversationController);
router.post('/:conversationId/participants', addParticipantsController);
router.delete('/:conversationId/participants/:participantId', removeParticipantController);
router.post('/:conversationId/leave', leaveConversationController);
router.delete('/:conversationId', deleteConversationController);
router.patch('/:conversationId/avatar', uploadSingleImage, updateConversationAvatarController);

export default router;
