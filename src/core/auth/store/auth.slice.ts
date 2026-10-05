import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { AUTH_ANONYMOUS_TOKEN } from '@core/auth/auth.constants';
import type { AuthMethod } from '@core/auth/types/AuthMethod';
import type { OAuthTokens } from '@core/auth/types/OAuthTokens';
import { LocalKVStore } from '@core/localKVStore';

const authStore = new LocalKVStore('auth');

const SESSION_KEY = 'session';
// Older builds stored a bare API key under this key.
const LEGACY_TOKEN_KEY = 'token';

interface AuthSession {
	method: AuthMethod;
	token: string;
	refreshToken: string | null;
	idToken: string | null;
	expiresAt: number | null;
}

export interface AuthState {
	method: AuthMethod | null;
	token: string | null;
	refreshToken: string | null;
	idToken: string | null;
	expiresAt: number | null;
	initialized: boolean;
}

const emptySession: Omit<AuthState, 'initialized'> = {
	method: null,
	token: null,
	refreshToken: null,
	idToken: null,
	expiresAt: null,
};

const loadSession = (): Omit<AuthState, 'initialized'> => {
	const session = authStore.get<AuthSession>(SESSION_KEY);
	if (session?.token && session.method) return session;

	const legacyToken = authStore.get<string>(LEGACY_TOKEN_KEY);
	if (!legacyToken) return emptySession;

	authStore.delete(LEGACY_TOKEN_KEY);
	return authStore.set<AuthSession>(SESSION_KEY, { ...emptySession, method: 'apiKey', token: legacyToken });
};

const persist = (state: AuthState) => {
	const { method, token, refreshToken, idToken, expiresAt } = state;
	if (method && token) authStore.set<AuthSession>(SESSION_KEY, { method, token, refreshToken, idToken, expiresAt });
};

const initialState: AuthState = {
	...loadSession(),
	initialized: true,
};

export const authSlice = createSlice({
	name: 'auth',
	initialState,
	reducers: {
		setApiKeySession: (state, action: PayloadAction<string>) => {
			Object.assign(state, emptySession, { method: 'apiKey', token: action.payload });
			persist(state);
		},
		setOAuthSession: (state, action: PayloadAction<OAuthTokens>) => {
			const { accessToken, refreshToken, idToken, expiresAt } = action.payload;
			Object.assign(state, { method: 'oauth', token: accessToken, refreshToken, idToken, expiresAt });
			persist(state);
		},
		// A refresh response may omit the refresh or id token, in which case the current ones stay valid.
		updateOAuthTokens: (state, action: PayloadAction<OAuthTokens>) => {
			if (state.method !== 'oauth') return;
			const { accessToken, refreshToken, idToken, expiresAt } = action.payload;
			state.token = accessToken;
			state.refreshToken = refreshToken ?? state.refreshToken;
			state.idToken = idToken ?? state.idToken;
			state.expiresAt = expiresAt;
			persist(state);
		},
		clearSession: (state) => {
			authStore.clear();
			Object.assign(state, emptySession);
		},
	},
	selectors: {
		selectToken: (state) => state.token,
		selectAuthMethod: (state) => state.method,
		selectIsAuthenticated: (state) => !!state.token,
		// The placeholder session of an engine with every login method off, which has no caller to describe.
		selectIsAnonymous: (state) => state.method === 'apiKey' && state.token === AUTH_ANONYMOUS_TOKEN,
	},
});

export const { setApiKeySession, setOAuthSession, updateOAuthTokens, clearSession } = authSlice.actions;
export const { selectToken, selectAuthMethod, selectIsAuthenticated, selectIsAnonymous } = authSlice.selectors;
