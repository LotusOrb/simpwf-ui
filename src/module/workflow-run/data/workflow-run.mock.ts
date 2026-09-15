import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

import { workflowDefinitions, type WorkflowNode } from '@module/workflow-definition/data';

export type WorkflowRunStatus = 'waiting' | 'running' | 'paused' | 'finished' | 'failed' | 'stopped';

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

export interface WorkflowRunList {
	items: WorkflowRun[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}

export interface WorkflowRunQuery extends ComplexQueryParam {
	workflowDefinitionId?: string | null;
	status?: WorkflowRunStatus[];
}

const users = ['0198f000-0000-7000-8000-00000000a001', '0198f000-0000-7000-8000-00000000a002'];
const now = Date.now();
const minutesAgo = (minutes: number) => new Date(now - minutes * 60_000).toISOString();

const random = (() => {
	let seed = 20260916;
	return () => {
		seed = (seed * 1_103_515_245 + 12_345) % 2_147_483_648;
		return seed / 2_147_483_648;
	};
})();
const pick = <T>(items: T[]): T => items[Math.floor(random() * items.length)];

const flatten = (nodes: WorkflowNode[]): WorkflowNode[] =>
	nodes.flatMap((node) => [node, ...flatten(node.nodes ?? [])]);

const statusPlan: WorkflowRunStatus[] = [
	'running',
	'running',
	'running',
	'running',
	'waiting',
	'waiting',
	'waiting',
	'paused',
	'paused',
	'failed',
	'failed',
	'failed',
	'failed',
	'stopped',
	'stopped',
	...Array.from({ length: 23 }, () => 'finished' as const),
];

const failureTemplates: Record<string, (name: string) => string> = {
	external_call: (name) => `external_call "${name}": POST returned 503 Service Unavailable after 3 retries`,
	poller: (name) => `poller "${name}": until predicate not matched after 30 attempts`,
	script: (name) => `script "${name}": TypeError: Cannot read property 'id' of undefined`,
	input: (name) => `input "${name}": validation rejected payload`,
};

const buildRuns = (): WorkflowRun[] => {
	const latestDefinitions = workflowDefinitions.filter(
		(definition) =>
			!workflowDefinitions.some(
				(other) => other.lineage_id === definition.lineage_id && other.version > definition.version,
			),
	);

	return statusPlan.map((status, index) => {
		const definition = index % 7 === 6 ? pick(workflowDefinitions) : pick(latestDefinitions);
		const nodes = flatten(definition.content.nodes);
		const isActive = status === 'running' || status === 'waiting' || status === 'paused';

		const createdMinutes = isActive ? 1 + Math.floor(random() * 240) : 30 + Math.floor(random() * 60 * 24 * 6);
		const startedMinutes = createdMinutes - random() * 0.2;
		const runMinutes = 0.05 + random() * (status === 'failed' ? 12 : 40);
		const finishedMinutes = Math.max(0, startedMinutes - runMinutes);

		let waitingReason: string | null = null;
		let error: string | null = null;

		if (status === 'waiting') {
			const inputNode = nodes.find((node) => node.type === 'input');
			const pollerNode = nodes.find((node) => node.type === 'poller');
			waitingReason = inputNode
				? `Waiting for input on "${inputNode.name}"`
				: pollerNode
					? `Polling "${pollerNode.name}"`
					: 'Waiting for worker';
		}

		if (status === 'failed') {
			const failing = nodes.find((node) => node.type === 'external_call' || node.type === 'poller') ?? nodes[0];
			error = (failureTemplates[failing.type] ?? failureTemplates.script)(failing.name);
		}

		const lastTouched = isActive ? Math.max(0, createdMinutes - random() * createdMinutes) : finishedMinutes;

		return {
			id: `019a${(0x1000 + index * 37).toString(16)}-${(0x2000 + index * 91).toString(16)}-7000-8000-${String(index + 1).padStart(12, '0')}`,
			workflow_definition_id: definition.id,
			status,
			waiting_reason: waitingReason,
			pause_requested: false,
			termination_pending: false,
			error,
			started_at: minutesAgo(startedMinutes),
			finished_at: isActive ? null : minutesAgo(finishedMinutes),
			created_by: users[index % users.length],
			updated_by: users[(index + 1) % users.length],
			created_at: minutesAgo(createdMinutes),
			updated_at: minutesAgo(lastTouched),
		};
	});
};

const workflowRuns: WorkflowRun[] = buildRuns();

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const sortableFields = ['id', 'workflow_definition_id', 'status', 'created_at', 'updated_at'] as const;
type SortableField = (typeof sortableFields)[number];

export const listWorkflowRuns = async (query: WorkflowRunQuery = {}): Promise<WorkflowRunList> => {
	const { page = 1, perPage = 8, search, order, workflowDefinitionId, status } = query;

	await delay(300);

	const term = search?.trim().toLowerCase();
	const filtered = workflowRuns.filter((run) => {
		if (term && !run.id.includes(term)) return false;
		if (workflowDefinitionId && run.workflow_definition_id !== workflowDefinitionId) return false;
		if (status?.length && !status.includes(run.status)) return false;
		return true;
	});

	const by: SortableField = sortableFields.includes(order?.by as SortableField)
		? (order?.by as SortableField)
		: 'created_at';
	const direction = order?.direction === 'asc' ? 1 : -1;
	filtered.sort((a, b) => a[by].localeCompare(b[by]) * direction);

	const total = filtered.length;
	const start = (page - 1) * perPage;

	return {
		items: filtered.slice(start, start + perPage).map((run) => ({ ...run })),
		page,
		per_page: perPage,
		total,
		total_pages: Math.max(1, Math.ceil(total / perPage)),
	};
};

export const countWorkflowRunsByStatus = async (
	query: Omit<WorkflowRunQuery, 'status' | 'page' | 'perPage' | 'order'>,
): Promise<Record<WorkflowRunStatus | 'all', number>> => {
	const statuses: WorkflowRunStatus[] = ['waiting', 'running', 'paused', 'finished', 'failed', 'stopped'];
	const [all, ...byStatus] = await Promise.all([
		listWorkflowRuns({ ...query, perPage: 1 }),
		...statuses.map((status) => listWorkflowRuns({ ...query, status: [status], perPage: 1 })),
	]);

	return Object.fromEntries([
		['all', all.total],
		...statuses.map((status, index) => [status, byStatus[index].total]),
	]) as Record<WorkflowRunStatus | 'all', number>;
};

export class WorkflowRunConflictError extends Error {}

const findRun = (id: string) => {
	const run = workflowRuns.find((item) => item.id === id);
	if (!run) throw new Error(`Workflow run ${id} not found`);
	return run;
};

const touch = (run: WorkflowRun) => {
	run.updated_at = new Date().toISOString();
	run.updated_by = users[0];
};

const settleLater = (run: WorkflowRun, settle: () => void) =>
	setTimeout(() => {
		settle();
		run.updated_at = new Date().toISOString();
	}, 3000);

export const pauseWorkflowRun = async (id: string) => {
	await delay(250);
	const run = findRun(id);
	if (run.status !== 'running' && run.status !== 'waiting') {
		throw new WorkflowRunConflictError(`Cannot pause a ${run.status} run`);
	}
	if (run.status === 'running') {
		run.pause_requested = true;
		settleLater(run, () => {
			if (run.status !== 'running' || !run.pause_requested) return;
			run.status = 'paused';
			run.pause_requested = false;
		});
	} else {
		run.status = 'paused';
		run.waiting_reason = null;
	}
	touch(run);
	return { status: run.status, pause_requested: run.pause_requested };
};

export const resumeWorkflowRun = async (id: string) => {
	await delay(250);
	const run = findRun(id);
	if (run.status !== 'paused') throw new WorkflowRunConflictError(`Cannot resume a ${run.status} run`);
	run.status = 'running';
	run.pause_requested = false;
	touch(run);
	return { status: run.status };
};

export const stopWorkflowRun = async (id: string) => {
	await delay(250);
	const run = findRun(id);
	if (run.status === 'finished' || run.status === 'failed' || run.status === 'stopped') {
		throw new WorkflowRunConflictError(`Cannot stop a ${run.status} run`);
	}
	if (run.status === 'running') {
		run.termination_pending = true;
		settleLater(run, () => {
			run.status = 'stopped';
			run.termination_pending = false;
			run.pause_requested = false;
			run.finished_at = new Date().toISOString();
		});
	} else {
		run.status = 'stopped';
		run.waiting_reason = null;
		run.finished_at = new Date().toISOString();
	}
	touch(run);
	return { status: run.status, termination_pending: run.termination_pending };
};
