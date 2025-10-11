import crypto from 'crypto';
import dayjs from 'dayjs';
import User from '../models/userModel.js';
import Token from '../models/tokenModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import env from '../config/env.js';
import {
  createSession,
  clearRefreshCookie,
  revokeSession,
  refreshSession,
  getRefreshTokenFromRequest,
  buildUserResponse,
} from '../services/authService.js';
import { sendPasswordResetEmail } from '../services/emailService.js';
import { sanitizeText } from '../utils/sanitize.js';

const normalizeIdentifier = (identifier) => identifier?.trim().toLowerCase();

const findUserByIdentifier = async (identifier) => {
  const normalized = normalizeIdentifier(identifier);
  if (!normalized) return null;

  const query = normalized.includes('@')
    ? { email: normalized }
    : { username: normalized };

  return User.findOne(query).select('+password +resetPasswordToken +resetPasswordExpires');
};

export const register = asyncHandler(async (req, res) => {
  const { username, email, fullName, password } = req.body;

  const normalizedUsername = username.trim().toLowerCase();
  const normalizedEmail = email.trim().toLowerCase();

  const existingUser = await User.findOne({
    $or: [{ username: normalizedUsername }, { email: normalizedEmail }],
  });

  if (existingUser) {
    throw new AppError('User with provided email or username already exists', 409);
  }

  const user = await User.create({
    username: normalizedUsername,
    email: normalizedEmail,
    fullName: fullName.trim(),
    password,
  });

  const { accessToken } = await createSession(user, req, res);

  res.status(201).json({
    status: 'success',
    data: {
      user: buildUserResponse(user),
      accessToken,
    },
  });
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;

  const user = await findUserByIdentifier(identifier);

  if (!user) {
    throw new AppError('Invalid credentials', 401);
  }

  const isMatch = await user.comparePassword(password);

  if (!isMatch) {
    throw new AppError('Invalid credentials', 401);
  }

  const { accessToken } = await createSession(user, req, res);

  res.json({
    status: 'success',
    data: {
      user: buildUserResponse(user),
      accessToken,
    },
  });
});

export const logout = asyncHandler(async (req, res) => {
  const refreshToken = getRefreshTokenFromRequest(req);
  await revokeSession(refreshToken);
  clearRefreshCookie(res);

  res.json({
    status: 'success',
    message: 'Logged out successfully',
  });
});

export const refreshToken = asyncHandler(async (req, res) => {
  const refreshTokenFromCookie = getRefreshTokenFromRequest(req);
  const { accessToken, userId } = await refreshSession(
    refreshTokenFromCookie,
    req,
    res,
  );

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      user: buildUserResponse(user),
      accessToken,
    },
  });
});

export const forgotPassword = asyncHandler(async (req, res) => {
  const { identifier } = req.body;
  const user = await findUserByIdentifier(identifier);

  if (!user) {
    return res.json({
      status: 'success',
      message: 'If an account exists, password reset instructions will be sent',
    });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
  const expiresAt = dayjs().add(15, 'minute').toDate();

  user.resetPasswordToken = hashedToken;
  user.resetPasswordExpires = expiresAt;
  await user.save({ validateBeforeSave: false });

  const resetUrl = `${env.clientUrl}/reset-password?token=${resetToken}`;
  await sendPasswordResetEmail(user.email, resetUrl);

  res.json({
    status: 'success',
    message: 'If an account exists, password reset instructions will be sent',
  });
});

export const resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  const user = await User.findOne({
    resetPasswordToken: hashedToken,
    resetPasswordExpires: { $gt: new Date() },
  }).select('+password +resetPasswordToken +resetPasswordExpires');

  if (!user) {
    throw new AppError('Reset token is invalid or has expired', 400);
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  await Token.updateMany(
    { user: user.id, isActive: true },
    { isActive: false },
  );

  res.json({
    status: 'success',
    message: 'Password has been reset. Please log in with your new password.',
  });
});
