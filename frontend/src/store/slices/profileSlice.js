import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/apiClient.js';
import { showToast } from './toastSlice.js';
import { updateUserProfile } from './authSlice.js';
import {
  togglePostLike,
  applyPostLikeUpdate,
  applyPostCommentUpdate,
  followAuthor,
  fetchPostById,
} from './postSlice.js';

const createInitialState = () => ({
  profile: null,
  isCurrentUser: false,
  status: 'idle',
  error: null,
  posts: {
    items: [],
    status: 'idle',
    error: null,
    hasMore: true,
    nextPage: 1,
    isLoadingMore: false,
  },
  followers: {
    items: [],
    status: 'idle',
    error: null,
    hasMore: false,
    page: 1,
  },
  following: {
    items: [],
    status: 'idle',
    error: null,
    hasMore: false,
    page: 1,
  },
  followStatusById: {},
  updateStatus: 'idle',
  updateError: null,
});

const initialState = createInitialState();

const updatePostInState = (state, postId, updater) => {
  if (!postId || typeof updater !== 'function') {
    return;
  }
  const index = state.posts.items.findIndex((post) => post.id === postId);
  if (index === -1) {
    return;
  }
  const current = state.posts.items[index];
  state.posts.items[index] = {
    ...current,
    ...updater(current),
  };
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async ({ username }, { getState, rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/users/${username}`);
      const { user: loadedProfile, isCurrentUser: isCurrentUserFromAPI } = response.data.data;
      const authUser = getState().auth.user;

      let correctedIsCurrentUser = isCurrentUserFromAPI;
      if (isCurrentUserFromAPI === false && loadedProfile?.username === authUser?.username) {
        correctedIsCurrentUser = true;
      }

      return { user: loadedProfile, isCurrentUser: correctedIsCurrentUser };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to load profile';
      return rejectWithValue(message);
    }
  },
);

export const fetchProfilePosts = createAsyncThunk(
  'profile/fetchProfilePosts',
  async ({ username, page = 1, limit = 12 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/posts/user/${username}`, {
        params: { page, limit },
      });
      return {
        items: response.data?.data?.items ?? [],
        page,
        limit,
      };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to load posts';
      return rejectWithValue(message);
    }
  },
);

export const followProfile = createAsyncThunk(
  'profile/followProfile',
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

export const unfollowProfile = createAsyncThunk(
  'profile/unfollowProfile',
  async ({ userId }, { rejectWithValue, dispatch }) => {
    try {
      await apiClient.delete(`/follows/${userId}`);
      dispatch(showToast({ type: 'info', message: 'Unfollowed user' }));
      return { userId };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to unfollow user';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue({ message, userId });
    }
  },
);

const buildFollowListThunk = (path) =>
  createAsyncThunk(
    `profile/${path}`,
    async ({ userId, page = 1, limit = 20 }, { rejectWithValue }) => {
      try {
        const response = await apiClient.get(`/follows/${userId}/${path}`, {
          params: { page, limit },
        });
        const items = response.data?.data?.items ?? [];
        return {
          items,
          page,
          limit,
        };
      } catch (error) {
        const message = error.response?.data?.message ?? `Failed to load ${path}`;
        return rejectWithValue(message);
      }
    },
  );

export const fetchFollowers = buildFollowListThunk('followers');
export const fetchFollowing = buildFollowListThunk('following');

export const updateProfileDetails = createAsyncThunk(
  'profile/updateProfileDetails',
  async ({ fullName, bio, website, username, avatarFile }, { getState, dispatch, rejectWithValue }) => {
    try {
      const formData = new FormData();
      if (fullName !== undefined) formData.append('fullName', fullName);
      if (bio !== undefined) formData.append('bio', bio);
      if (website !== undefined) formData.append('website', website);
      if (username !== undefined) formData.append('username', username);
      if (avatarFile) {
        formData.append('avatar', avatarFile);
      }

      const response = await apiClient.patch('/users/me', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const user = response.data?.data?.user;
      dispatch(showToast({ type: 'success', message: 'Profile updated' }));
      const { auth } = getState();
      if (auth?.accessToken) {
        dispatch(updateUserProfile(user));
      }
      return user;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to update profile';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {
    resetProfileState: () => createInitialState(),
    clearFollowLists(state) {
      state.followers = { items: [], status: 'idle', error: null, hasMore: false, page: 1 };
      state.following = { items: [], status: 'idle', error: null, hasMore: false, page: 1 };
    },
    removeProfilePost(state, action) {
      const postId = action.payload;
      state.posts.items = state.posts.items.filter((post) => post.id !== postId);
      if (state.profile) {
        state.profile.postsCount = Math.max((state.profile.postsCount ?? 1) - 1, 0);
      }
    },
    upsertProfilePost(state, action) {
      const post = action.payload;
      if (!post?.id) return;
      const index = state.posts.items.findIndex((item) => item.id === post.id);
      if (index >= 0) {
        state.posts.items[index] = { ...state.posts.items[index], ...post };
      } else {
        state.posts.items = [post, ...state.posts.items];
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        const incomingUsername = action.meta.arg?.username ?? null;
        const currentUsername = state.profile?.username ?? null;
        if (!currentUsername || currentUsername !== incomingUsername) {
          state.posts = {
            items: [],
            status: 'idle',
            error: null,
            hasMore: true,
            nextPage: 1,
            isLoadingMore: false,
          };
        }
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.profile = action.payload.user;
        state.isCurrentUser = Boolean(action.payload.isCurrentUser);
        state.error = null;
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
        state.profile = null;
        state.isCurrentUser = false;
        state.posts = {
          items: [],
          status: 'idle',
          error: null,
          hasMore: true,
          nextPage: 1,
          isLoadingMore: false,
        };
      })
      .addCase(fetchProfilePosts.pending, (state, action) => {
        const { page = 1 } = action.meta.arg ?? {};
        if (page <= 1) {
          state.posts.status = 'loading';
          state.posts.error = null;
          state.posts.hasMore = true;
          state.posts.nextPage = 1;
          state.posts.items = [];
        } else {
          state.posts.isLoadingMore = true;
        }
      })
      .addCase(fetchProfilePosts.fulfilled, (state, action) => {
        const { items, page, limit } = action.payload;
        const normalized = (items ?? [])
          .filter(Boolean)
          .map((post) => {
            const fallbackId =
              typeof crypto !== 'undefined' && crypto.randomUUID
                ? crypto.randomUUID()
                : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
            return {
              ...post,
              id: (post.id ?? post._id ?? fallbackId).toString(),
            };
          });

        if (page <= 1) {
          state.posts.items = normalized;
        } else {
          const existingIds = new Set(state.posts.items.map((post) => post.id));
          state.posts.items = [
            ...state.posts.items,
            ...normalized.filter((post) => !existingIds.has(post.id)),
          ];
        }
        state.posts.status = 'succeeded';
        state.posts.error = null;
        state.posts.isLoadingMore = false;
        state.posts.nextPage = (page ?? 1) + 1;
        state.posts.hasMore = (normalized.length ?? 0) === limit;
      })
      .addCase(fetchProfilePosts.rejected, (state, action) => {
        const { page = 1 } = action.meta.arg ?? {};
        if (page <= 1) {
          state.posts.status = 'failed';
          state.posts.items = [];
        }
        state.posts.isLoadingMore = false;
        state.posts.error = action.payload ?? action.error.message;
      })
      .addCase(followProfile.pending, (state, action) => {
        const { userId } = action.meta.arg;
        state.followStatusById[userId] = 'loading';
      })
      .addCase(followProfile.fulfilled, (state, action) => {
        const { userId } = action.payload;
        state.followStatusById[userId] = 'succeeded';
        if (state.profile && state.profile.id === userId) {
          state.profile.isFollowed = true;
          state.profile.followersCount = (state.profile.followersCount ?? 0) + 1;
        }
      })
      .addCase(followProfile.rejected, (state, action) => {
        const { userId } = action.payload;
        state.followStatusById[userId] = 'failed';
      })
      .addCase(unfollowProfile.pending, (state, action) => {
        const { userId } = action.meta.arg;
        state.followStatusById[userId] = 'loading';
      })
      .addCase(unfollowProfile.fulfilled, (state, action) => {
        const { userId } = action.payload;
        state.followStatusById[userId] = 'succeeded';
        if (state.profile && state.profile.id === userId) {
          state.profile.isFollowed = false;
          state.profile.followersCount = Math.max((state.profile.followersCount ?? 1) - 1, 0);
        }
      })
      .addCase(unfollowProfile.rejected, (state, action) => {
        const { userId } = action.payload;
        state.followStatusById[userId] = 'failed';
      })
      .addCase(togglePostLike.fulfilled, (state, action) => {
        const { postId, likesCount, liked } = action.payload ?? {};
        if (!postId) return;
        updatePostInState(state, postId, (post) => {
          const update = { likesCount: likesCount ?? post.likesCount ?? 0 };
          if (typeof liked === 'boolean') {
            update.isLiked = liked;
          }
          return update;
        });
      })
      .addCase(applyPostLikeUpdate, (state, action) => {
        const {
          postId,
          likesCount,
          likedBy,
          liked,
          viewerId,
        } = action.payload ?? {};
        if (!postId) return;
        updatePostInState(state, postId, (post) => {
          const update = { likesCount: likesCount ?? post.likesCount ?? 0 };
          if (typeof liked === 'boolean' && likedBy && viewerId && likedBy === viewerId) {
            update.isLiked = liked;
          }
          return update;
        });
      })
      .addCase(applyPostCommentUpdate, (state, action) => {
        const { postId, commentsCount, lastComment } = action.payload ?? {};
        if (!postId) return;
        updatePostInState(state, postId, (post) => {
          const update = { commentsCount: commentsCount ?? post.commentsCount ?? 0 };
          if (lastComment !== undefined) {
            update.lastComment = lastComment;
          }
          return update;
        });
      })
      .addCase(followAuthor.fulfilled, (state, action) => {
        const { userId } = action.payload ?? {};
        if (!userId) return;
        state.posts.items = state.posts.items.map((post) => (
          post.author?.id === userId ? { ...post, isFollowed: true } : post
        ));
      })
      .addCase(fetchFollowers.pending, (state) => {
        state.followers.status = 'loading';
        state.followers.error = null;
      })
      .addCase(fetchFollowers.fulfilled, (state, action) => {
        const { items, page, limit } = action.payload;
        state.followers.status = 'succeeded';
        state.followers.items = page <= 1 ? items : [...state.followers.items, ...items];
        state.followers.page = page + 1;
        state.followers.hasMore = (items?.length ?? 0) === limit;
      })
      .addCase(fetchFollowers.rejected, (state, action) => {
        state.followers.status = 'failed';
        state.followers.error = action.payload ?? action.error.message;
      })
      .addCase(fetchFollowing.pending, (state) => {
        state.following.status = 'loading';
        state.following.error = null;
      })
      .addCase(fetchFollowing.fulfilled, (state, action) => {
        const { items, page, limit } = action.payload;
        state.following.status = 'succeeded';
        state.following.items = page <= 1 ? items : [...state.following.items, ...items];
        state.following.page = page + 1;
        state.following.hasMore = (items?.length ?? 0) === limit;
      })
      .addCase(fetchFollowing.rejected, (state, action) => {
        state.following.status = 'failed';
        state.following.error = action.payload ?? action.error.message;
      })
      .addCase(updateProfileDetails.pending, (state) => {
        state.updateStatus = 'loading';
        state.updateError = null;
      })
      .addCase(updateProfileDetails.fulfilled, (state, action) => {
        state.updateStatus = 'succeeded';
        state.updateError = null;
        if (state.profile && state.isCurrentUser) {
          state.profile = {
            ...state.profile,
            ...action.payload,
            isFollowed: false,
          };
        }
      })
      .addCase(updateProfileDetails.rejected, (state, action) => {
        state.updateStatus = 'failed';
        state.updateError = action.payload ?? action.error.message;
      })
      .addCase(fetchPostById.fulfilled, (state, action) => {
        const post = action.payload;
        if (!post?.id) {
          return;
        }
        const index = state.posts.items.findIndex((item) => item.id === post.id);
        if (index >= 0) {
          state.posts.items[index] = { ...state.posts.items[index], ...post };
        } else {
          state.posts.items = [post, ...state.posts.items];
        }
      });
  },
});

export const profileReducer = profileSlice.reducer;
export const {
  resetProfileState,
  clearFollowLists,
  removeProfilePost,
  upsertProfilePost,
} = profileSlice.actions;

export const selectProfilePosts = (state) => state.profile.posts.items;

export default profileReducer;