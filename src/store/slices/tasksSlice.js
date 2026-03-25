import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  selectedTaskId: null,
  search: "",
  statusFilter: "all",
  assigneeFilter: "all",
};

const tasksSlice = createSlice({
  name: "tasks",
  initialState,
  reducers: {
    setTasks(state, action) {
      state.items = action.payload ?? [];
    },
    upsertTask(state, action) {
      const task = action.payload;
      const index = state.items.findIndex((item) => item.id === task.id);
      if (index === -1) state.items.unshift(task);
      else state.items[index] = { ...state.items[index], ...task };
    },
    removeTask(state, action) {
      const id = action.payload;
      state.items = state.items.filter((task) => task.id !== id);
      if (state.selectedTaskId === id) state.selectedTaskId = null;
    },
    selectTask(state, action) {
      state.selectedTaskId = action.payload;
    },
    setTaskSearch(state, action) {
      state.search = action.payload;
    },
    setTaskStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
    setTaskAssigneeFilter(state, action) {
      state.assigneeFilter = action.payload;
    },
  },
});

export const {
  setTasks,
  upsertTask,
  removeTask,
  selectTask,
  setTaskSearch,
  setTaskStatusFilter,
  setTaskAssigneeFilter,
} = tasksSlice.actions;

export default tasksSlice.reducer;
