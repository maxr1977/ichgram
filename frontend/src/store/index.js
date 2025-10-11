import { configureStore } from '@reduxjs/toolkit';
import appReducer from './slices/appSlice.js';
import authReducer from './slices/authSlice.js';
import postsReducer from './slices/postSlice.js';
import profileReducer from './slices/profileSlice.js';
import searchReducer from './slices/searchSlice.js';
import notificationsReducer from './slices/notificationsSlice.js';
import toastReducer from './slices/toastSlice.js';
import messengerReducer from './slices/messengerSlice.js';

const store = configureStore({
  reducer: {
    app: appReducer,
    auth: authReducer,
    posts: postsReducer,
    profile: profileReducer,
    search: searchReducer,
    notifications: notificationsReducer,
    toast: toastReducer,
    messenger: messengerReducer,
  },
  devTools: import.meta.env.DEV,
});

export default store;