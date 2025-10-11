import { Router } from 'express';
import authRoutes from './authRoutes.js';
import userRoutes from './userRoutes.js';
import followRoutes from './followRoutes.js';
import notificationRoutes from './notificationRoutes.js';
import postRoutes from './postRoutes.js';
import commentRoutes from './commentRoutes.js';
import likeRoutes from './likeRoutes.js';
import searchRoutes from './searchRoutes.js';
import conversationRoutes from './conversationRoutes.js';
import messageRoutes from './messageRoutes.js';
import exploreRoutes from './exploreRoutes.js';

const router = Router();

router.get('/', (req, res) => {
  res.json({ message: 'API works' });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/follows', followRoutes);
router.use('/notifications', notificationRoutes);
router.use('/posts', postRoutes);
router.use('/explore', exploreRoutes);
router.use('/comments', commentRoutes);
router.use('/likes', likeRoutes);
router.use('/search', searchRoutes);
router.use('/conversations', conversationRoutes);
router.use('/messages', messageRoutes);

export const apiRouter = router;

