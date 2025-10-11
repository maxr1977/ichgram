import { Router } from 'express';
import {
  createCommentController,
  deleteCommentController,
  getCommentsController,
} from '../controllers/commentController.js';
import { authenticate, attachUserIfExists } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/post/:postId', attachUserIfExists, getCommentsController);
router.post('/post/:postId', authenticate, createCommentController);
router.delete('/:commentId', authenticate, deleteCommentController);

export default router;
