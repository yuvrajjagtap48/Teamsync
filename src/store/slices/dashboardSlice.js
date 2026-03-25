import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import { supabase } from "@/integrations/supabase/client";

const initialState = {
  stats: {
    totalProjects: 0,
    activeTasks: 0,
    completedTasks: 0,
    overdueTasks: 0,
  },
  status: "idle",
  error: null,
};

export const fetchDashboardStats = createAsyncThunk(
  "dashboard/fetchStats",
  async (userId, { rejectWithValue }) => {
    if (!userId) {
      return initialState.stats;
    }

    try {
      const { count: projectCount } = await supabase
        .from("projects")
        .select("*", { count: "exact", head: true });

      const { data: tasks } = await supabase
        .from("tasks")
        .select("status, due_date");

      const now = new Date();
      const activeTasks =
        tasks?.filter((task) => task.status !== "done").length ?? 0;
      const completedTasks =
        tasks?.filter((task) => task.status === "done").length ?? 0;
      const overdueTasks =
        tasks?.filter(
          (task) =>
            task.status !== "done" &&
            task.due_date &&
            new Date(task.due_date) < now,
        ).length ?? 0;

      return {
        totalProjects: projectCount ?? 0,
        activeTasks,
        completedTasks,
        overdueTasks,
      };
    } catch (error) {
      return rejectWithValue(
        error.message || "Failed to fetch dashboard stats",
      );
    }
  },
);

const dashboardSlice = createSlice({
  name: "dashboard",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDashboardStats.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchDashboardStats.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.stats = action.payload;
      })
      .addCase(fetchDashboardStats.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload || action.error.message;
      });
  },
});

export default dashboardSlice.reducer;
