import { apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { NodeTypeList } from '@module/node-type/types/NodeTypeList';

const RESOURCE = 'v1/node/types';

// Served from the engine's code, so it only changes when the engine does: kept for the whole session.
const CATALOG_CACHE_SECONDS = 60 * 60;

export const nodeTypeApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listNodeTypes: build.query<NodeTypeList, void>({
			query: () => ({ method: 'get', url: RESOURCE }),
			providesTags: [{ type: apiTagConfig.nodeType }],
			keepUnusedDataFor: CATALOG_CACHE_SECONDS,
		}),
	}),
});
