import type { NodeDefinition } from './NodeDefinition';

export interface NodeDefinitionList {
	items: NodeDefinition[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
