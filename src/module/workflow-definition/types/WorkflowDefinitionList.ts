import type { WorkflowDefinition } from './WorkflowDefinition';

/** Paginated envelope. Use `WorkflowDefinition[]` for a plain collection. */
export interface WorkflowDefinitionList {
	items: WorkflowDefinition[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
