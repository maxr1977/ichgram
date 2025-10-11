import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import apiClient from '@/services/apiClient.js';
import { logout, clearAuthState } from './authSlice.js';
import { showToast } from './toastSlice.js';

export const createPost = createAsyncThunk(
  'posts/createPost',
  async ({ caption, images }, { rejectWithValue, dispatch }) => {
    try {
      const form = new FormData();
      if (caption) form.append('caption', caption);
      (images || []).forEach((file) => form.append('images', file));

      const response = await apiClient.post('/posts', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch(showToast({ type: 'success', message: 'Post created successfully' }));
      return response.data.data.post;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to create post';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  },
);

export const fetchFeed = createAsyncThunk(
  'posts/fetchFeed',
  async ({ page = 1, limit = 10 } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/posts/feed', {
        params: { page, limit },
      });
      return {
        items: response.data.data.items ?? [],
        page,
        limit,
      };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to load feed';
      return rejectWithValue(message);
    }
  },
);

export const fetchExplore = createAsyncThunk(
  'posts/fetchExplore',
  async ({ limit = 21 } = {}, { getState, rejectWithValue }) => {
    try {
      const response = await apiClient.get('/posts/explore', {
        params: { limit },
      });
      const items = response.data?.data?.items ?? [];
      return items;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to load explore feed';
      return rejectWithValue(message);
    }
  },
);

export const togglePostLike = createAsyncThunk(
  'posts/togglePostLike',
  async ({ postId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post(`/likes/posts/${postId}`);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to toggle like';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue({ message, postId });
    }
  },
);

export const updatePost = createAsyncThunk(
  'posts/updatePost',
  async ({ postId, caption, keepMediaIds = [], images = [] }, { rejectWithValue, dispatch }) => {
    try {
      const form = new FormData();
      if (caption !== undefined) {
        form.append('caption', caption);
      }
      keepMediaIds.forEach((id) => form.append('keepMediaIds', id));
      images.forEach((file) => form.append('images', file));

      const response = await apiClient.patch(`/posts/${postId}`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      dispatch(showToast({ type: 'success', message: 'Post updated' }));
      return response.data.data.post;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to update post';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue({ message, postId });
    }
  },
);

export const deletePost = createAsyncThunk(
  'posts/deletePost',
  async ({ postId }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/posts/${postId}`);
      dispatch(showToast({ type: 'success', message: 'Post deleted' }));
      return { postId };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to delete post';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue({ message, postId });
    }
  },
);

export const followAuthor = createAsyncThunk(
  'posts/followAuthor',
  async ({ userId }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.post(`/follows/${userId}`);
      dispatch(showToast({ type: 'success', message: 'Started following user' }));
      return { userId };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to follow user';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue({ message, userId });
    }
  },
);

export const fetchPostById = createAsyncThunk(
  'posts/fetchPostById',
  async ({ postId }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.get(`/posts/${postId}`);
      return response.data.data.post;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to fetch post';
      return rejectWithValue({ message, postId });
    }
  },
);

const initialState = {
  createStatus: 'idle',
  createError: null,
  lastCreated: null,
  feed: {
    ids: [],
    entities: {},
    status: 'idle',
    error: null,
    isLoadingMore: false,
    nextPage: 1,
    hasMore: true,
  },
  explore: {
    ids: [],
    entities: {},
    status: 'idle',
    error: null,
  },
};

const COLLECTION_KEYS = ['feed', 'explore'];

const resetCollection = (collection, { withPagination = false } = {}) => {
  if (!collection) return;
  collection.ids = [];
  collection.entities = {};
  collection.status = 'idle';
  collection.error = null;
  if (withPagination) {
    collection.isLoadingMore = false;
    collection.nextPage = 1;
    collection.hasMore = true;
  }
};

const forEachEntity = (state, postId, callback) => {
  if (!postId || typeof callback !== 'function') {
    return;
  }
  COLLECTION_KEYS.forEach((key) => {
    const collection = state[key];
    const entity = collection?.entities?.[postId];
    if (entity) {
      callback(entity, collection, key);
    }
  });
};

const postSlice = createSlice({
  name: 'posts',
  initialState,
  reducers: {
    upsertFeedPost(state, action) {
      const post = action.payload;
      if (!post?.id) return;
      const existing = state.feed.entities[post.id];
      state.feed.entities[post.id] = { ...existing, ...post };
      state.feed.ids = [post.id, ...state.feed.ids.filter((id) => id !== post.id)];
    },
    applyPostLikeUpdate(state, action) {
      const {
        postId,
        likesCount,
        likedBy,
        liked,
        viewerId,
      } = action.payload ?? {};
      forEachEntity(state, postId, (post) => {
        post.likesCount = likesCount ?? post.likesCount ?? 0;
        if (typeof liked === 'boolean' && likedBy && viewerId && likedBy === viewerId) {
          post.isLiked = liked;
        }
      });
    },
    applyPostCommentUpdate(state, action) {
      const { postId, commentsCount, lastComment } = action.payload ?? {};
      forEachEntity(state, postId, (post) => {
        post.commentsCount = commentsCount ?? post.commentsCount ?? 0;
        if (lastComment !== undefined) {
          post.lastComment = lastComment;
        }
      });
    },
    markAuthorFollowed(state, action) {
      const { postId } = action.payload ?? {};
      forEachEntity(state, postId, (post) => {
        post.isFollowed = true;
      });
    },
    removeFeedPost(state, action) {
      const { postId } = action.payload ?? {};
      if (!postId) return;
      COLLECTION_KEYS.forEach((key) => {
        const collection = state[key];
        if (!collection?.entities?.[postId]) {
          return;
        }
        delete collection.entities[postId];
        collection.ids = collection.ids.filter((id) => id !== postId);
      });
    },
    clearFeed(state) {
      COLLECTION_KEYS.forEach((key) => {
        const isFeed = key === 'feed';
        resetCollection(state[key], { withPagination: isFeed });
      });
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(createPost.fulfilled, (state, action) => {
        state.createStatus = 'succeeded';
        state.lastCreated = action.payload;
        if (action.payload?.id) {
          state.feed.entities[action.payload.id] = action.payload;
          state.feed.ids = [action.payload.id, ...state.feed.ids];
        }
      })
      .addCase(fetchFeed.pending, (state, action) => {
        const { page = 1 } = action.meta.arg ?? {};
        if (page <= 1) {
          state.feed.status = 'loading';
        } else {
          state.feed.isLoadingMore = true;
        }
        state.feed.error = null;
      })
      
      .addCase(fetchFeed.fulfilled, (state, action) => {
        const { items, page, limit } = action.payload;

        if (page <= 1) {
          
          state.feed.entities = {};
          state.feed.ids = [];
          items.forEach(post => {
            if (post?.id) {
              state.feed.entities[post.id] = post;
              state.feed.ids.push(post.id);
            }
          });
        } else {
          
          items.forEach(post => {
            if (post?.id && !state.feed.entities[post.id]) {
              state.feed.entities[post.id] = post;
              state.feed.ids.push(post.id);
            }
          });
        }
        
        state.feed.status = 'succeeded';
        state.feed.isLoadingMore = false;
        state.feed.nextPage = page + 1;
        state.feed.hasMore = items.length >= limit;
      })
      .addCase(fetchFeed.rejected, (state, action) => {
        state.feed.isLoadingMore = false;
        state.feed.status = 'failed';
        state.feed.error = action.payload ?? action.error.message;
      })
      .addCase(fetchExplore.fulfilled, (state, action) => {
        const items = action.payload ?? [];
        state.explore.entities = {};
        state.explore.ids = [];
        items.forEach((post) => {
          if (post?.id) {
            state.explore.entities[post.id] = post;
            state.explore.ids.push(post.id);
          }
        });
        state.explore.status = items.length ? 'succeeded' : 'empty';
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId, likesCount, liked } = action.payload ?? {};
        forEachEntity(state, postId, (post) => {
          post.likesCount = likesCount ?? post.likesCount ?? 0;
          if (typeof liked === 'boolean') {
            post.isLiked = liked;
          }
        });
      })
      .addCase(followAuthor.fulfilled, (state, action) => {
        const { userId } = action.payload ?? {};
        if (!userId) return;
        COLLECTION_KEYS.forEach((key) => {
          const collection = state[key];
          if (!collection) return;
          Object.values(collection.entities).forEach((post) => {
            if (post?.author?.id === userId) {
              post.isFollowed = true;
            }
          });
        });
      })
      .addCase(updatePost.fulfilled, (state, action) => {
        const post = action.payload;
        forEachEntity(state, post.id, (existingPost) => {
            Object.assign(existingPost, post);
        });
      })
      .addCase(deletePost.fulfilled, (state, action) => {
        const { postId } = action.payload ?? {};
        forEachEntity(state, postId, (post, collection) => {
            delete collection.entities[postId];
            collection.ids = collection.ids.filter(id => id !== postId);
        });
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        const post = action.payload;
        if (!post?.id) return;
        forEachEntity(state, post.id, (existingPost) => {
            Object.assign(existingPost, post);
        });
      })
      .addCase(logout.fulfilled, (state) => {
        postSlice.caseReducers.clearFeed(state);
      })
      .addCase(logout.rejected, (state) => {
        postSlice.caseReducers.clearFeed(state);
      })
      .addCase(clearAuthState, (state) => {
        postSlice.caseReducers.clearFeed(state);
      });
  },
});

export const {
  upsertFeedPost,
  applyPostLikeUpdate,
  applyPostCommentUpdate,
  markAuthorFollowed,
  removeFeedPost,
  clearFeed,
} = postSlice.actions;

export default postSlice.reducer;