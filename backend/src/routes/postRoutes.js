import { Router } from 'express';
import {
  createPostController,
  updatePostController,
  deletePostController,
  getPostController,
  getFeedController,
  getExploreController,
  getUserPostsController,
} from '../controllers/postController.js';
import { authenticate, attachUserIfExists } from '../middlewares/authMiddleware.js';
import { uploadPostImages } from '../middlewares/uploadMiddleware.js';

const router = Router();

router.get('/feed', authenticate, getFeedController);
router.get('/explore', authenticate, getExploreController);
router.get('/user/:username', attachUserIfExists, getUserPostsController);
router.get('/:postId', attachUserIfExists, getPostController);

router.post('/', authenticate, uploadPostImages, createPostController);
router.patch('/:postId', authenticate, uploadPostImages, updatePostController);
router.delete('/:postId', authenticate, deletePostController);

export default router;
