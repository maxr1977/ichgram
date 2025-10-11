import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  isSidebarOpen: false,
  theme: 'light',
};

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    toggleSidebar(state) {
      state.isSidebarOpen = !state.isSidebarOpen;
    },
    setTheme(state, action) {
      state.theme = action.payload;
    },
  },
});

export const { toggleSidebar, setTheme } = appSlice.actions;
export default appSlice.reducer;
