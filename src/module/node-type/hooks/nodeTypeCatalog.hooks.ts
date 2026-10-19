import { useMemo } from 'react';

import { toNodeTypeCatalog } from '@module/node-type/utils';

import { useListNodeTypesQuery } from './node-type.hooks';

/** The engine's node type catalog: fetched once and kept, with the query state for loading and errors. */
export const useNodeTypeCatalog = () => {
	const query = useListNodeTypesQuery();
	const catalog = useMemo(() => toNodeTypeCatalog(query.data), [query.data]);
	return { ...query, catalog };
};
