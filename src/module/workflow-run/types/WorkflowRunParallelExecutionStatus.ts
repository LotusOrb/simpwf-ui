export type WorkflowRunParallelExecutionStatus =
	| 'waiting_for_branches'
	| 'ready_to_join'
	| 'completed'
	| 'failed'
	| 'cancelled';
