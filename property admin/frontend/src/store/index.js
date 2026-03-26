import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import verificationReducer from './slices/verificationSlice';
import reportReducer from './slices/reportSlice';
import socketReducer from './slices/socketSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    verification: verificationReducer,
    reports: reportReducer,
    socket: socketReducer,
  },
});

export default store;
