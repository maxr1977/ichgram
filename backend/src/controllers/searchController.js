import asyncHandler from '../utils/asyncHandler.js';
import User from '../models/userModel.js';

export const searchUsersController = asyncHandler(async (req, res) => {
  const { q = '', limit = 10 } = req.query;
  const query = q.toString().trim();

  if (!query || query.length < 2) {
    return res.json({
      status: 'success',
      data: {
        items: [],
      },
    });
  }

  const regex = new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');

  const results = await User.find({
    $or: [{ username: regex }, { fullName: regex }],
  })
    .limit(Math.min(Number(limit) || 10, 30))
    .select('username fullName avatarUrl bio followersCount followingCount postsCount');

  res.json({
    status: 'success',
    data: {
      items: results.map((user) => ({
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        avatarUrl: user.avatarUrl,
        bio: user.bio,
        followersCount: user.followersCount,
        followingCount: user.followingCount,
        postsCount: user.postsCount,
      })),
    },
  });
});
