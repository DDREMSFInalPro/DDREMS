import { createSlice } from '@reduxjs/toolkit';
import { io } from 'socket.io-client';

let socket = null;

const socketSlice = createSlice({
  name: 'socket',
  initialState: {
    notifications: [],
    unreadCount: 0,
  },
  reducers: {
    addNotification(state, action) {
      state.notifications.unshift(action.payload);
      state.unreadCount += 1;
    },
    markAllRead(state) {
      state.unreadCount = 0;
    },
    clearNotifications(state) {
      state.notifications = [];
      state.unreadCount = 0;
    },
  },
});

export const { addNotification, markAllRead, clearNotifications } = socketSlice.actions;

export const connectSocket = () => () => {
  // Socket disabled in mock mode — no backend running
};

export const disconnectSocket = () => () => {};

export default socketSlice.reducer;
