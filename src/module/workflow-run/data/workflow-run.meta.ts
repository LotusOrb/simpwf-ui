import type { IconType } from 'react-icons';
import { LuCircleCheck, LuCirclePause, LuCircleStop, LuCircleX, LuHourglass, LuLoaderCircle } from 'react-icons/lu';

import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunAction } from '@module/workflow-run/types/WorkflowRunAction';
import type { WorkflowRunSort } from '@module/workflow-run/types/WorkflowRunSort';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

export const runStatusMeta: Record<WorkflowRunStatus, { label: string; color: string; icon: IconType }> = {
	running: { label: 'Running', color: 'blue', icon: LuLoaderCircle },
	waiting: { label: 'Waiting', color: 'yellow', icon: LuHourglass },
	paused: { label: 'Paused', color: 'orange', icon: LuCirclePause },
	failed: { label: 'Failed', color: 'red', icon: LuCircleX },
	finished: { label: 'Finished', color: 'teal', icon: LuCircleCheck },
	stopped: { label: 'Stopped', color: 'gray', icon: LuCircleStop },
};

export const runStatusOrder = Object.keys(runStatusMeta) as WorkflowRunStatus[];

export const getAllowedActions = (run: WorkflowRun): WorkflowRunAction[] => {
	if (run.termination_pending) return [];
	const actions: WorkflowRunAction[] = [];
	if ((run.status === 'running' || run.status === 'waiting') && !run.pause_requested) actions.push('pause');
	if (run.status === 'paused') actions.push('resume');
	if (run.status === 'running' || run.status === 'waiting' || run.status === 'paused') actions.push('stop');
	return actions;
};

export const formatRunDuration = (run: WorkflowRun): string => {
	if (!run.started_at) return '—';
	const end = run.finished_at ? new Date(run.finished_at).getTime() : Date.now();
	const seconds = Math.max(0, Math.round((end - new Date(run.started_at).getTime()) / 1000));

	if (seconds < 60) return `${seconds}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ${seconds % 60}s`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ${minutes % 60}m`;
	return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export const shortRunId = (id: string) => id.slice(-8);

export const runSortOrders: Record<WorkflowRunSort, { label: string; by: string; direction: 'asc' | 'desc' }> = {
	newest: { label: 'Newest', by: 'created_at', direction: 'desc' },
	oldest: { label: 'Oldest', by: 'created_at', direction: 'asc' },
	updated: { label: 'Recently updated', by: 'updated_at', direction: 'desc' },
	status: { label: 'Status', by: 'status', direction: 'asc' },
};
