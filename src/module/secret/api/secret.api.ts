import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';
import type { CoreQueryError } from '@core/api/core.baseQuery';

import type { Secret } from '@module/secret/types/Secret';
import type { SecretList } from '@module/secret/types/SecretList';
import type { SecretPayload } from '@module/secret/types/SecretPayload';
import type { SecretQuery } from '@module/secret/types/SecretQuery';

const RESOURCE = 'v1/secrets';

const secretUrl = (key: string) => `${RESOURCE}/${encodeURIComponent(key)}`;

export const secretApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listSecrets: build.query<SecretList, SecretQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.secret, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.secret, id: item.key })),
			],
		}),

		createSecret: build.mutation<Secret, SecretPayload>({
			query: (body) => ({ method: 'post', url: RESOURCE, body }),
			invalidatesTags: [{ type: apiTagConfig.secret, id: API_TAG_LIST_ID }],
		}),

		/**
		 * The API has no update, so rotating replaces the secret: delete, then create with the same key.
		 * If the create fails the secret is already gone; the error says so, so the caller can retry.
		 */
		rotateSecret: build.mutation<Secret, SecretPayload>({
			queryFn: async (body, _api, _extra, baseQuery) => {
				const removed = await baseQuery({ method: 'delete', url: secretUrl(body.key) });
				if (removed.error && (removed.error as CoreQueryError).code !== 404) {
					return { error: removed.error };
				}

				const created = await baseQuery({ method: 'post', url: RESOURCE, body });
				if (created.error) {
					const error = created.error as CoreQueryError;
					return {
						error: {
							...error,
							message: `${body.key} was removed but the new value couldn't be saved (${error.message}). Save again to recreate it.`,
						},
					};
				}
				return { data: created.data as Secret };
			},
			invalidatesTags: (_result, _error, { key }) => [
				{ type: apiTagConfig.secret, id: key },
				{ type: apiTagConfig.secret, id: API_TAG_LIST_ID },
			],
		}),

		deleteSecret: build.mutation<void, string>({
			query: (key) => ({ method: 'delete', url: secretUrl(key) }),
			invalidatesTags: (_result, _error, key) => [
				{ type: apiTagConfig.secret, id: key },
				{ type: apiTagConfig.secret, id: API_TAG_LIST_ID },
			],
		}),
	}),
});
