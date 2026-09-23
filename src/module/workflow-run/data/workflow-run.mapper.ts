import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';
import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeOccurrence } from '@module/workflow-run/types/WorkflowRunNodeOccurrence';
import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';
import type { WorkflowRunPendingInput } from '@module/workflow-run/types/WorkflowRunPendingInput';

/**
 * Wire shapes of the engine's instance endpoints. The engine names node statuses after its
 * own state machine (`finished`, `stopped`, `not_started`), which the views translate into
 * the vocabulary they render.
 */

type ApiNodeStatus = 'not_started' | 'waiting' | 'running' | 'finished' | 'failed' | 'stopped';

interface ApiNodeOccurrence {
	occurrence_id: string | null;
	status: ApiNodeStatus;
	attempt: number | null;
	rollbackable: boolean;
}

export interface WorkflowRunStatusResponse extends WorkflowRun {
	context_mode: WorkflowRunDetail['context_mode'];
	current_group_id: string | null;
	current_node_id: string | null;
	current_node_instance_id: string | null;
	attempt: number;
	counters: Record<string, number> | null;
	nodes?: Record<string, ApiNodeOccurrence>;
	pending_input?: WorkflowRunPendingInput | null;
}

export interface WorkflowRunNodeDebugResponse {
	occurrence_id: string;
	source_node_definition_id: string;
	name: string;
	type: WorkflowDefinitionNodeType;
	selected_attempt: number | null;
	latest_attempt: number | null;
	attempt_count: number;
	status: ApiNodeStatus;
	context_before: unknown;
	context_after: unknown;
	input: unknown;
	output: unknown;
	error: string | null;
	recovery_policy: string | null;
	recovery_result: string | null;
	cancelled: boolean;
	started_at: string | null;
	finished_at: string | null;
	stopped_at: string | null;
	duration_ms: number | null;
	created_at: string;
	updated_at: string;
}

const nodeStatusMap: Record<ApiNodeStatus, WorkflowRunNodeStatus> = {
	not_started: 'pending',
	waiting: 'waiting',
	running: 'running',
	finished: 'succeeded',
	failed: 'failed',
	stopped: 'cancelled',
};

export const toRunNodeStatus = (status: string): WorkflowRunNodeStatus =>
	nodeStatusMap[status as ApiNodeStatus] ?? 'pending';

export const toRunDetail = (res: WorkflowRunStatusResponse): WorkflowRunDetail => {
	// Nodes the engine never reached carry no occurrence; the views treat a missing entry as pending.
	// A node parked on input is still `running` to the engine, so it is surfaced as waiting.
	const parkedNodeId = res.status === 'waiting' ? res.pending_input?.node_id : undefined;
	const nodes: Record<string, WorkflowRunNodeOccurrence> = {};
	for (const [nodeId, occurrence] of Object.entries(res.nodes ?? {})) {
		if (!occurrence.occurrence_id) continue;
		const status = toRunNodeStatus(occurrence.status);
		nodes[nodeId] = {
			occurrence_id: occurrence.occurrence_id,
			status: nodeId === parkedNodeId && status === 'running' ? 'waiting' : status,
			attempt: occurrence.attempt ?? 1,
			rollbackable: occurrence.rollbackable,
		};
	}

	return {
		...res,
		counters: res.counters ?? {},
		pending_input: res.pending_input ?? null,
		nodes,
	};
};

export const toRunNodeDebug = (res: WorkflowRunNodeDebugResponse): WorkflowRunNodeDebug => ({
	...res,
	source_node_definition_id: res.source_node_definition_id || null,
	status: toRunNodeStatus(res.status),
	latest_attempt: res.latest_attempt ?? res.attempt_count,
	selected_attempt: res.selected_attempt ?? res.attempt_count,
});
