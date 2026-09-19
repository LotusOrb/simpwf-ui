import type { WorkflowRunStatus } from './WorkflowRunStatus';

export interface WorkflowRun {
	id: string;
	workflow_definition_id: string;
	status: WorkflowRunStatus;
	waiting_reason: string | null;
	pause_requested: boolean;
	termination_pending: boolean;
	error: string | null;
	started_at?: string | null;
	finished_at?: string | null;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
