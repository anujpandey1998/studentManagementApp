import { configureStore, createSlice, PayloadAction } from '@reduxjs/toolkit';
import authReducer from './authSlice';

// Server records belong in React Query, never in this store.
const ui = createSlice({
  name: 'ui',
  initialState: {
    language: 'en' as 'en' | 'hi',
    appearance: 'system' as 'system' | 'light' | 'dark',
  },
  reducers: {
    setLanguage(state, action: PayloadAction<'en' | 'hi'>) {
      state.language = action.payload;
    },
    setAppearance(state, action: PayloadAction<'system' | 'light' | 'dark'>) {
      state.appearance = action.payload;
    },
  },
});
export const store = configureStore({
  reducer: { ui: ui.reducer, auth: authReducer },
});
export const { setLanguage, setAppearance } = ui.actions;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
