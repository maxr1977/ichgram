import asyncHandler from '../utils/asyncHandler.js';
import AppError from '../utils/appError.js';
import {
  createPost,
  updatePost,
  deletePost,
  getPostById,
  getFeed,
  getExplorePosts,
  getUserPosts,
  notifyFollowersAboutPost,
  buildPostResponse,
} from '../services/postService.js';

const parseArrayInput = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value;
  }
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [parsed];
  } catch (error) {
    return [value];
  }
};

export const createPostController = asyncHandler(async (req, res) => {
  const files = req.files ?? [];

  if (!files.length) {
    throw new AppError('At least one image is required', 400);
  }

  const post = await createPost({
    authorId: req.user.id,
    caption: req.body.caption ?? '',
    files,
  });

  await notifyFollowersAboutPost({ authorId: req.user._id, post });
  const payload = await buildPostResponse(post, req.user.id);

  res.status(201).json({
    status: 'success',
    data: {
      post: payload,
    },
  });
});

export const updatePostController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const keepMediaIds = parseArrayInput(req.body.keepMediaIds);
  const newFiles = req.files ?? [];

  if (!keepMediaIds.length && !newFiles.length) {
    throw new AppError('Post must contain at least one image', 400);
  }

  const post = await updatePost({
    postId,
    authorId: req.user.id,
    caption: req.body.caption,
    keepMediaIds,
    newFiles,
  });
  const payload = await buildPostResponse(post, req.user.id);

  res.json({
    status: 'success',
    data: {
      post: payload,
    },
  });
});

export const deletePostController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  await deletePost({ postId, authorId: req.user.id });

  res.json({
    status: 'success',
    message: 'Post deleted successfully',
  });
});

export const getPostController = asyncHandler(async (req, res) => {
  const { postId } = req.params;
  const post = await getPostById({ postId });

  if (!post) {
    throw new AppError('Post not found', 404);
  }
  const payload = await buildPostResponse(post, req.user?.id);

  res.json({
    status: 'success',
    data: {
      post: payload,
    },
  });
});

export const getFeedController = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10 } = req.query;
  const posts = await getFeed({
    userId: req.user.id,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    status: 'success',
    data: {
      items: posts,
    },
  });
});

export const getExploreController = asyncHandler(async (req, res) => {
  const { limit = 20 } = req.query;
  const posts = await getExplorePosts({
    userId: req.user.id,
    limit: Number(limit),
  });

  res.json({
    status: 'success',
    data: {
      items: posts,
    },
  });
});

export const getUserPostsController = asyncHandler(async (req, res) => {
  const { username } = req.params;
  const { page = 1, limit = 12 } = req.query;

  const posts = await getUserPosts({
    username,
    viewerId: req.user?.id,
    page: Number(page),
    limit: Number(limit),
  });

  res.json({
    status: 'success',
    data: {
      items: posts,
    },
  });
});
