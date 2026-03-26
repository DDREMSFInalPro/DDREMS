import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

const MOCK_USER = {
  _id: 'mock-admin-001',
  name: 'Admin User',
  email: 'admin@ddrems.com',
  role: 'admin',
};
const MOCK_TOKEN = 'mock-jwt-token';

// Mock login — accepts any non-empty email/password
export const login = createAsyncThunk(
  'auth/login',
  async ({ email, password }, { rejectWithValue }) => {
    await new Promise((r) => setTimeout(r, 600)); // simulate network delay
    if (!email || !password) return rejectWithValue('Email and password are required');
    localStorage.setItem('token', MOCK_TOKEN);
    return { user: { ...MOCK_USER, email }, token: MOCK_TOKEN };
  }
);

// Hydrate user from stored token on page refresh
export const hydrateUser = createAsyncThunk(
  'auth/hydrateUser',
  async () => MOCK_USER
);

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    isHydrating: false,
    error: null,
  },
  reducers: {
    logout(state) {
      state.user = null;
      state.token = null;
      state.error = null;
      localStorage.removeItem('token');
    },
    clearError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => { state.isLoading = true; state.error = null; })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      .addCase(hydrateUser.pending, (state) => { state.isHydrating = true; })
      .addCase(hydrateUser.fulfilled, (state, action) => {
        state.isHydrating = false;
        state.user = action.payload;
      })
      .addCase(hydrateUser.rejected, (state) => {
        state.isHydrating = false;
        state.token = null;
      });
  },
});

export const { logout, clearError } = authSlice.actions;
export default authSlice.reducer;
