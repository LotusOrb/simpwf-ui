import type { NotificationLevel } from '@module/notification/types/AppNotification';
import type { NotifyOptions } from '@module/notification/types/NotifyOptions';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

const TERMINAL_STATUSES: WorkflowRunStatus[] = ['finished', 'failed', 'stopped'];

export const isTerminalRunStatus = (status: WorkflowRunStatus) => TERMINAL_STATUSES.includes(status);

type RunWatchStatus = Pick<WorkflowRunDetail, 'status' | 'debug' | 'current_node_id' | 'pending_input'>;

/**
 * What a watcher has already been told about a run. Only a change in the key may notify, so a
 * snapshot that repeats the last one (every reconnect starts with one) stays quiet.
 */
export const toRunWatchKey = (run: RunWatchStatus): string => {
	if (run.status === 'waiting' && run.pending_input) return `waiting:${run.pending_input.node_id}`;
	// A debug run pauses after every node, so each new node is a new stop.
	if (run.status === 'paused' && run.debug) return `paused:${run.current_node_id ?? ''}`;
	return run.status;
};

export interface RunWatchNotification extends NotifyOptions {
	level: NotificationLevel;
}

/** The notification for a run's current status, or null when the status is not worth one. */
export const toRunWatchNotification = (
	run: RunWatchStatus & Pick<WorkflowRunDetail, 'id' | 'error'>,
	label?: string,
): RunWatchNotification | null => {
	const name = label ?? `Run ${run.id.slice(0, 8)}`;
	const link = `/app/workflow-run/${run.id}`;

	switch (run.status) {
		case 'finished':
			return { level: 'success', title: 'Run finished', message: `${name} finished`, link };
		case 'failed':
			return {
				level: 'error',
				title: 'Run failed',
				message: run.error ? `${name} failed: ${run.error}` : `${name} failed`,
				link,
			};
		case 'stopped':
			return { level: 'warning', title: 'Run stopped', message: `${name} was stopped`, link };
		case 'waiting':
			if (!run.pending_input) return null;
			return {
				level: 'info',
				title: 'Input needed',
				message: `${name} is waiting for input on ${run.pending_input.node_id}`,
				link,
			};
		case 'paused':
			if (!run.debug) return null;
			return {
				level: 'info',
				title: 'Debug run paused',
				message: `${name} paused at ${run.current_node_id ?? 'start'}`,
				link,
			};
		default:
			return null;
	}
};
