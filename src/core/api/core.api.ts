import { createApi } from '@reduxjs/toolkit/query/react';

import { apiTagList } from '@config/apiTag.config';

import { coreBaseQuery } from './core.baseQuery';

export const coreApi = createApi({
	reducerPath: 'coreApi',
	baseQuery: coreBaseQuery,
	tagTypes: apiTagList,
	keepUnusedDataFor: 60,
	refetchOnFocus: true,
	refetchOnReconnect: true,
	endpoints: () => ({}),
});
