import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import {
  createComment,
  deleteComment,
  getComments,
  serializeComment,
} from '../services/commentService.js';

export const createCommentController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { content } = req.body;

  if (!content) {
    throw new AppError('Comment cannot be empty', 400);
  }

  const { comment, post } = await createComment({
    userId: req.user.id,
    postId,
    content,
  });

  res.status(201).json({
    status: 'success',
    data: {
      comment: serializeComment(comment, req.user.id, { isLiked: false }),
      postStats: {
        postId: postId.toString(),
        commentsCount: post.commentsCount,
      },
    },
  });
});

export const deleteCommentController = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  const result = await deleteComment({
    userId: req.user.id,
    commentId,
  });

  res.json({
    status: 'success',
    data: {
      postId: result.post?._id?.toString(),
      commentsCount: result.post?.commentsCount ?? 0,
      lastComment: result.latestComment
        ? serializeComment(result.latestComment, req.user.id, { isLiked: false })
        : null,
    },
  });
});

export const getCommentsController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const { page = 1, limit = 20 } = req.query;

  const comments = await getComments({
    postId,
    page: Number(page),
    limit: Number(limit),
    currentUserId: req.user?.id,
  });

  res.json({
    status: 'success',
    data: comments,
  });
});
