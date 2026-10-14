import type { WorkflowRunParallelBranch } from './WorkflowRunParallelBranch';
import type { WorkflowRunParallelExecutionStatus } from './WorkflowRunParallelExecutionStatus';

/** One fork/join scope of a run. A loop or rollback that re-forks appends a new one. */
export interface WorkflowRunParallelExecution {
	id: string;
	/** Null for a top-level block; the branch containing a nested fork otherwise. */
	parent_branch_id: string | null;
	/** Structural nesting, 1 = top level. */
	depth: number;
	start_node_id: string;
	end_node_id: string;
	status: WorkflowRunParallelExecutionStatus;
	branch_count: number;
	completed_count: number;
	branches: WorkflowRunParallelBranch[];
}
