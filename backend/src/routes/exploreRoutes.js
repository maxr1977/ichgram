import express from 'express';
import { getExploreController } from '../controllers/postController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.get('/posts/explore', authenticate, getExploreController);

export default router;
