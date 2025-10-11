import { Router } from 'express';
import {
  createMessageController,
  getMessagesController,
  markDeliveredController,
  markReadController,
} from '../controllers/messageController.js';
import { authenticate } from '../middlewares/authMiddleware.js';
import { uploadMessageImages } from '../middlewares/uploadMiddleware.js';

const router = Router({ mergeParams: true });

router.use(authenticate);

router.get('/:conversationId', getMessagesController);
router.post('/:conversationId', uploadMessageImages, createMessageController);
router.post('/:conversationId/delivered', markDeliveredController);
router.post('/:conversationId/read', markReadController);

export default router;
