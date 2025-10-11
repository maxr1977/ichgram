import { createSlice, createAsyncThunk, nanoid } from '@reduxjs/toolkit';
import apiClient from '@/services/apiClient.js';

const INITIAL_PAGE = 1;
const PAGE_LIMIT = 20;

const createInitialState = () => ({
  items: [],
  status: 'idle',
  error: null,
  hasMore: true,
  nextPage: INITIAL_PAGE,
  unreadCount: 0,
});

const initialState = createInitialState();

const normalizeNotification = (notification) => {
  const metadata = notification?.metadata ? { ...notification.metadata } : {};
  if (metadata.postId) {
    metadata.postId = metadata.postId.toString();
  } else if (metadata.post) {
    metadata.postId = metadata.post.toString();
  }

  const previewUrl = notification.previewUrl ?? metadata.previewUrl ?? null;

  return {
    id: notification.id ?? notification._id ?? nanoid(),
    type: notification.type,
    isRead: Boolean(notification.isRead),
    readAt: notification.readAt ?? null,
    createdAt: notification.createdAt ?? null,
    metadata,
    actor: notification.actor ?? null,
    entityId: notification.entityId ?? null,
    entityType: notification.entityType ?? null,
    previewUrl,
  };
};

export const fetchNotifications = createAsyncThunk(
  'notifications/fetchNotifications',
  async ({ page = INITIAL_PAGE, limit = PAGE_LIMIT } = {}, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/notifications', {
        params: { page, limit },
      });
      const data = response.data?.data ?? {};
      return {
        items: (data.items ?? []).map(normalizeNotification),
        totalUnread: data.totalUnread ?? 0,
        page,
        limit,
      };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to load notifications';
      return rejectWithValue(message);
    }
  },
);

export const markNotificationRead = createAsyncThunk(
  'notifications/markNotificationRead',
  async ({ notificationId }, { rejectWithValue }) => {
    try {
      const response = await apiClient.patch(`/notifications/${notificationId}/read`);
      const notification = response.data?.data?.notification;
      return notification ? normalizeNotification(notification) : { id: notificationId, isRead: true };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to mark notification as read';
      return rejectWithValue(message);
    }
  },
);

export const markAllNotificationsRead = createAsyncThunk(
  'notifications/markAllNotificationsRead',
  async (_, { rejectWithValue }) => {
    try {
      await apiClient.patch('/notifications/read-all');
      return true;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to mark notifications as read';
      return rejectWithValue(message);
    }
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    resetNotificationsState: () => createInitialState(),
    prependNotification(state, action) {
      const notification = normalizeNotification(action.payload);
      const exists = state.items.some((item) => item.id === notification.id);
      if (!exists) {
        state.items = [notification, ...state.items];
        if (!notification.isRead) {
          state.unreadCount += 1;
        }
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state, action) => {
        const { page = INITIAL_PAGE } = action.meta.arg ?? {};
        state.error = null;
        if (page <= INITIAL_PAGE) {
          state.status = 'loading';
        } else {
          state.status = 'loading-more';
        }
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { items, page, limit, totalUnread } = action.payload;
        if (page <= INITIAL_PAGE) {
          state.items = items;
        } else {
          const existingIds = new Set(state.items.map((item) => item.id));
          state.items = [
            ...state.items,
            ...items.filter((item) => !existingIds.has(item.id)),
          ];
        }
        state.status = 'succeeded';
        state.error = null;
        state.nextPage = (page ?? INITIAL_PAGE) + 1;
        state.hasMore = (items?.length ?? 0) === (limit ?? PAGE_LIMIT);
        state.unreadCount = totalUnread ?? state.unreadCount;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(markNotificationRead.fulfilled, (state, action) => {
        const notification = normalizeNotification(action.payload);
        const wasUnread = state.items.find((item) => item.id === notification.id)?.isRead === false;
        state.items = state.items.map((item) => (
          item.id === notification.id
            ? { ...item, isRead: true, readAt: notification.readAt ?? new Date().toISOString() }
            : item
        ));
        if (wasUnread) {
          state.unreadCount = Math.max(state.unreadCount - 1, 0);
        }
      })
      .addCase(markAllNotificationsRead.fulfilled, (state) => {
        state.items = state.items.map((item) => ({
          ...item,
          isRead: true,
          readAt: item.readAt ?? new Date().toISOString(),
        }));
        state.unreadCount = 0;
      });
  },
});

export const {
  resetNotificationsState,
  prependNotification,
} = notificationsSlice.actions;

export const selectNotificationsState = (state) => state.notifications;

export default notificationsSlice.reducer;