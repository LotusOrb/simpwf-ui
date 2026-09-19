import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { LocalKVStore } from '@core/localKVStore';

const authStore = new LocalKVStore('auth');

const TOKEN_KEY = 'token';

export interface AuthState {
	token: string | null;
	initialized: boolean;
}

const initialState: AuthState = {
	token: authStore.get<string>(TOKEN_KEY),
	initialized: true,
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setToken: (state, action: PayloadAction<string>) => {
			state.token = authStore.set(TOKEN_KEY, action.payload);
		},
		clearToken: (state) => {
			authStore.clear();
			state.token = null;
		},
	},
	selectors: {
		selectToken: (state) => state.token,
		selectIsAuthenticated: (state) => !!state.token,
	},
});

export const { setToken, clearToken } = authSlice.actions;
export const { selectToken, selectIsAuthenticated } = authSlice.selectors;
