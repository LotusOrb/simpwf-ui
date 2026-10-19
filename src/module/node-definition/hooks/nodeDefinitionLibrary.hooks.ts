import { NODE_LIBRARY_QUERY } from '@module/node-definition/constant';
import { useNodeTypeCatalog } from '@module/node-type/hooks';

import { useListNodeDefinitionsQuery } from './node-definition.hooks';

/**
 * The latest version of every node definition, plus the custom node types they use. A type the catalog doesn't list
 * as builtin counts as custom, so definitions of a type no longer registered still show up.
 */
export const useNodeDefinitionLibrary = (options?: { skip?: boolean }) => {
	const library = useListNodeDefinitionsQuery(NODE_LIBRARY_QUERY, options);
	const { catalog } = useNodeTypeCatalog();
	const items = library.data?.items ?? [];

	const customTypes = [
		...new Set(items.map((item) => item.type as string).filter((type) => !catalog.byType[type]?.builtin)),
	].sort();

	return { ...library, customTypes };
};
