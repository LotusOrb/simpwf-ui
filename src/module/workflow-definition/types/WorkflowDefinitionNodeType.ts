export type WorkflowDefinitionNodeType =
	| 'script'
	| 'conditions'
	| 'input'
	| 'output'
	| 'group'
	| 'external_call'
	| 'poller'
	| 'parallel_start'
	| 'parallel_end'
	| 'delay';
