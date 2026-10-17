import type { NodeDefinitionQuery } from '@module/node-definition/types/NodeDefinitionQuery';
import type { NodeDefinitionSort } from '@module/node-definition/types/NodeDefinitionSort';

export const NODE_DEFINITION_ROUTE = '/app/node-definition';

export const nodeDefinitionLink = (id: string) => `${NODE_DEFINITION_ROUTE}/${id}`;

/** Latest version of every lineage; shared by the editor palette and the library so it is fetched once. */
export const NODE_LIBRARY_QUERY: NodeDefinitionQuery = {
	perPage: 200,
	order: { by: 'name', direction: 'asc' },
	filter: { latest_only: { op: '_eq', value: 'true' } },
};

export const nodeDefinitionSortOrders: Record<
	NodeDefinitionSort,
	{ label: string; by: string; direction: 'asc' | 'desc' }
> = {
	'name-asc': { label: 'Name A–Z', by: 'name', direction: 'asc' },
	'name-desc': { label: 'Name Z–A', by: 'name', direction: 'desc' },
	latest: { label: 'Latest', by: 'updated_at', direction: 'desc' },
	oldest: { label: 'Oldest', by: 'updated_at', direction: 'asc' },
};
