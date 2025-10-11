import { Router } from 'express';
import {
  togglePostLikeController,
  toggleCommentLikeController,
} from '../controllers/likeController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/posts/:postId', authenticate, togglePostLikeController);
router.post('/comments/:commentId', authenticate, toggleCommentLikeController);

export default router;
