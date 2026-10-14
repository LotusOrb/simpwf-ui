import type { WorkflowRun } from './WorkflowRun';
import type { WorkflowRunNodeOccurrence } from './WorkflowRunNodeOccurrence';
import type { WorkflowRunParallelExecution } from './WorkflowRunParallelExecution';
import type { WorkflowRunPendingInput } from './WorkflowRunPendingInput';

export interface WorkflowRunDetail extends WorkflowRun {
	attempt: number;
	context_mode: 'full' | 'lean';
	current_node_id: string | null;
	current_node_instance_id: string | null;
	current_group_id: string | null;
	counters: Record<string, number>;
	pending_input: WorkflowRunPendingInput | null;
	/** Source run when this one was created by a definition migration. */
	migrated_from: string | null;
	/** Replacement run after this one was migrated away. */
	superseded_by: string | null;
	/** Keyed by workflow definition node id. */
	nodes: Record<string, WorkflowRunNodeOccurrence>;
	/** Fork/join executions; omitted when the run never forked. */
	parallel?: WorkflowRunParallelExecution[] | null;
}
