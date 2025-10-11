import { Router } from 'express';
import {
  followUser,
  unfollowUser,
  getFollowers,
  getFollowing,
} from '../controllers/followController.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/:userId', authenticate, followUser);
router.delete('/:userId', authenticate, unfollowUser);
router.get('/:userId/followers', authenticate, getFollowers);
router.get('/:userId/following', authenticate, getFollowing);

export default router;
