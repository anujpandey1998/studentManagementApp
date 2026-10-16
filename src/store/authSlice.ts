import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { SessionUser } from '../types/domain';

interface AuthState {
  user: SessionUser | null;
  isHydrating: boolean;
  error: string | null;
  passwordRecovery: boolean;
}

const initialState: AuthState = {
  user: null,
  isHydrating: true,
  error: null,
  passwordRecovery: false,
};

const auth = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    authChecking(state) {
      state.isHydrating = true;
      state.error = null;
    },
    authResolved(state, action: PayloadAction<SessionUser>) {
      state.user = action.payload;
      state.isHydrating = false;
      state.error = null;
    },
    authFailed(state, action: PayloadAction<string>) {
      state.user = null;
      state.isHydrating = false;
      state.error = action.payload;
    },
    authCleared(state) {
      state.user = null;
      state.isHydrating = false;
      state.error = null;
      state.passwordRecovery = false;
    },
    authRecoveryStarted(state) {
      state.passwordRecovery = true;
      state.error = null;
    },
    authRecoveryCompleted(state) {
      state.passwordRecovery = false;
    },
  },
});

export const {
  authChecking,
  authResolved,
  authFailed,
  authCleared,
  authRecoveryStarted,
  authRecoveryCompleted,
} = auth.actions;
export default auth.reducer;
