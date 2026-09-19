import type { WorkflowDefinition } from './WorkflowDefinition';

export interface WorkflowDefinitionList {
	items: WorkflowDefinition[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
