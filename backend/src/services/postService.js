import mongoose from 'mongoose';
import Post from '../models/postModel.js';
import MediaAsset from '../models/mediaAssetModel.js';
import Follow from '../models/followModel.js';
import User from '../models/userModel.js';
import Comment from '../models/commentModel.js';
import Like from '../models/likeModel.js';
import { uploadBufferToS3, deleteFromS3 } from './s3Service.js';
import AppError from '../utils/appError.js';
import { sanitizeText } from '../utils/sanitize.js';
import { createNotification } from './notificationService.js';
import { emitToUsers } from '../utils/realtime.js';
import {
  getLikedPostIds,
  getLikedCommentIds,
  isPostLikedByUser,
  isCommentLikedByUser,
} from './likeService.js';
import {
  getLatestComment,
  getLatestCommentsForPosts,
  serializeComment,
} from './commentService.js';

const populatePost = (query) =>
  query
    .populate('author', 'username fullName avatarUrl followersCount followingCount postsCount')
    .populate('media');

export const serializePost = (post, currentUserId, extra = {}) => ({
  id: post.id,
  caption: post.caption ?? '',
  media: (post.media ?? []).map((item) => ({
    id: item.id,
    url: item.url,
    key: item.key,
    mimeType: item.mimeType,
    size: item.size,
    createdAt: item.createdAt,
  })),
  author: post.author
    ? {
        id: post.author.id,
        username: post.author.username,
        fullName: post.author.fullName,
        avatarUrl: post.author.avatarUrl,
        followersCount: post.author.followersCount,
        followingCount: post.author.followingCount,
        postsCount: post.author.postsCount,
      }
    : null,
  likesCount: post.likesCount ?? 0,
  commentsCount: post.commentsCount ?? 0,
  createdAt: post.createdAt,
  updatedAt: post.updatedAt,
  isMine: currentUserId
    ? post.author?._id?.toString() === currentUserId.toString()
    : false,
  ...extra,
});

export const buildPostResponse = async (post, viewerId) => {
  if (!post) {
    return null;
  }

  const postId = post._id?.toString() ?? post.id?.toString();

  const [isLiked, latestComment, isFollowed] = await Promise.all([
    isPostLikedByUser(postId, viewerId),
    getLatestComment(postId),
    viewerId && post.author?._id
      ? Follow.exists({
          follower: viewerId,
          following: post.author._id,
        }).then(Boolean)
      : Promise.resolve(false),
  ]);

  let lastComment = null;
  if (latestComment) {
    const isCommentLiked = await isCommentLikedByUser(
      latestComment._id,
      viewerId,
    );
    lastComment = serializeComment(latestComment, viewerId, {
      isLiked: isCommentLiked,
    });
  }

  return serializePost(post, viewerId, {
    isLiked,
    lastComment,
    isFollowed,
  });
};

export const uploadPostMedia = async ({ files, owner, folder = 'posts' }) => {
  if (!files || files.length === 0) {
    throw new AppError('At least one image is required', 400);
  }

  const prepared = await Promise.all(
    files.map(async (file) => {
      const { key, url } = await uploadBufferToS3(file.buffer, file.mimetype, folder);
      return {
        owner,
        key,
        url,
        mimeType: file.mimetype,
        size: file.size,
      };
    }),
  );

  const assets = await MediaAsset.insertMany(prepared);
  return assets;
};

export const deleteMediaAssets = async (assetIds) => {
  if (!assetIds?.length) {
    return;
  }

  const assets = await MediaAsset.find({ _id: { $in: assetIds } });
  await Promise.all(
    assets.map(async (asset) => {
      await deleteFromS3(asset.key);
    }),
  );
  await MediaAsset.deleteMany({ _id: { $in: assetIds } });
};

export const getFollowingIds = async (userId) => {
  const follows = await Follow.find({ follower: userId }).select('following');
  return follows.map((f) => f.following.toString());
};

export const notifyFollowersAboutPost = async ({ authorId, post }) => {
  const followers = await Follow.find({ following: authorId }).select('follower');
  if (!followers.length) {
    return;
  }

  const followerIds = followers.map((f) => f.follower);

  await Promise.all(
    followerIds.map((followerId) =>
      createNotification({
        userId: followerId,
        actorId: authorId,
        type: 'new_post',
        entityId: post._id,
        entityType: 'Post',
        metadata: { postId: post._id },
      }),
    ),
  );

  emitToUsers(
    'post:new',
    serializePost(post, null, { isLiked: false, lastComment: null }),
    followerIds,
  );
};

export const createPost = async ({ authorId, caption, files }) => {
  const assets = await uploadPostMedia({ files, owner: authorId, folder: 'posts' });
  const post = await Post.create({
    author: authorId,
    caption: sanitizeText(caption),
    media: assets.map((asset) => asset._id),
  });
  const fullPost = await populatePost(Post.findById(post._id));
  return fullPost;
};

export const updatePost = async ({ postId, authorId, caption, keepMediaIds, newFiles }) => {
  const post = await populatePost(Post.findOne({ _id: postId, author: authorId }));
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const keepIds = keepMediaIds?.map((id) => id.toString()) ?? [];
  const currentIds = post.media.map((item) => item._id.toString());

  const removableIds = currentIds.filter((id) => !keepIds.includes(id));
  if (removableIds.length) {
    await deleteMediaAssets(removableIds);
  }

  let updatedMediaIds = currentIds.filter((id) => keepIds.includes(id));

  if (newFiles?.length) {
    const newAssets = await uploadPostMedia({ files: newFiles, owner: authorId, folder: 'posts' });
    updatedMediaIds = [...updatedMediaIds, ...newAssets.map((asset) => asset._id.toString())];
  }

  if (caption !== undefined) {
    post.caption = sanitizeText(caption);
  }
  post.media = updatedMediaIds.map((id) => new mongoose.Types.ObjectId(id));
  await post.save();

  return populatePost(Post.findById(post._id));
};

export const deletePost = async ({ postId, authorId }) => {
  const post = await populatePost(Post.findOne({ _id: postId, author: authorId }));
  if (!post) {
    throw new AppError('Post not found', 404);
  }

  const mediaIds = post.media.map((item) => item._id);
  await post.deleteOne();
  await deleteMediaAssets(mediaIds);
  await Comment.deleteMany({ post: post._id });
  await Like.deleteMany({ post: post._id });
  return post;
};

export const getPostById = async ({ postId }) =>
  populatePost(Post.findById(postId));

const interleaveRecommended = (basePosts, recommendedPosts) => {
  if (!recommendedPosts.length) {
    return basePosts.map((post) => ({ post, extra: {} }));
  }

  const result = [];
  let recommendedIndex = 0;

  basePosts.forEach((post, index) => {
    result.push({ post, extra: {} });
    if ((index + 1) % 4 === 0 && recommendedIndex < recommendedPosts.length) {
      result.push({ post: recommendedPosts[recommendedIndex], extra: { isRecommended: true } });
      recommendedIndex += 1;
    }
  });

  while (recommendedIndex < recommendedPosts.length) {
    result.push({ post: recommendedPosts[recommendedIndex], extra: { isRecommended: true } });
    recommendedIndex += 1;
  }

  return result;
};

export const getFeed = async ({ userId, page = 1, limit = 10 }) => {
  const followingIds = await getFollowingIds(userId);
  const followingSet = new Set(followingIds);
  const authorIds = [userId.toString(), ...followingIds];
  const objectIds = authorIds.map((id) => new mongoose.Types.ObjectId(id));

  const skip = (Number(page) - 1) * Number(limit);

  const feedPosts = await populatePost(
    Post.find({ author: { $in: objectIds } })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
  );

  const recommendedSlots = Math.ceil(feedPosts.length / 4);
  let recommendedPosts = [];

  if (recommendedSlots > 0) {
    const excludedAuthorIds = authorIds.map((id) => new mongoose.Types.ObjectId(id));
    const recommendedIds = await Post.aggregate([
      { $match: { author: { $nin: excludedAuthorIds } } },
      { $sample: { size: recommendedSlots } },
    ]);
    const ids = recommendedIds.map((doc) => doc._id);
    recommendedPosts = ids.length
      ? await populatePost(Post.find({ _id: { $in: ids } }))
      : [];
  }

  const combined = interleaveRecommended(feedPosts, recommendedPosts);
  const allPostIds = combined.map(({ post }) => post._id.toString());

  const [likedPostIds, latestCommentsMap] = await Promise.all([
    getLikedPostIds({ userId, postIds: allPostIds }),
    getLatestCommentsForPosts(allPostIds),
  ]);

  const lastCommentDocs = Array.from(latestCommentsMap.values()).filter(Boolean);
  const lastCommentIds = lastCommentDocs.map((comment) => comment._id);
  const likedCommentIds = await getLikedCommentIds({
    userId,
    commentIds: lastCommentIds,
  });

  return combined.map(({ post, extra }) => {
    const postId = post._id.toString();
    const lastCommentDoc = latestCommentsMap.get(postId);
    const lastComment = lastCommentDoc
      ? serializeComment(lastCommentDoc, userId, {
          isLiked: likedCommentIds.has(lastCommentDoc._id.toString()),
        })
      : null;

    return serializePost(post, userId, {
      ...extra,
      isLiked: likedPostIds.has(postId),
      lastComment,
      isFollowed: post.author?._id
        ? followingSet.has(post.author._id.toString())
        : false,
    });
  });
};

export const getExplorePosts = async ({ userId, limit = 20 }) => {
  const viewerId = userId ? userId.toString() : null;
  const followingIds = viewerId ? await getFollowingIds(userId) : [];
  const excludeAuthorIds = viewerId
    ? [new mongoose.Types.ObjectId(viewerId)]
    : [];

  const pipeline = [];
  if (excludeAuthorIds.length) {
    pipeline.push({ $match: { author: { $nin: excludeAuthorIds } } });
  }
  pipeline.push({ $sample: { size: Number(limit) } });

  const sampled = await Post.aggregate(pipeline);

  if (!sampled.length) {
    return [];
  }

  const ids = sampled.map((doc) => doc._id);
  const posts = await populatePost(Post.find({ _id: { $in: ids } }));
  const postIds = posts.map((post) => post._id.toString());

  const [likedPostIds, latestCommentsMap] = await Promise.all([
    getLikedPostIds({ userId, postIds }),
    getLatestCommentsForPosts(postIds),
  ]);

  const lastCommentDocs = Array.from(latestCommentsMap.values()).filter(Boolean);
  const likedCommentIds = await getLikedCommentIds({
    userId,
    commentIds: lastCommentDocs.map((comment) => comment._id),
  });

  const followingSet = new Set(followingIds.map((id) => id.toString()));

  return posts.map((post) => {
    const postId = post._id.toString();
    const lastCommentDoc = latestCommentsMap.get(postId);
    const authorId = post.author?._id?.toString() ?? null;
    const isFollowed = authorId ? followingSet.has(authorId) : false;
    return serializePost(post, userId, {
      isRecommended: !isFollowed,
      isLiked: likedPostIds.has(postId),
      isFollowed,
      lastComment: lastCommentDoc
        ? serializeComment(lastCommentDoc, userId, {
            isLiked: likedCommentIds.has(lastCommentDoc._id.toString()),
          })
        : null,
    });
  });
};
export const getUserPosts = async ({ username, viewerId, page = 1, limit = 12 }) => {
  const user = await User.findOne({ username: username.toLowerCase() });
  if (!user) {
    throw new AppError('User not found', 404);
  }

  const skip = (Number(page) - 1) * Number(limit);

  const posts = await populatePost(
    Post.find({ author: user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
  );

  const postIds = posts.map((post) => post._id.toString());
  const [likedPostIds, latestCommentsMap] = await Promise.all([
    getLikedPostIds({ userId: viewerId, postIds }),
    getLatestCommentsForPosts(postIds),
  ]);

  const commentDocs = Array.from(latestCommentsMap.values()).filter(Boolean);
  const likedCommentIds = await getLikedCommentIds({
    userId: viewerId,
    commentIds: commentDocs.map((comment) => comment._id),
  });

  return posts.map((post) => {
    const postId = post._id.toString();
    const lastCommentDoc = latestCommentsMap.get(postId);
    return serializePost(post, viewerId, {
      isLiked: likedPostIds.has(postId),
      lastComment: lastCommentDoc
        ? serializeComment(lastCommentDoc, viewerId, {
            isLiked: likedCommentIds.has(lastCommentDoc._id.toString()),
          })
        : null,
    });
  });
};
