export type WorkflowRunNodeStatus =
	| 'pending'
	| 'running'
	| 'waiting'
	| 'succeeded'
	| 'failed'
	| 'cancelled'
	| 'skipped'
	| 'rolled_back';
