import { Router } from 'express';
import {
  listNotifications,
  markSingleNotification,
  markAllNotifications,
} from '../controllers/notificationController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/', authenticate, listNotifications);
router.patch('/:notificationId/read', authenticate, markSingleNotification);
router.patch('/read-all', authenticate, markAllNotifications);

export default router;
