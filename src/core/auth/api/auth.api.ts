import { coreApi } from '@core/api';
import { AUTH_TOKEN_HEADER } from '@core/auth/auth.constants';

export const authApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		// The backend has no dedicated auth endpoint, so a token is verified by hitting a cheap protected route.
		verifyApiToken: build.mutation<void, string>({
			query: (token) => ({
				method: 'get',
				url: '/v1/workflow/definition?page=1&per_page=1',
				head: { [AUTH_TOKEN_HEADER]: token },
			}),
			transformResponse: () => undefined,
			extraOptions: { anonymous: true },
		}),
	}),
});

export const { useVerifyApiTokenMutation } = authApi;
