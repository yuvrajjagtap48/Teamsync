import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
  selectedProjectId: null,
  search: "",
  statusFilter: "all",
};

const projectsSlice = createSlice({
  name: "projects",
  initialState,
  reducers: {
    setProjects(state, action) {
      state.items = action.payload ?? [];
    },
    addProject(state, action) {
      state.items.unshift(action.payload);
    },
    updateProject(state, action) {
      const updated = action.payload;
      state.items = state.items.map((project) =>
        project.id === updated.id ? { ...project, ...updated } : project,
      );
    },
    removeProject(state, action) {
      const id = action.payload;
      state.items = state.items.filter((project) => project.id !== id);
      if (state.selectedProjectId === id) state.selectedProjectId = null;
    },
    selectProject(state, action) {
      state.selectedProjectId = action.payload;
    },
    setProjectSearch(state, action) {
      state.search = action.payload;
    },
    setProjectStatusFilter(state, action) {
      state.statusFilter = action.payload;
    },
  },
});

export const {
  setProjects,
  addProject,
  updateProject,
  removeProject,
  selectProject,
  setProjectSearch,
  setProjectStatusFilter,
} = projectsSlice.actions;

export default projectsSlice.reducer;
