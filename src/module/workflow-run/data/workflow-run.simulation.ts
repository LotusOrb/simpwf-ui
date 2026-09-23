import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';

import { flattenDefinitionNodes } from './workflow-run.detail';
import {
	mockNodeBehaviour,
	mockRunDefinition,
	mockRunScenarios,
	scenarioForRunId,
	type WorkflowRunMockNodeBehaviour,
	type WorkflowRunMockScenarioId,
} from './workflow-run.mock';

/**
 * A tiny in-memory stand-in for the workflow engine. It advances a virtual clock rather
 * than wall-clock time, so a node that really takes 96s still reports 96s while the demo
 * steps through it in a couple of seconds.
 */

export const SIMULATION_TICK_MS = 380;
const TICKS_PER_NODE = 6;

export interface WorkflowRunSimulationState {
	detail: WorkflowRunDetail;
	debug: Record<string, WorkflowRunNodeDebug>;
	context: Record<string, unknown>;
	/** Virtual "now", in epoch ms. */
	clock: number;
	/** Ticks accrued against the node currently in flight. */
	progress: number;
	scenarioId: WorkflowRunMockScenarioId;
}

export type WorkflowRunSimulationAction =
	| { type: 'tick' }
	| { type: 'pause' }
	| { type: 'resume' }
	| { type: 'stop' }
	| { type: 'retry' }
	| { type: 'rollback'; nodeId: string; reason: string }
	| { type: 'submit-input'; payload: unknown }
	| { type: 'replace-context'; context: Record<string, unknown>; reason: string }
	| { type: 'load'; scenarioId: WorkflowRunMockScenarioId; runId: string };

const content = mockRunDefinition.content;

const nodeIndex = new Map(flattenDefinitionNodes(content.nodes).map((node) => [node.id, node]));

const parentIndex = new Map<string, string>();
for (const node of flattenDefinitionNodes(content.nodes)) {
	for (const child of node.nodes ?? []) parentIndex.set(child.id, node.id);
}

const behaviourOf = (nodeId: string): WorkflowRunMockNodeBehaviour => mockNodeBehaviour[nodeId] ?? { durationMs: 250 };

const iso = (ms: number) => new Date(ms).toISOString();

/** `run` counts re-entries (retry, rollback, loops) so each keeps its own debug record. */
const occurrenceId = (nodeId: string, run: number, attempt: number) =>
	`occ-${nodeId}-r${String(run).padStart(2, '0')}-a${String(attempt).padStart(2, '0')}`;

/** Resolves the node the engine moves to after `nodeId` settles successfully. */
export const nextNodeId = (nodeId: string): string | null => {
	const node = nodeIndex.get(nodeId);
	if (!node) return null;

	if (node.type === 'group' && node.start_node_id) return node.start_node_id;
	if (node.type === 'conditions') {
		const branch = node.conditions?.find((condition) => condition.key && content.keys?.[condition.key]);
		return branch?.key ? (content.keys?.[branch.key] ?? null) : null;
	}
	if (node.next_node) return node.next_node;

	// Last node inside a group: fall through to whatever the group points at.
	let parentId = parentIndex.get(nodeId);
	while (parentId) {
		const parent = nodeIndex.get(parentId);
		if (parent?.next_node) return parent.next_node;
		parentId = parentIndex.get(parentId);
	}
	return null;
};

const failureNodeId = (nodeId: string): string | null => nodeIndex.get(nodeId)?.on_failure?.next_node ?? null;

const makeDebug = (
	node: WorkflowDefinitionNode,
	overrides: Partial<WorkflowRunNodeDebug> & { occurrence_id: string; created_at: string },
): WorkflowRunNodeDebug => ({
	name: node.name,
	type: node.type,
	source_node_definition_id: node.node_definition_id ?? null,
	status: 'running',
	cancelled: false,
	attempt_count: 1,
	latest_attempt: 1,
	selected_attempt: 1,
	duration_ms: null,
	error: null,
	recovery_policy: behaviourOf(node.id).recoveryPolicy ?? null,
	recovery_result: null,
	input: behaviourOf(node.id).input ?? null,
	output: null,
	context_before: null,
	context_after: null,
	started_at: null,
	finished_at: null,
	stopped_at: null,
	updated_at: overrides.created_at,
	...overrides,
});

interface Cursor {
	detail: WorkflowRunDetail;
	debug: Record<string, WorkflowRunNodeDebug>;
	context: Record<string, unknown>;
	clock: number;
}

/** Starts `nodeId` at the current clock and records the attempt on the instance. */
const beginNode = (cursor: Cursor, nodeId: string, status: WorkflowRunNodeStatus = 'running') => {
	const node = nodeIndex.get(nodeId);
	if (!node) return;

	const behaviour = behaviourOf(nodeId);
	const attempt = (behaviour.failedAttempts ?? 0) + 1;
	const run = (cursor.detail.counters[nodeId] ?? 0) + 1;
	const id = occurrenceId(nodeId, run, attempt);

	cursor.detail.nodes[nodeId] = { occurrence_id: id, status, attempt, rollbackable: false };
	cursor.debug[id] = makeDebug(node, {
		occurrence_id: id,
		created_at: iso(cursor.clock),
		started_at: iso(cursor.clock),
		status,
		attempt_count: attempt,
		latest_attempt: attempt,
		selected_attempt: attempt,
		error: behaviour.failedAttempts ? (behaviour.error ?? null) : null,
		recovery_result: behaviour.failedAttempts ? `recovered on attempt ${attempt} of ${attempt}` : null,
		context_before: structuredClone(cursor.context),
	});

	cursor.detail.current_node_id = nodeId;
	cursor.detail.current_node_instance_id = id;
	cursor.detail.current_group_id = parentIndex.get(nodeId) ?? null;
	cursor.detail.attempt = attempt;
	cursor.detail.counters[nodeId] = run;
	cursor.detail.updated_at = iso(cursor.clock);
};

/** Settles the node in flight and moves the clock forward by its reported duration. */
const settleNode = (
	cursor: Cursor,
	nodeId: string,
	status: WorkflowRunNodeStatus,
	overrides: Partial<WorkflowRunNodeDebug> = {},
) => {
	const occurrence = cursor.detail.nodes[nodeId];
	const node = nodeIndex.get(nodeId);
	if (!occurrence || !node) return;

	const behaviour = behaviourOf(nodeId);
	const debug = cursor.debug[occurrence.occurrence_id];
	const startedAt = debug.started_at ? new Date(debug.started_at).getTime() : cursor.clock;
	const durationMs = overrides.duration_ms ?? behaviour.durationMs;

	cursor.clock = startedAt + durationMs;

	if (status === 'succeeded' && behaviour.contextPatch) {
		cursor.context = { ...cursor.context, ...structuredClone(behaviour.contextPatch) };
	}

	cursor.debug[occurrence.occurrence_id] = {
		...debug,
		status,
		duration_ms: durationMs,
		output: status === 'succeeded' ? (behaviour.output ?? null) : null,
		error: status === 'failed' ? (behaviour.error ?? 'node execution failed') : debug.error,
		cancelled: status === 'cancelled',
		context_after: structuredClone(cursor.context),
		finished_at: status === 'cancelled' ? null : iso(cursor.clock),
		stopped_at: status === 'cancelled' ? iso(cursor.clock) : null,
		updated_at: iso(cursor.clock),
		...overrides,
	};

	cursor.detail.nodes[nodeId] = { ...occurrence, status, rollbackable: status === 'succeeded' };
	cursor.detail.updated_at = iso(cursor.clock);
};

const waitingStatusFor = (nodeId: string): WorkflowRunNodeStatus =>
	nodeIndex.get(nodeId)?.type === 'input' ? 'waiting' : 'running';

const pendingInputFor = (nodeId: string): WorkflowRunDetail['pending_input'] => {
	const node = nodeIndex.get(nodeId);
	if (!node || node.type !== 'input') return null;
	return {
		node_id: node.id,
		channel: node.channel ?? 'http',
		context_path: node.context_path ?? '',
		form: node.form,
	};
};

const finishRun = (cursor: Cursor, status: WorkflowRunDetail['status'], error: string | null = null) => {
	cursor.detail.status = status;
	cursor.detail.error = error;
	cursor.detail.waiting_reason = null;
	cursor.detail.pending_input = null;
	cursor.detail.pause_requested = false;
	cursor.detail.termination_pending = false;
	cursor.detail.current_node_id = null;
	cursor.detail.current_node_instance_id = null;
	cursor.detail.finished_at = iso(cursor.clock);
	cursor.detail.updated_at = iso(cursor.clock);
};

/** Moves to whatever follows `fromNodeId`, or finishes the run when the branch ends. */
const advance = (cursor: Cursor, fromNodeId: string, viaFailure = false) => {
	const target = viaFailure ? failureNodeId(fromNodeId) : nextNodeId(fromNodeId);

	if (!target) {
		finishRun(cursor, viaFailure ? 'failed' : 'finished', viaFailure ? cursor.detail.error : null);
		return;
	}

	const status = waitingStatusFor(target);
	beginNode(cursor, target, status);

	if (status === 'waiting') {
		cursor.detail.status = 'waiting';
		cursor.detail.waiting_reason = `Waiting for input on channel ${nodeIndex.get(target)?.channel ?? 'http'}`;
		cursor.detail.pending_input = pendingInputFor(target);
	} else {
		cursor.detail.status = 'running';
		cursor.detail.waiting_reason = null;
		cursor.detail.pending_input = null;
	}
};

export const createSimulation = (runId: string, forced?: WorkflowRunMockScenarioId): WorkflowRunSimulationState => {
	const scenarioId = forced ?? scenarioForRunId(runId);
	const scenario = mockRunScenarios[scenarioId];

	const totalCompleted = scenario.completed.reduce((sum, nodeId) => sum + behaviourOf(nodeId).durationMs, 0);
	const start = Date.now() - totalCompleted - behaviourOf(scenario.current ?? '').durationMs / 2;

	const cursor: Cursor = {
		clock: start,
		context: {},
		debug: {},
		detail: {
			id: runId,
			workflow_definition_id: mockRunDefinition.id,
			status: 'running',
			waiting_reason: null,
			pause_requested: false,
			termination_pending: false,
			error: null,
			started_at: iso(start),
			finished_at: null,
			created_by: 'randa',
			updated_by: 'engine',
			created_at: iso(start - 1_200),
			updated_at: iso(start),
			attempt: 1,
			context_mode: content.context_mode ?? 'full',
			current_node_id: null,
			current_node_instance_id: null,
			current_group_id: null,
			counters: {},
			pending_input: null,
			nodes: {},
		},
	};

	for (const nodeId of scenario.completed) {
		beginNode(cursor, nodeId);
		settleNode(cursor, nodeId, 'succeeded');
	}

	for (const nodeId of scenario.skipped ?? []) {
		cursor.detail.nodes[nodeId] = {
			occurrence_id: occurrenceId(nodeId, 0, 0),
			status: 'skipped',
			attempt: 0,
			rollbackable: false,
		};
	}

	if (scenario.current) {
		beginNode(cursor, scenario.current, scenario.currentStatus === 'failed' ? 'running' : scenario.currentStatus);

		if (scenario.currentStatus === 'failed') {
			const attempts = (behaviourOf(scenario.current).failedAttempts ?? 0) + 2;
			settleNode(cursor, scenario.current, 'failed', {
				attempt_count: attempts,
				latest_attempt: attempts,
				selected_attempt: attempts,
				recovery_result: `exhausted after ${attempts} attempts`,
			});
		}
	}

	cursor.detail.status = scenario.status;
	cursor.detail.waiting_reason = scenario.waitingReason ?? null;
	cursor.detail.error = scenario.error ?? null;
	cursor.detail.pending_input = scenario.current ? pendingInputFor(scenario.current) : null;
	if (scenario.status === 'failed') cursor.detail.finished_at = iso(cursor.clock);

	return {
		detail: cursor.detail,
		debug: cursor.debug,
		context: cursor.context,
		clock: Math.max(cursor.clock, Date.now()),
		progress: 0,
		scenarioId,
	};
};

const clone = (state: WorkflowRunSimulationState): WorkflowRunSimulationState => structuredClone(state);

const cursorOf = (state: WorkflowRunSimulationState): Cursor => ({
	detail: state.detail,
	debug: state.debug,
	context: state.context,
	clock: state.clock,
});

const commit = (state: WorkflowRunSimulationState, cursor: Cursor): WorkflowRunSimulationState => ({
	...state,
	detail: cursor.detail,
	debug: cursor.debug,
	context: cursor.context,
	clock: cursor.clock,
});

export const simulationReducer = (
	state: WorkflowRunSimulationState,
	action: WorkflowRunSimulationAction,
): WorkflowRunSimulationState => {
	switch (action.type) {
		case 'load':
			return createSimulation(action.runId, action.scenarioId);

		case 'tick': {
			const { detail } = state;
			const nodeId = detail.current_node_id;
			if (detail.status !== 'running' || !nodeId) {
				// A live poller keeps its bar growing even while nothing settles.
				return state;
			}

			if (state.progress + 1 < TICKS_PER_NODE) {
				const behaviour = behaviourOf(nodeId);
				const step = behaviour.durationMs / TICKS_PER_NODE;
				return { ...state, progress: state.progress + 1, clock: state.clock + step };
			}

			const next = clone(state);
			const cursor = cursorOf(next);
			const behaviour = behaviourOf(nodeId);

			if (next.detail.pause_requested) {
				settleNode(cursor, nodeId, 'succeeded');
				const parked = nextNodeId(nodeId);

				if (!parked) {
					finishRun(cursor, 'finished');
				} else {
					cursor.detail.status = 'paused';
					cursor.detail.pause_requested = false;
					cursor.detail.waiting_reason = `Paused before ${nodeIndex.get(parked)?.name ?? parked}`;
					cursor.detail.current_node_id = parked;
					cursor.detail.current_node_instance_id = null;
				}
				return { ...commit(next, cursor), progress: 0 };
			}

			if (next.detail.termination_pending) {
				settleNode(cursor, nodeId, 'cancelled');
				finishRun(cursor, 'stopped');
				return { ...commit(next, cursor), progress: 0 };
			}

			const scenario = mockRunScenarios[next.scenarioId];
			const shouldFail = scenario.id === 'failed' && nodeId === scenario.current;

			if (shouldFail) {
				settleNode(cursor, nodeId, 'failed');
				cursor.detail.error = behaviour.error ?? 'node execution failed';
				advance(cursor, nodeId, true);
			} else {
				settleNode(cursor, nodeId, 'succeeded');
				advance(cursor, nodeId);
			}

			return { ...commit(next, cursor), progress: 0 };
		}

		case 'pause': {
			const next = clone(state);
			if (next.detail.status === 'waiting') {
				next.detail.status = 'paused';
				next.detail.waiting_reason = 'Paused while waiting for input';
			} else {
				next.detail.pause_requested = true;
			}
			next.detail.updated_at = iso(next.clock);
			return next;
		}

		case 'resume': {
			const next = clone(state);
			const cursor = cursorOf(next);
			cursor.detail.pause_requested = false;

			const nodeId = cursor.detail.current_node_id;
			const pending = nodeId ? pendingInputFor(nodeId) : null;

			if (pending) {
				if (cursor.detail.nodes[nodeId!]?.status !== 'waiting') beginNode(cursor, nodeId!, 'waiting');
				cursor.detail.status = 'waiting';
				cursor.detail.pending_input = pending;
				cursor.detail.waiting_reason = `Waiting for input on channel ${pending.channel}`;
			} else {
				cursor.detail.status = 'running';
				cursor.detail.waiting_reason = null;
				if (nodeId && cursor.detail.nodes[nodeId]?.status !== 'running') {
					beginNode(cursor, nodeId);
				}
			}
			return { ...commit(next, cursor), progress: 0 };
		}

		case 'stop': {
			const next = clone(state);
			const cursor = cursorOf(next);
			const nodeId = cursor.detail.current_node_id;

			if (cursor.detail.status === 'running') {
				cursor.detail.termination_pending = true;
				cursor.detail.updated_at = iso(cursor.clock);
				return commit(next, cursor);
			}

			if (nodeId && !['succeeded', 'failed'].includes(cursor.detail.nodes[nodeId]?.status ?? '')) {
				settleNode(cursor, nodeId, 'cancelled');
			}
			finishRun(cursor, 'stopped');
			return { ...commit(next, cursor), progress: 0 };
		}

		case 'retry': {
			const next = clone(state);
			const cursor = cursorOf(next);
			const nodeId = cursor.detail.current_node_id ?? mockRunScenarios[next.scenarioId].current;
			if (!nodeId) return state;

			cursor.clock = Math.max(cursor.clock, Date.now());
			cursor.detail.error = null;
			cursor.detail.finished_at = null;
			beginNode(cursor, nodeId);
			cursor.detail.status = 'running';
			return { ...commit(next, cursor), progress: 0, scenarioId: 'live' };
		}

		case 'rollback': {
			const next = clone(state);
			const cursor = cursorOf(next);
			const target = cursor.detail.nodes[action.nodeId];
			if (!target) return state;

			const targetStartedAt = new Date(cursor.debug[target.occurrence_id]?.started_at ?? 0).getTime();

			// Everything that began at or after the target is undone, the target included.
			for (const [nodeId, occurrence] of Object.entries(cursor.detail.nodes)) {
				const startedAt = new Date(cursor.debug[occurrence.occurrence_id]?.started_at ?? 0).getTime();
				if (startedAt < targetStartedAt || occurrence.status === 'skipped') continue;
				cursor.detail.nodes[nodeId] = { ...occurrence, status: 'rolled_back', rollbackable: false };
				const debug = cursor.debug[occurrence.occurrence_id];
				if (debug) cursor.debug[occurrence.occurrence_id] = { ...debug, status: 'rolled_back' };
			}

			cursor.context = structuredClone(
				(cursor.debug[target.occurrence_id]?.context_before as Record<string, unknown>) ?? {},
			);
			cursor.clock = Math.max(cursor.clock, Date.now());
			cursor.detail.error = null;
			cursor.detail.finished_at = null;
			cursor.detail.status = 'paused';
			cursor.detail.waiting_reason = `Rolled back to ${nodeIndex.get(action.nodeId)?.name ?? action.nodeId}: ${action.reason || 'no reason given'}`;
			cursor.detail.current_node_id = action.nodeId;
			cursor.detail.current_node_instance_id = null;
			cursor.detail.pending_input = null;
			cursor.detail.updated_by = 'randa';

			return { ...commit(next, cursor), progress: 0 };
		}

		case 'submit-input': {
			const next = clone(state);
			const cursor = cursorOf(next);
			const nodeId = cursor.detail.current_node_id;
			if (!nodeId) return state;

			const node = nodeIndex.get(nodeId);
			cursor.clock = Math.max(cursor.clock, Date.now());
			if (node?.context_path) {
				cursor.context = { ...cursor.context, [node.context_path]: structuredClone(action.payload) };
			}

			settleNode(cursor, nodeId, 'succeeded', {
				input: action.payload,
				output: action.payload,
				duration_ms: 60,
			});
			advance(cursor, nodeId);

			return { ...commit(next, cursor), progress: 0 };
		}

		case 'replace-context': {
			const next = clone(state);
			next.context = structuredClone(action.context);
			next.detail.updated_by = 'randa';
			next.detail.updated_at = iso(next.clock);
			return next;
		}

		default:
			return state;
	}
};
