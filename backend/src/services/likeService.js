import Like from '../models/likeModel.js';
import Post from '../models/postModel.js';
import Comment from '../models/commentModel.js';
import AppError from '../utils/appError.js';
import { createNotification } from './notificationService.js';
import { emitToUsers } from '../utils/realtime.js';

export const isPostLikedByUser = async (postId, userId) => {
  if (!userId) {
    return false;
  }
  const like = await Like.exists({ user: userId, post: postId });
  return Boolean(like);
};

export const isCommentLikedByUser = async (commentId, userId) => {
  if (!userId) {
    return false;
  }
  const like = await Like.exists({ user: userId, comment: commentId });
  return Boolean(like);
};

export const getLikedPostIds = async ({ userId, postIds }) => {
  if (!userId || !postIds?.length) {
    return new Set();
  }

  const likes = await Like.find({
    user: userId,
    post: { $in: postIds },
  }).select('post');

  return new Set(likes.map((like) => like.post.toString()));
};

export const getLikedCommentIds = async ({ userId, commentIds }) => {
  if (!userId || !commentIds?.length) {
    return new Set();
  }

  const likes = await Like.find({
    user: userId,
    comment: { $in: commentIds },
  }).select('comment');

  return new Set(likes.map((like) => like.comment.toString()));
};

export const togglePostLike = async ({ userId, postId }) => {
  const post = await Post.findById(postId).select('author likesCount');
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const existing = await Like.findOne({ user: userId, post: postId });
  let liked;
  if (existing) {
    await existing.deleteOne();
    liked = false;
  } else {
    await Like.create({ user: userId, post: postId });
    liked = true;
    await createNotification({
      userId: post.author,
      actorId: userId,
      type: 'like_post',
      entityId: postId,
      entityType: 'Post',
      metadata: { postId },
    });
  }

  const updatedPost = await Post.findById(postId).select('likesCount author');

  emitToUsers(
    'post:like',
    {
      postId: postId.toString(),
      likesCount: updatedPost.likesCount,
      likedBy: userId.toString(),
      liked,
    },
    [updatedPost.author?.toString(), userId.toString()],
  );

  return {
    liked,
    likesCount: updatedPost.likesCount,
  };
};

export const toggleCommentLike = async ({ userId, commentId }) => {
  const comment = await Comment.findById(commentId)
    .select('author likesCount post')
    .populate('post', 'author');

  if (!comment) {
    throw new AppError('Comment not found', 404);
  }

  const existing = await Like.findOne({ user: userId, comment: commentId });
  let liked;
  if (existing) {
    await existing.deleteOne();
    liked = false;
  } else {
    await Like.create({ user: userId, comment: commentId });
    liked = true;
    await createNotification({
      userId: comment.author,
      actorId: userId,
      type: 'like_comment',
      entityId: commentId,
      entityType: 'Comment',
      metadata: { postId: comment.post?._id ?? comment.post },
    });
  }

  const updatedComment = await Comment.findById(commentId).select('likesCount post');

  emitToUsers(
    'comment:like',
    {
      postId: (comment.post?._id ?? comment.post).toString(),
      commentId: commentId.toString(),
      likesCount: updatedComment.likesCount,
      likedBy: userId.toString(),
      liked,
    },
    [
      comment.author?.toString(),
      userId.toString(),
      comment.post?.author?.toString(),
    ].filter(Boolean),
  );

  return {
    liked,
    likesCount: updatedComment.likesCount,
  };
};
