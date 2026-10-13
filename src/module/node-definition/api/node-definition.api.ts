import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { NodeDefinitionList } from '@module/node-definition/types/NodeDefinitionList';
import type { NodeDefinitionPayload } from '@module/node-definition/types/NodeDefinitionPayload';
import type { NodeDefinitionQuery } from '@module/node-definition/types/NodeDefinitionQuery';

const RESOURCE = 'v1/node/definition';

// Prefixed so it never collides with a definition id tag (a lineage id can equal its first version's id).
const lineageTag = (lineageId: string) => ({ type: apiTagConfig.nodeDefinition, id: `lineage:${lineageId}` });

export const nodeDefinitionApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listNodeDefinitions: build.query<NodeDefinitionList, NodeDefinitionQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.nodeDefinition, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.nodeDefinition, id: item.id })),
			],
		}),

		/** Page-accumulating version list of one lineage, newest first, for scroll-to-load views. */
		listNodeDefinitionVersionPages: build.infiniteQuery<
			NodeDefinitionList,
			{ lineageId: string; perPage: number },
			number
		>({
			infiniteQueryOptions: {
				initialPageParam: 1,
				getNextPageParam: (lastPage) => (lastPage.page < lastPage.total_pages ? lastPage.page + 1 : undefined),
			},
			query: ({ queryArg: { lineageId, perPage }, pageParam }) => ({
				method: 'get',
				url: RESOURCE,
				qParam: {
					page: pageParam,
					perPage,
					order: { by: 'version', direction: 'desc' },
					filter: {
						lineage_id: { op: '_eq', value: lineageId },
						latest_only: { op: '_eq', value: 'false' },
					},
				} satisfies NodeDefinitionQuery,
			}),
			providesTags: (result, _error, { lineageId }) => [
				lineageTag(lineageId),
				...(result?.pages ?? []).flatMap((page) =>
					page.items.map((item) => ({ type: apiTagConfig.nodeDefinition, id: item.id })),
				),
			],
		}),

		getNodeDefinition: build.query<NodeDefinition, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.nodeDefinition, id }],
		}),

		// Node definitions are immutable: a new version POSTs with `previous_version_id` set.
		createNodeDefinition: build.mutation<NodeDefinition, NodeDefinitionPayload>({
			query: (body) => ({ method: 'post', url: RESOURCE, body }),
			invalidatesTags: (result) => [
				{ type: apiTagConfig.nodeDefinition, id: API_TAG_LIST_ID },
				...(result ? [lineageTag(result.lineage_id)] : []),
			],
		}),

		deleteNodeDefinition: build.mutation<void, string>({
			query: (id) => ({ method: 'delete', url: `${RESOURCE}/${id}` }),
			invalidatesTags: (_result, _error, id) => [
				{ type: apiTagConfig.nodeDefinition, id },
				{ type: apiTagConfig.nodeDefinition, id: API_TAG_LIST_ID },
			],
		}),
	}),
});
