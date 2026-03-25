import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  unreadCount: 0,
};

const notificationsSlice = createSlice({
  name: "notifications",
  initialState,
  reducers: {
    setNotifications(state, action) {
      state.items = action.payload ?? [];
      state.unreadCount = state.items.filter((item) => !item.read).length;
    },
    addNotification(state, action) {
      state.items.unshift(action.payload);
      if (!action.payload?.read) state.unreadCount += 1;
    },
    markNotificationRead(state, action) {
      const targetId = action.payload;
      state.items = state.items.map((item) => {
        if (item.id !== targetId || item.read) return item;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
        return { ...item, read: true };
      });
    },
    clearNotifications(state) {
      state.items = [];
      state.unreadCount = 0;
    },
  },
});

export const {
  setNotifications,
  addNotification,
  markNotificationRead,
  clearNotifications,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
