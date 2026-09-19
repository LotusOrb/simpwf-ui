import type { WorkflowRun } from './WorkflowRun';

export type WorkflowRunStreamMessage =
	| { type: 'run.updated'; payload: WorkflowRun }
	| { type: 'run.created'; payload: WorkflowRun }
	| { type: 'run.deleted'; payload: { id: string } };
