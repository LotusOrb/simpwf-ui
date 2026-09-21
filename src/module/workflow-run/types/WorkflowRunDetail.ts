import type { WorkflowRun } from './WorkflowRun';
import type { WorkflowRunNodeOccurrence } from './WorkflowRunNodeOccurrence';
import type { WorkflowRunPendingInput } from './WorkflowRunPendingInput';

export interface WorkflowRunDetail extends WorkflowRun {
	attempt: number;
	context_mode: 'full' | 'lean';
	current_node_id: string | null;
	current_node_instance_id: string | null;
	current_group_id: string | null;
	counters: Record<string, number>;
	pending_input: WorkflowRunPendingInput | null;
	/** Keyed by workflow definition node id. */
	nodes: Record<string, WorkflowRunNodeOccurrence>;
}
