import { apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';
import { AUTH_TOKEN_HEADER } from '@core/auth/auth.constants';
import { loadAuthConfig, OAuthError } from '@core/auth/oauth';
import type { AuthConfig } from '@core/auth/types/AuthConfig';
import type { AuthMe } from '@core/auth/types/AuthMe';

const RESOURCE = '/v1/auth';

export const authApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		// Shares the cached loader the token refresh uses, so the config is fetched once per page load.
		getAuthConfig: build.query<AuthConfig, void>({
			queryFn: async () => {
				try {
					return { data: await loadAuthConfig() };
				} catch (err) {
					const message = err instanceof Error ? err.message : 'Unable to load the login settings';
					const code = err instanceof OAuthError && err.status ? err.status : 500;
					return { error: { code, data: message, explain: 'Auth config unavailable', message } };
				}
			},
		}),

		getMe: build.query<AuthMe, void>({
			query: () => ({ method: 'get', url: `${RESOURCE}/me` }),
			providesTags: [{ type: apiTagConfig.me }],
		}),

		verifyApiToken: build.mutation<void, string>({
			query: (token) => ({
				method: 'get',
				url: `${RESOURCE}/me`,
				head: { [AUTH_TOKEN_HEADER]: token },
			}),
			transformResponse: () => undefined,
			extraOptions: { anonymous: true },
		}),
	}),
});
