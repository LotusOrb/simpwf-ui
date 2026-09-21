import type { IconType } from 'react-icons';
import {
	LuBan,
	LuCheck,
	LuCircleDashed,
	LuHourglass,
	LuLoaderCircle,
	LuSkipForward,
	LuUndo2,
	LuX,
} from 'react-icons/lu';

import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';

export const nodeRunStatusMeta: Record<
	WorkflowRunNodeStatus,
	{ label: string; color: string; icon: IconType; settled: boolean }
> = {
	pending: { label: 'Not reached', color: 'gray', icon: LuCircleDashed, settled: false },
	running: { label: 'Running', color: 'blue', icon: LuLoaderCircle, settled: false },
	waiting: { label: 'Waiting', color: 'yellow', icon: LuHourglass, settled: false },
	succeeded: { label: 'Succeeded', color: 'teal', icon: LuCheck, settled: true },
	failed: { label: 'Failed', color: 'red', icon: LuX, settled: true },
	cancelled: { label: 'Cancelled', color: 'gray', icon: LuBan, settled: true },
	skipped: { label: 'Skipped', color: 'gray', icon: LuSkipForward, settled: true },
	rolled_back: { label: 'Rolled back', color: 'grape', icon: LuUndo2, settled: false },
};

export const isNodeReached = (status: WorkflowRunNodeStatus) => status !== 'pending' && status !== 'skipped';

export const formatDuration = (ms: number | null): string => {
	if (ms === null) return '—';
	if (ms < 1000) return `${ms}ms`;
	if (ms < 60_000) return `${(ms / 1000).toFixed(ms < 10_000 ? 2 : 1)}s`;
	const minutes = Math.floor(ms / 60_000);
	const seconds = Math.round((ms % 60_000) / 1000);
	if (minutes < 60) return `${minutes}m ${seconds}s`;
	return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
};

export const flattenDefinitionNodes = (nodes: WorkflowDefinitionNode[]): WorkflowDefinitionNode[] =>
	nodes.flatMap((node) => [node, ...(node.nodes ? flattenDefinitionNodes(node.nodes) : [])]);

/** Nodes of the definition keyed by id, including nodes nested inside groups. */
export const indexDefinitionNodes = (content: WorkflowDefinitionContent) =>
	new Map(flattenDefinitionNodes(content.nodes).map((node) => [node.id, node]));

export interface WorkflowRunProgress {
	reached: number;
	settled: number;
	total: number;
	failed: number;
	percent: number;
}

export const getRunProgress = (detail: WorkflowRunDetail, content: WorkflowDefinitionContent): WorkflowRunProgress => {
	const total = flattenDefinitionNodes(content.nodes).filter((node) => node.type !== 'group').length;
	const occurrences = Object.values(detail.nodes);
	const reached = occurrences.filter((occurrence) => isNodeReached(occurrence.status)).length;
	const settled = occurrences.filter((occurrence) => nodeRunStatusMeta[occurrence.status].settled).length;

	return {
		reached,
		settled,
		total,
		failed: occurrences.filter((occurrence) => occurrence.status === 'failed').length,
		percent: total === 0 ? 0 : Math.round((settled / total) * 100),
	};
};

export interface WorkflowRunTimelineEntry {
	nodeId: string;
	occurrenceId: string;
	name: string;
	type: WorkflowDefinitionNode['type'];
	status: WorkflowRunNodeStatus;
	attempt: number;
	attemptCount: number;
	startedAt: number;
	/** Wall-clock end, using `now` for entries still in flight. */
	endedAt: number;
	durationMs: number | null;
	running: boolean;
	error: string | null;
	rollbackable: boolean;
	/** Fractions of the run window, 0–1. */
	offset: number;
	width: number;
}

export interface WorkflowRunTimeline {
	entries: WorkflowRunTimelineEntry[];
	startedAt: number;
	endedAt: number;
	spanMs: number;
}

const MIN_BAR_WIDTH = 0.012;

/**
 * Lays every executed occurrence out on a shared time axis. Occurrences still in flight
 * are extended to `now` so the bar keeps growing while the run is live.
 */
export const buildRunTimeline = (
	detail: WorkflowRunDetail,
	debug: Record<string, WorkflowRunNodeDebug>,
	now = Date.now(),
): WorkflowRunTimeline => {
	const executed = Object.entries(detail.nodes)
		.map(([nodeId, occurrence]) => ({ nodeId, occurrence, debug: debug[occurrence.occurrence_id] }))
		.filter((item) => !!item.debug && !!item.debug.started_at);

	const raw = executed.map(({ nodeId, occurrence, debug: node }) => {
		const startedAt = new Date(node.started_at!).getTime();
		const finishedAt = node.finished_at ?? node.stopped_at;
		const running = !finishedAt;
		const endedAt = finishedAt ? new Date(finishedAt).getTime() : now;

		return {
			nodeId,
			occurrenceId: occurrence.occurrence_id,
			name: node.name,
			type: node.type,
			status: node.status,
			attempt: occurrence.attempt,
			attemptCount: node.attempt_count,
			startedAt,
			endedAt,
			durationMs: node.duration_ms ?? (running ? endedAt - startedAt : null),
			running,
			error: node.error,
			rollbackable: occurrence.rollbackable,
		};
	});

	raw.sort((a, b) => a.startedAt - b.startedAt || a.name.localeCompare(b.name));

	const startedAt = raw.length > 0 ? Math.min(...raw.map((entry) => entry.startedAt)) : now;
	const endedAt = raw.length > 0 ? Math.max(...raw.map((entry) => entry.endedAt)) : now;
	const spanMs = Math.max(1, endedAt - startedAt);

	return {
		startedAt,
		endedAt,
		spanMs,
		entries: raw.map((entry) => {
			const offset = (entry.startedAt - startedAt) / spanMs;
			const width = Math.max(MIN_BAR_WIDTH, (entry.endedAt - entry.startedAt) / spanMs);
			return { ...entry, offset: Math.min(offset, 1 - MIN_BAR_WIDTH), width: Math.min(width, 1 - offset) };
		}),
	};
};

export const formatJson = (value: unknown): string => {
	if (value === undefined) return '';
	if (typeof value === 'string') {
		try {
			return JSON.stringify(JSON.parse(value), null, 2);
		} catch {
			return value;
		}
	}
	return JSON.stringify(value, null, 2);
};
