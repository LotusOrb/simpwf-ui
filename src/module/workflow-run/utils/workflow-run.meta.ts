import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunAction } from '@module/workflow-run/types/WorkflowRunAction';

export const getAllowedActions = (run: WorkflowRun): WorkflowRunAction[] => {
	if (run.termination_pending) return [];
	const actions: WorkflowRunAction[] = [];
	if ((run.status === 'running' || run.status === 'waiting') && !run.pause_requested) actions.push('pause');
	if (run.status === 'paused') actions.push('resume');
	if (run.status === 'running' || run.status === 'waiting' || run.status === 'paused') actions.push('stop');
	// The engine migrates paused, failed and input-parked runs only.
	if (
		run.status === 'paused' ||
		run.status === 'failed' ||
		(run.status === 'waiting' && run.waiting_reason === 'input')
	)
		actions.push('migrate');
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

const waitingReasonLabels: Record<string, string> = {
	input: 'Waiting for input',
	parallel: 'Waiting for parallel branches',
	paused: 'Paused',
	delay: 'Delayed',
};

/** Engine park reasons are bare enums (`input`); unknown ones are shown as sent. */
export const formatWaitingReason = (reason: string): string => waitingReasonLabels[reason] ?? reason;

export const shortRunId = (id: string) => id.slice(-8);

/** Shown when the definition name is unknown: deleted, or the caller cannot read definitions. */
export const definitionFallbackLabel = (definitionId: string) => `Definition #${definitionId.slice(-8)}`;
