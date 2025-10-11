import { Router } from 'express';
import {
  register,
  login,
  logout,
  refreshToken,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js';
import {
  registerValidator,
  loginValidator,
  forgotPasswordValidator,
  resetPasswordValidator,
} from '../validators/auth.validator.js';
import { validateRequest } from '../middlewares/validationMiddleware.js';
import { authenticate } from '../middlewares/authMiddleware.js';

const router = Router();

router.post('/register', registerValidator, validateRequest, register);
router.post('/login', loginValidator, validateRequest, login);
router.post('/logout', authenticate, logout);
router.post('/refresh', refreshToken);
router.post(
  '/forgot-password',
  forgotPasswordValidator,
  validateRequest,
  forgotPassword,
);
router.post(
  '/reset-password',
  resetPasswordValidator,
  validateRequest,
  resetPassword,
);

export default router;
