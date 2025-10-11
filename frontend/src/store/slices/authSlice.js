import {
  createSlice,
  createAsyncThunk,
} from '@reduxjs/toolkit';
import apiClient, { setAuthHeader } from '@/services/apiClient.js';

const persistedAuth = (() => {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const raw = window.localStorage.getItem('ichgram_auth');
    return raw ? JSON.parse(raw) : null;
  } catch (error) {
    console.warn('Failed to parse persisted auth state', error);
    return null;
  }
})();

if (persistedAuth?.accessToken) {
  setAuthHeader(persistedAuth.accessToken);
}

const initialState = {
  user: persistedAuth?.user ?? null,
  accessToken: persistedAuth?.accessToken ?? null,
  status: 'idle',
  error: null,
};

const persistAuthState = (state) => {
  if (typeof window === 'undefined') return;
  if (state.user && state.accessToken) {
    window.localStorage.setItem(
      'ichgram_auth',
      JSON.stringify({ user: state.user, accessToken: state.accessToken }),
    );
  } else {
    window.localStorage.removeItem('ichgram_auth');
  }
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/login', credentials);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to login';
      return rejectWithValue(message);
    }
  },
);

export const register = createAsyncThunk(
  'auth/register',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/register', payload);
      return response.data.data;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to register';
      return rejectWithValue(message);
    }
  },
);

export const forgotPassword = createAsyncThunk(
  'auth/forgotPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/forgot-password', payload);
      return response.data.message;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to send reset email';
      return rejectWithValue(message);
    }
  },
);

export const resetPassword = createAsyncThunk(
  'auth/resetPassword',
  async (payload, { rejectWithValue }) => {
    try {
      const response = await apiClient.post('/auth/reset-password', payload);
      return response.data.message;
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to reset password';
      return rejectWithValue(message);
    }
  },
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await apiClient.post('/auth/logout');
    return true;
  } catch (error) {
    const message = error.response?.data?.message ?? 'Logout failed';
    return rejectWithValue(message);
  }
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setCredentials(state, action) {
      const { user, accessToken } = action.payload;
      state.user = user;
      state.accessToken = accessToken;
      setAuthHeader(accessToken);
      state.error = null;
      persistAuthState(state);
    },
    updateUserProfile(state, action) {
      if (!state.user) return;
      state.user = {
        ...state.user,
        ...action.payload,
      };
      persistAuthState(state);
    },
    clearAuthState(state) {
      state.user = null;
      state.accessToken = null;
      state.status = 'idle';
      state.error = null;
      setAuthHeader(null);
      persistAuthState(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAuthHeader(action.payload.accessToken);
        state.error = null;
        persistAuthState(state);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        setAuthHeader(action.payload.accessToken);
        state.error = null;
        persistAuthState(state);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(forgotPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(resetPassword.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.status = 'succeeded';
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload ?? action.error.message;
      })
      .addCase(logout.fulfilled, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
        setAuthHeader(null);
        persistAuthState(state);
      })
      .addCase(logout.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.status = 'idle';
        state.error = null;
        setAuthHeader(null);
        persistAuthState(state);
      });
  },
});

export const { setCredentials, clearAuthState, updateUserProfile } = authSlice.actions;
export default authSlice.reducer;
