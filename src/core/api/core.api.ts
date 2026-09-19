import { createApi } from '@reduxjs/toolkit/query/react';

import { apiTagList } from '@config/apiTag.config';

import { coreBaseQuery } from './core.baseQuery';

/**
 * The single cache for the whole app. Modules never call `createApi` again --
 * they call `coreApi.injectEndpoints` from their own `api/` folder, so each
 * module owns its endpoints while sharing one cache, one middleware and one
 * tag namespace.
 */
export const coreApi = createApi({
	reducerPath: 'coreApi',
	baseQuery: coreBaseQuery,
	tagTypes: apiTagList,
	// 60s before a cached entry is considered stale and refetched on mount.
	keepUnusedDataFor: 60,
	refetchOnFocus: true,
	refetchOnReconnect: true,
	endpoints: () => ({}),
});
