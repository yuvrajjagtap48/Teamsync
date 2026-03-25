import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  user: null,
  session: null,
  status: "idle",
  error: null,
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    setAuthLoading(state) {
      state.status = "loading";
      state.error = null;
    },
    setAuthSession(state, action) {
      state.user = action.payload?.user ?? null;
      state.session = action.payload?.session ?? null;
      state.status = "authenticated";
      state.error = null;
    },
    setAuthError(state, action) {
      state.status = "failed";
      state.error = action.payload;
    },
    clearAuth(state) {
      state.user = null;
      state.session = null;
      state.status = "idle";
      state.error = null;
    },
  },
});

export const { setAuthLoading, setAuthSession, setAuthError, clearAuth } =
  authSlice.actions;

export default authSlice.reducer;
