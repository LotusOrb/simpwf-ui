import { createSelector } from '@reduxjs/toolkit';

import { resolveSchema } from '@common/component/SchemaForm';
import type { JsonSchema } from '@common/types/JsonSchema';

import { nodeTypeApi } from '@module/node-type/api';
import { EMPTY_NODE_TYPE_CATALOG } from '@module/node-type/constant';
import type { NodeTypeCatalog } from '@module/node-type/types/NodeTypeCatalog';
import type { NodeTypeList } from '@module/node-type/types/NodeTypeList';

export const toNodeTypeCatalog = (list: NodeTypeList | undefined): NodeTypeCatalog =>
	list
		? { items: list.items, byType: Object.fromEntries(list.items.map((item) => [item.type, item])) }
		: EMPTY_NODE_TYPE_CATALOG;

const selectListNodeTypesResult = nodeTypeApi.endpoints.listNodeTypes.select();

/** The catalog as last fetched; empty until it loads. */
export const selectNodeTypeCatalog = createSelector([selectListNodeTypesResult], (result) =>
	toNodeTypeCatalog(result.data),
);

export const nodeTypeSchema = (catalog: NodeTypeCatalog, type: string): JsonSchema | null =>
	catalog.byType[type]?.schema ?? null;

/** The schema of one top-level property of a type's node object, with references resolved. */
export const nodeTypeField = (catalog: NodeTypeCatalog, type: string, field: string): JsonSchema | undefined => {
	const schema = nodeTypeSchema(catalog, type);
	const property = schema?.properties?.[field];
	return property && schema ? resolveSchema(property, schema) : undefined;
};

/** Whether the engine accepts `field` on nodes of `type`. False for a type it doesn't describe. */
export const nodeTypeHasField = (catalog: NodeTypeCatalog, type: string, field: string) =>
	!!nodeTypeField(catalog, type, field);
