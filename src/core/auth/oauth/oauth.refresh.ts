import type { BaseQueryApi } from '@reduxjs/toolkit/query';

import { OAUTH_REFRESH_LEEWAY_MS } from '@core/auth/auth.constants';
import { clearSession, updateOAuthTokens, type AuthState } from '@core/auth/store';

import { refreshOAuthTokens } from './oauth.client';
import { OAuthError } from './oauth.error';

type StoreApi = Pick<BaseQueryApi, 'dispatch' | 'getState'>;

const getAuth = (api: StoreApi) => (api.getState() as { auth?: AuthState }).auth;

export const isOAuthTokenExpiring = (auth?: AuthState) =>
	auth?.method === 'oauth' && !!auth.expiresAt && Date.now() >= auth.expiresAt - OAUTH_REFRESH_LEEWAY_MS;

let inflight: Promise<string> | null = null;

// Parallel requests that all find the token expired share one refresh; a refresh token may be single-use, so a
// second concurrent grant would fail and log the user out.
export const refreshOAuthSession = (api: StoreApi): Promise<string> => {
	inflight ??= (async () => {
		const auth = getAuth(api);

		try {
			if (auth?.method !== 'oauth' || !auth.refreshToken) {
				throw new OAuthError(0, 'no_refresh_token', 'The session cannot be refreshed.');
			}

			const tokens = await refreshOAuthTokens(auth.refreshToken);
			api.dispatch(updateOAuthTokens(tokens));
			return tokens.accessToken;
		} catch (err) {
			// A rejected grant ends the session; a network failure or provider outage leaves it for the next try.
			if (err instanceof OAuthError && err.status < 500) api.dispatch(clearSession());
			throw err;
		}
	})().finally(() => {
		inflight = null;
	});

	return inflight;
};
