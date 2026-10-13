import type { WorkflowRunStatus } from './WorkflowRunStatus';

export interface WorkflowRunMigrateResult {
	instance: {
		id: string;
		workflow_definition_id: string;
		status: WorkflowRunStatus;
		waiting_reason: string | null;
		current_node_id: string | null;
		migrated_from: string | null;
		created_at: string;
		updated_at: string;
	};
	source_instance_id: string;
	source_status: 'stopped';
}
