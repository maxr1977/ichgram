import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/apiClient';
import { showToast } from './toastSlice';

const initialState = {
  conversations: {
    items: [],
    status: 'idle',
    error: null,
  },
  messagesByConversation: {},
  activeConversationId: null,
  typingByConversation: {},
};

export const fetchConversations = createAsyncThunk(
  'messenger/fetchConversations',
  async (_, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/conversations');
      return response.data.data.items;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const createConversation = createAsyncThunk(
  'messenger/createConversation',
  async ({ participants, name, isGroup }, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/conversations', { participants, name, isGroup });
      return response.data.data;
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const findOrCreateConversationByUsername = createAsyncThunk(
  'messenger/findOrCreateConversationByUsername',
  async (username, { dispatch, rejectWithValue }) => {
    try {
      const userResponse = await apiClient.get(`/users/${username}`);
      const targetUser = userResponse.data.data.user;
      if (!targetUser) throw new Error('User not found');

      const conversationAction = await dispatch(createConversation({ participants: [targetUser.id], isGroup: false }));
      return conversationAction.payload;
    } catch (error) {
      const message = error.message || 'Could not start conversation';
      dispatch(showToast({ type: 'error', message }));
      return rejectWithValue(message);
    }
  }
);


export const fetchMessages = createAsyncThunk(
  'messenger/fetchMessages',
  async ({ conversationId, page = 1 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get(`/messages/${conversationId}`, { params: { page, limit: 30 } });
      return { conversationId, ...response.data.data };
    } catch (error) {
      return rejectWithValue(error.response.data);
    }
  }
);

export const sendMessage = createAsyncThunk(
  'messenger/sendMessage',
  async ({ conversationId, content }, { rejectWithValue, dispatch }) => {
    try {
      const response = await apiClient.post(`/messages/${conversationId}`, { content });
      return response.data.data;
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Failed to send message' }));
      return rejectWithValue(error.response.data);
    }
  }
);

export const addParticipantsToConversation = createAsyncThunk(
    'messenger/addParticipants',
    async ({ conversationId, participants }, { dispatch, rejectWithValue }) => {
      try {
        const response = await apiClient.post(`/conversations/${conversationId}/participants`, { participants });
        dispatch(showToast({ type: 'success', message: 'Users added to the group' }));
        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to add users';
        dispatch(showToast({ type: 'error', message }));
        return rejectWithValue(message);
      }
    }
);

export const updateGroupAvatar = createAsyncThunk(
    'messenger/updateGroupAvatar',
    async ({ conversationId, avatarFile }, { dispatch, rejectWithValue }) => {
      try {
        const formData = new FormData();
        formData.append('avatar', avatarFile);
  
        const response = await apiClient.patch(`/conversations/${conversationId}/avatar`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        
        dispatch(showToast({ type: 'success', message: 'Group avatar updated' }));
        return response.data.data;
      } catch (error) {
        const message = error.response?.data?.message || 'Failed to update avatar';
        dispatch(showToast({ type: 'error', message }));
        return rejectWithValue(message);
      }
    }
);


const updateConversationInList = (state, updatedConversation) => {
    const index = state.conversations.items.findIndex(c => c.id === updatedConversation.id);
    if (index !== -1) {
        state.conversations.items = [
            ...state.conversations.items.slice(0, index),
            { ...state.conversations.items[index], ...updatedConversation },
            ...state.conversations.items.slice(index + 1),
        ];
    }
};


const messengerSlice = createSlice({
  name: 'messenger',
  initialState,
  reducers: {
    setActiveConversation: (state, action) => {
      state.activeConversationId = action.payload;
    },
    addMessage: (state, action) => {
      const message = action.payload;
      const conversationId = message.conversationId;
      if (!state.messagesByConversation[conversationId]) {
        state.messagesByConversation[conversationId] = { items: [], status: 'idle', error: null, hasMore: true };
      }
      if (!state.messagesByConversation[conversationId].items.some(m => m.id === message.id)) {
        state.messagesByConversation[conversationId].items.push(message);
      }
    },
    updateConversation: (state, action) => {
        updateConversationInList(state, action.payload);
    },
    setTyping: (state, action) => {
      const { conversationId, isTyping } = action.payload;
      state.typingByConversation[conversationId] = isTyping;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchConversations.pending, (state) => {
        state.conversations.status = 'loading';
      })
      .addCase(fetchConversations.fulfilled, (state, action) => {
        state.conversations.status = 'succeeded';
        state.conversations.items = action.payload;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.conversations.status = 'failed';
        state.conversations.error = action.payload;
      })
      .addCase(createConversation.fulfilled, (state, action) => {
         if (!state.conversations.items.some(c => c.id === action.payload.id)) {
            state.conversations.items.unshift(action.payload);
        }
        state.activeConversationId = action.payload.id;
      })
      .addCase(fetchMessages.pending, (state, action) => {
        const { conversationId } = action.meta.arg;
        if (!state.messagesByConversation[conversationId]) {
          state.messagesByConversation[conversationId] = { items: [], status: 'loading', error: null, hasMore: true };
        } else {
          state.messagesByConversation[conversationId].status = 'loading';
        }
      })
      .addCase(fetchMessages.fulfilled, (state, action) => {
        const { conversationId, items, pagination } = action.payload;
        state.messagesByConversation[conversationId].status = 'succeeded';
        state.messagesByConversation[conversationId].items = items;
        state.messagesByConversation[conversationId].hasMore = items.length === pagination.limit;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        const { conversationId } = action.meta.arg;
        state.messagesByConversation[conversationId].status = 'failed';
        state.messagesByConversation[conversationId].error = action.payload;
      })
      .addCase(sendMessage.fulfilled, (state, action) => {
        const conversationId = action.payload.conversationId;
        if (state.messagesByConversation[conversationId]) {
            if (!state.messagesByConversation[conversationId].items.some(m => m.id === action.payload.id)) {
                state.messagesByConversation[conversationId].items.push(action.payload);
            }
        }
      })
      .addCase(addParticipantsToConversation.fulfilled, (state, action) => {
          updateConversationInList(state, action.payload);
      })
      .addCase(updateGroupAvatar.fulfilled, (state, action) => {
          updateConversationInList(state, action.payload);
      });
  },
});

export const { setActiveConversation, addMessage, setTyping, updateConversation } = messengerSlice.actions;

export default messengerSlice.reducer;