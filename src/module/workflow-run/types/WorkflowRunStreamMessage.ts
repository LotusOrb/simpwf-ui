import type { WorkflowRun } from './WorkflowRun';

/** One frame off the live feed. Mirror this with the backend contract. */
export type WorkflowRunStreamMessage =
	| { type: 'run.updated'; payload: WorkflowRun }
	| { type: 'run.created'; payload: WorkflowRun }
	| { type: 'run.deleted'; payload: { id: string } };
