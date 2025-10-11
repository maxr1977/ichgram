import asyncHandler from '../utils/asyncHandler.js';
import {
  togglePostLike,
  toggleCommentLike,
} from '../services/likeService.js';

export const togglePostLikeController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const result = await togglePostLike({
    userId: req.user.id,
    postId,
  });

  res.json({
    status: 'success',
    data: {
      postId: postId.toString(),
      liked: result.liked,
      likesCount: result.likesCount,
    },
  });
});

export const toggleCommentLikeController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await toggleCommentLike({
    userId: req.user.id,
    commentId,
  });

  res.json({
    status: 'success',
    data: {
      commentId: commentId.toString(),
      liked: result.liked,
      likesCount: result.likesCount,
    },
  });
});
