import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { NodeDefinitionList } from '@module/node-definition/types/NodeDefinitionList';
import type { NodeDefinitionQuery } from '@module/node-definition/types/NodeDefinitionQuery';

const RESOURCE = 'v1/node/definition';

export const nodeDefinitionApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listNodeDefinitions: build.query<NodeDefinitionList, NodeDefinitionQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.nodeDefinition, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.nodeDefinition, id: item.id })),
			],
		}),

		getNodeDefinition: build.query<NodeDefinition, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.nodeDefinition, id }],
		}),
	}),
});
