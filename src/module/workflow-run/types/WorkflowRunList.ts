import type { WorkflowRun } from './WorkflowRun';

export interface WorkflowRunList {
	items: WorkflowRun[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
