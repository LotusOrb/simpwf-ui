import type { IconType } from 'react-icons';
import {
	LuBan,
	LuCheck,
	LuCircleCheck,
	LuCircleDashed,
	LuCirclePause,
	LuCircleStop,
	LuCircleX,
	LuGitMerge,
	LuHourglass,
	LuLoaderCircle,
	LuSkipForward,
	LuUndo2,
	LuX,
} from 'react-icons/lu';

import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';
import type { WorkflowRunParallelBranchStatus } from '@module/workflow-run/types/WorkflowRunParallelBranchStatus';
import type { WorkflowRunParallelExecutionStatus } from '@module/workflow-run/types/WorkflowRunParallelExecutionStatus';
import type { WorkflowRunSort } from '@module/workflow-run/types/WorkflowRunSort';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';
import type { WorkflowRunStatusTab } from '@module/workflow-run/types/WorkflowRunStatusTab';

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

export const GRAPH_NODE_WIDTH = 216;

export const GRAPH_NODE_HEIGHT = 96;

export const runStatusMeta: Record<WorkflowRunStatus, { label: string; color: string; icon: IconType }> = {
	running: { label: 'Running', color: 'blue', icon: LuLoaderCircle },
	waiting: { label: 'Waiting', color: 'yellow', icon: LuHourglass },
	paused: { label: 'Paused', color: 'orange', icon: LuCirclePause },
	failed: { label: 'Failed', color: 'red', icon: LuCircleX },
	finished: { label: 'Finished', color: 'teal', icon: LuCircleCheck },
	stopped: { label: 'Stopped', color: 'gray', icon: LuCircleStop },
};

export const runStatusOrder = Object.keys(runStatusMeta) as WorkflowRunStatus[];

/** Status tabs on the run list, in display order. `statuses: null` sends no status filter. */
export const runStatusTabs: Record<
	WorkflowRunStatusTab,
	{ label: string; color?: string; statuses: WorkflowRunStatus[] | null }
> = {
	all: { label: 'All runs', statuses: null },
	active: { label: 'Active', statuses: ['running', 'waiting', 'paused'] },
	...(Object.fromEntries(
		runStatusOrder.map((status) => [
			status,
			{ label: runStatusMeta[status].label, color: runStatusMeta[status].color, statuses: [status] },
		]),
	) as Record<WorkflowRunStatus, { label: string; color: string; statuses: WorkflowRunStatus[] }>),
};

export const runStatusTabOrder = Object.keys(runStatusTabs) as WorkflowRunStatusTab[];

export const runSortOrders: Record<WorkflowRunSort, { label: string; by: string; direction: 'asc' | 'desc' }> = {
	newest: { label: 'Newest', by: 'created_at', direction: 'desc' },
	oldest: { label: 'Oldest', by: 'created_at', direction: 'asc' },
	updated: { label: 'Recently updated', by: 'updated_at', direction: 'desc' },
	status: { label: 'Status', by: 'status', direction: 'asc' },
};

export const parallelExecutionStatusMeta: Record<
	WorkflowRunParallelExecutionStatus,
	{ label: string; color: string; icon: IconType }
> = {
	waiting_for_branches: { label: 'Running branches', color: 'blue', icon: LuLoaderCircle },
	ready_to_join: { label: 'Joining', color: 'indigo', icon: LuGitMerge },
	completed: { label: 'Completed', color: 'teal', icon: LuCircleCheck },
	failed: { label: 'Failed', color: 'red', icon: LuCircleX },
	cancelled: { label: 'Cancelled', color: 'gray', icon: LuBan },
};

export const parallelBranchStatusMeta: Record<
	WorkflowRunParallelBranchStatus,
	{ label: string; color: string; icon: IconType }
> = {
	pending: { label: 'Pending', color: 'gray', icon: LuCircleDashed },
	running: { label: 'Running', color: 'blue', icon: LuLoaderCircle },
	waiting: { label: 'Waiting', color: 'yellow', icon: LuHourglass },
	completed: { label: 'Completed', color: 'teal', icon: LuCircleCheck },
	failed: { label: 'Failed', color: 'red', icon: LuCircleX },
	cancelled: { label: 'Cancelled', color: 'gray', icon: LuBan },
};
