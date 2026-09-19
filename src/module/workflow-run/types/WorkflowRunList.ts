import type { WorkflowRun } from './WorkflowRun';

/** Paginated envelope. Use `WorkflowRun[]` for a plain collection. */
export interface WorkflowRunList {
	items: WorkflowRun[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
