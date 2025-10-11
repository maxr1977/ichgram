import { createSlice, nanoid } from '@reduxjs/toolkit';

const DEFAULT_DURATION = 3500;

const toastSlice = createSlice({
  name: 'toast',
  initialState: {
    items: [],
  },
  reducers: {
    showToast: {
      reducer(state, action) {
        state.items = [...state.items, action.payload];
      },
      prepare({ type = 'info', message, duration = DEFAULT_DURATION }) {
        return {
          payload: {
            id: nanoid(),
            type,
            message,
            duration,
          },
        };
      },
    },
    dismissToast(state, action) {
      const id = action.payload;
      state.items = state.items.filter((toast) => toast.id !== id);
    },
    clearToasts(state) {
      state.items = [];
    },
  },
});

export const { showToast, dismissToast, clearToasts } = toastSlice.actions;
export const selectToasts = (state) => state.toast.items;
export default toastSlice.reducer;
