import { Router } from 'express';
import {
  getCurrentUser,
  updateProfile,
  getUserProfile,
} from '../controllers/userController.js';
import { authenticate, attachUserIfExists } from '../middlewares/authMiddleware.js';
import { uploadSingleImage } from '../middlewares/uploadMiddleware.js';
import { updateProfileValidator } from '../validators/user.validator.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';

const router = Router();

router.get('/me', authenticate, getCurrentUser);

router.patch(
  '/me',
  authenticate,
  uploadSingleImage,
  updateProfileValidator,
  validateRequest,
  updateProfile,
);

router.get('/:username', attachUserIfExists, getUserProfile);

export default router;
