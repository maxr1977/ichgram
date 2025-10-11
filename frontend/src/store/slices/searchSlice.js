import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import apiClient from '@/services/apiClient.js';

const HISTORY_STORAGE_KEY = 'ichgram_search_history';
const HISTORY_LIMIT = 10;

const normalizeEntry = (value) => {
  if (!value) return null;
  if (typeof value === 'string') {
    return { username: value, fullName: null, avatarUrl: null };
  }
  if (typeof value === 'object' && value.username) {
    return {
      username: value.username,
      fullName: value.fullName ?? null,
      avatarUrl: value.avatarUrl ?? null,
    };
  }
  return null;
};

const ensureUnique = (entries) => {
  const seen = new Set();
  const result = [];
  entries.forEach((entry) => {
    if (!entry?.username) return;
    const key = entry.username.toLowerCase();
    if (!seen.has(key)) {
      seen.add(key);
      result.push(entry);
    }
  });
  return result.slice(0, HISTORY_LIMIT);
};

const loadHistory = () => {
  if (typeof window === 'undefined') {
    return [];
  }
  try {
    const raw = window.localStorage.getItem(HISTORY_STORAGE_KEY);
    if (!raw) {
      return [];
    }
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    const normalized = parsed
      .map(normalizeEntry)
      .filter((entry) => entry && entry.username);
    return ensureUnique(normalized);
  } catch (error) {
    return [];
  }
};

const persistHistory = (history) => {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    window.localStorage.setItem(
      HISTORY_STORAGE_KEY,
      JSON.stringify(ensureUnique(history)),
    );
  } catch (error) {
  }
};

const initialState = {
  query: '',
  results: [],
  status: 'idle',
  error: null,
  history: loadHistory(),
};

export const searchUsers = createAsyncThunk(
  'search/searchUsers',
  async ({ query, limit = 10 }, { rejectWithValue }) => {
    try {
      const response = await apiClient.get('/search/users', {
        params: { q: query, limit },
      });
      return {
        items: response.data?.data?.items ?? [],
        query,
      };
    } catch (error) {
      const message = error.response?.data?.message ?? 'Failed to search users';
      return rejectWithValue({ message, query });
    }
  },
  {
    condition: ({ query }) => query?.trim().length >= 2,
  },
);

const searchSlice = createSlice({
  name: 'search',
  initialState,
  reducers: {
    resetSearchState: () => ({
      ...initialState,
      history: loadHistory(),
    }),
    clearResults(state) {
      state.results = [];
      state.status = 'idle';
      state.error = null;
    },
    addHistoryEntry(state, action) {
      const entry = normalizeEntry(action.payload);
      if (!entry) return;
      state.history = ensureUnique([entry, ...state.history]);
      persistHistory(state.history);
    },
    removeHistoryEntry(state, action) {
      const username = action.payload;
      state.history = state.history.filter((item) => item.username !== username);
      persistHistory(state.history);
    },
    clearHistory(state) {
      state.history = [];
      persistHistory(state.history);
    },
    clearSearch(state) {
      state.query = '';
      state.results = [];
      state.status = 'idle';
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(searchUsers.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.query = action.meta.arg?.query ?? '';
      })
      .addCase(searchUsers.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.results = action.payload.items;
        state.error = null;
        state.query = action.payload.query ?? state.query;
      })
      .addCase(searchUsers.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload?.message ?? action.error.message ?? 'Search failed';
      });
  },
});

export const {
  resetSearchState,
  clearResults,
  removeHistoryEntry,
  clearHistory,
  addHistoryEntry,
  clearSearch,
} = searchSlice.actions;

export const selectSearchState = (state) => state.search;

export default searchSlice.reducer;
