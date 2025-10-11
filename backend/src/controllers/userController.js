import User from '../models/userModel.js';
import Follow from '../models/followModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import {
  buildUserResponse,
  buildPublicUser,
} from '../services/authService.js';
import { uploadBufferToS3, deleteFromS3 } from '../services/s3Service.js';
import { sanitizeText } from '../utils/sanitize.js';

export const getCurrentUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  res.json({
    status: 'success',
    data: {
      user: buildUserResponse(user),
    },
  });
});

export const updateProfile = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user.id);

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const { fullName, bio, website, username } = req.body;

  if (username && username.toLowerCase() !== user.username) {
    const existingUsername = await User.findOne({
      username: username.toLowerCase(),
      _id: { $ne: user.id },
    });
    if (existingUsername) {
      throw new AppError('Username is already taken', 409);
    }
    user.username = username.trim().toLowerCase();
  }

  if (fullName !== undefined) {
    user.fullName = fullName.trim();
  }

  if (bio !== undefined) {
    user.bio = sanitizeText(bio);
  }

  if (website !== undefined) {
    user.website = website.trim();
  }

  if (req.file) {
    const { key, url } = await uploadBufferToS3(
      req.file.buffer,
      req.file.mimetype,
      'avatars',
    );
    if (user.avatarKey) {
      await deleteFromS3(user.avatarKey);
    }
    user.avatarKey = key;
    user.avatarUrl = url;
  }

  await user.save();

  res.json({
    status: 'success',
    data: {
      user: buildUserResponse(user),
    },
  });
});

export const getUserProfile = asyncHandler(async (req, res) => {
  const { username } = req.params;

  const user = await User.findOne({
    username: username.toLowerCase(),
  });

  if (!user) {
    throw new AppError('User not found', 404);
  }

  const isCurrentUser = req.user ? req.user.id === user.id.toString() : false;
  let isFollowed = false;
  if (!isCurrentUser && req.user) {
    isFollowed = Boolean(
      await Follow.exists({
        follower: req.user.id,
        following: user.id,
      }),
    );
  }

  const responseData = isCurrentUser
    ? { ...buildUserResponse(user), isFollowed: false }
    : { ...buildPublicUser(user), isFollowed };

  res.json({
    status: 'success',
    data: {
      user: responseData,
      isCurrentUser,
    },
  });
});
