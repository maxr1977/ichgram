import mongoose from 'mongoose';
import Comment from '../models/commentModel.js';
import Post from '../models/postModel.js';
import AppError from '../utils/appError.js';
import { sanitizeText } from '../utils/sanitize.js';
import { createNotification } from './notificationService.js';
import { emitToUsers } from '../utils/realtime.js';
import {
  getLikedCommentIds,
  isCommentLikedByUser,
} from './likeService.js';

export const serializeComment = (comment, currentUserId, extra = {}) => ({
  id: comment.id,
  content: comment.content,
  author: comment.author
    ? {
        id: comment.author.id,
        username: comment.author.username,
        fullName: comment.author.fullName,
        avatarUrl: comment.author.avatarUrl,
      }
    : null,
  likesCount: comment.likesCount ?? 0,
  createdAt: comment.createdAt,
  updatedAt: comment.updatedAt,
  isMine: currentUserId
    ? comment.author?._id?.toString() === currentUserId.toString()
    : false,
  isLiked: extra.isLiked ?? false,
});

export const createComment = async ({ userId, postId, content }) => {
  const sanitized = sanitizeText(content);
  if (!sanitized) {
    throw new AppError('Comment cannot be empty', 400);
  }

  const post = await Post.findById(postId).select('author commentsCount');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const comment = await Comment.create({
    author: userId,
    post: postId,
    content: sanitized,
  });

  await comment.populate('author', 'username fullName avatarUrl');

  await createNotification({
    userId: post.author,
    actorId: userId,
    type: 'comment_post',
    entityId: comment._id,
    entityType: 'Comment',
    metadata: { postId },
  });

  const updatedPost = await Post.findById(postId).select('commentsCount author');

  const recipients = [
    post.author?.toString(),
    userId.toString(),
  ].filter(Boolean);

  const serializedComment = serializeComment(comment, userId, { isLiked: false });

  emitToUsers(
    'comment:new',
    {
      postId: postId.toString(),
      comment: serializedComment,
    },
    recipients,
  );

  emitToUsers(
    'post:comment',
    {
      postId: postId.toString(),
      commentsCount: updatedPost.commentsCount,
      lastComment: serializedComment,
    },
    recipients,
  );

  return { comment, post: updatedPost };
};

export const deleteComment = async ({ userId, commentId }) => {
  const comment = await Comment.findById(commentId)
    .populate('author', 'username fullName avatarUrl')
    .populate('post', 'author');

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const isOwner = comment.author._id.toString() === userId.toString();
  const isPostAuthor = comment.post?.author?.toString() === userId.toString();

  if (!isOwner && !isPostAuthor) {
    throw new AppError('You cannot delete this comment', 403);
  }

  const postId = comment.post?._id ?? comment.post;
  await comment.deleteOne();

  const updatedPost = await Post.findById(postId).select('commentsCount author');
  const latestComment = await getLatestComment(postId);

  const recipients = [
    updatedPost?.author?.toString(),
    comment.author._id.toString(),
  ].filter(Boolean);

  emitToUsers(
    'comment:deleted',
    {
      postId: postId.toString(),
      commentId: commentId.toString(),
    },
    recipients,
  );

  emitToUsers(
    'post:comment',
    {
      postId: postId.toString(),
      commentsCount: updatedPost?.commentsCount ?? 0,
      lastComment: latestComment
        ? serializeComment(latestComment, null)
        : null,
    },
    recipients,
  );

  return { post: updatedPost, latestComment };
};

export const getComments = async ({ postId, page = 1, limit = 20, currentUserId }) => {
  const safePage = Number(page) > 0 ? Number(page) : 1;
  const safeLimit = Math.min(Number(limit) || 20, 100);
  const skip = (safePage - 1) * safeLimit;

  const [comments, total] = await Promise.all([
    Comment.find({ post: postId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(safeLimit)
      .populate('author', 'username fullName avatarUrl'),
    Comment.countDocuments({ post: postId }),
  ]);

  let likedIds = new Set();
  if (currentUserId) {
    likedIds = await getLikedCommentIds({
      userId: currentUserId,
      commentIds: comments.map((comment) => comment._id),
    });
  }

  const items = comments.map((comment) =>
    serializeComment(comment, currentUserId, {
      isLiked: likedIds.has(comment._id.toString()),
    }),
  );

  return {
    items,
    pagination: {
      page: safePage,
      limit: safeLimit,
      count: items.length,
      total,
    },
  };
};

export const getLatestComment = async (postId) =>
  Comment.findOne({ post: postId })
    .sort({ createdAt: -1 })
    .populate('author', 'username fullName avatarUrl');

export const getLatestCommentsForPosts = async (postIds) => {
  if (!postIds?.length) {
    return new Map();
  }

  const objectIds = postIds;

  const latest = await Comment.aggregate([
    { $match: { post: { $in: objectIds } } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$post',
        commentId: { $first: '$_id' },
      },
    },
  ]);

  if (!latest.length) {
    return new Map();
  }

  const commentIds = latest.map((item) => item.commentId);

  const comments = await Comment.find({ _id: { $in: commentIds } })
    .populate('author', 'username fullName avatarUrl');

  const commentMap = new Map(
    comments.map((comment) => [comment._id.toString(), comment]),
  );

  return new Map(
    latest.map((item) => [
      item._id.toString(),
      commentMap.get(item.commentId.toString()),
    ]),
  );
};

export const isUserAllowedToComment = async ({ userId, postId }) => {
  const post = await Post.findById(postId).select('_id');
  return Boolean(post);
};
