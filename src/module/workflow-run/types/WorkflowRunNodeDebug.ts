import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import type { WorkflowRunNodeStatus } from './WorkflowRunNodeStatus';

export interface WorkflowRunNodeDebug {
	occurrence_id: string;
	name: string;
	type: WorkflowDefinitionNodeType;
	source_node_definition_id: string | null;
	status: WorkflowRunNodeStatus;
	cancelled: boolean;
	attempt_count: number;
	latest_attempt: number;
	selected_attempt: number;
	duration_ms: number | null;
	error: string | null;
	recovery_policy: string | null;
	recovery_result: string | null;
	input: unknown;
	output: unknown;
	context_before: unknown;
	context_after: unknown;
	created_at: string;
	started_at: string | null;
	finished_at: string | null;
	stopped_at: string | null;
	updated_at: string;
}
