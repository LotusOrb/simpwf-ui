import type { WorkflowRunParallelBranchStatus } from './WorkflowRunParallelBranchStatus';

export interface WorkflowRunParallelBranch {
	id: string;
	name: string;
	/** Alphabetical position of the name among its siblings. */
	branch_index: number;
	start_node_id: string;
	status: WorkflowRunParallelBranchStatus;
	/** `input`, `delay` or `paused` while the branch is parked; empty when runnable. */
	waiting_reason: string;
	error: string;
	updated_at: string;
}
