import { NODE_LIBRARY_QUERY, isBuiltinNodeType } from '@module/node-definition/data';

import { useListNodeDefinitionsQuery } from './node-definition.hooks';

/**
 * The latest version of every node definition, plus what can be read off it: the custom node types in use and
 * the engine's schema per type (schemas are only served on definition reads).
 */
export const useNodeDefinitionLibrary = (options?: { skip?: boolean }) => {
	const library = useListNodeDefinitionsQuery(NODE_LIBRARY_QUERY, options);
	const items = library.data?.items ?? [];

	const customTypes = [
		...new Set(items.map((item) => item.type as string).filter((type) => !isBuiltinNodeType(type))),
	].sort();
	const schemaFor = (type: string) => items.find((item) => item.type === type && item.schema)?.schema ?? null;

	return { ...library, customTypes, schemaFor };
};
