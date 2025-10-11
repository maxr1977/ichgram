import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import { buildPublicUser } from '../services/authService.js';

const paginateQuery = (query, { page = 1, limit = 20 }) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Math.min(Number(limit) || 20, 50);
  const skip = (safePage - 1) * safeLimit;

  return query.skip(skip).limit(safeLimit).exec();
};

export const followUser = asyncHandler(async (req, res) => {
  const { userId: targetId } = req.params;
  const followerId = req.user.id;

  if (!targetId) {
    throw new AppError('Target user is required', 400);
  }

  if (followerId === targetId) {
    throw new AppError('You cannot follow yourself', 400);
  }

  const targetUser = await User.findById(targetId);
  if (!targetUser) {
    throw new AppError('User not found', 404);
  }

  await Follow.follow(req.user._id, targetUser._id);

  res.status(201).json({
    status: 'success',
    message: 'Followed successfully',
  });
});

export const unfollowUser = asyncHandler(async (req, res) => {
  const { userId: targetId } = req.params;
  const followerId = req.user.id;

  if (!targetId) {
    throw new AppError('Target user is required', 400);
  }

  if (followerId === targetId) {
    throw new AppError('You cannot unfollow yourself', 400);
  }

  await Follow.unfollow(req.user._id, targetId);

  res.json({
    status: 'success',
    message: 'Unfollowed successfully',
  });
});

export const getFollowers = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const followersQuery = Follow.find({ following: userId })
    .sort({ createdAt: -1 })
    .populate('follower', 'username fullName avatarUrl bio followersCount followingCount postsCount');

  const results = await paginateQuery(followersQuery, { page, limit });
  const formatted = results
    .map((followDoc) => followDoc.follower)
    .filter(Boolean)
    .map(buildPublicUser);

  res.json({
    status: 'success',
    data: {
      items: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        count: formatted.length,
      },
    },
  });
});

export const getFollowing = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const followingQuery = Follow.find({ follower: userId })
    .sort({ createdAt: -1 })
    .populate('following', 'username fullName avatarUrl bio followersCount followingCount postsCount');

  const results = await paginateQuery(followingQuery, { page, limit });
  const formatted = results
    .map((followDoc) => followDoc.following)
    .filter(Boolean)
    .map(buildPublicUser);

  res.json({
    status: 'success',
    data: {
      items: formatted,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        count: formatted.length,
      },
    },
  });
});
