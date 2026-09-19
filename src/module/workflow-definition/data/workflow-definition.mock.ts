import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionComplexity } from '@module/workflow-definition/types/WorkflowDefinitionComplexity';
import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionList } from '@module/workflow-definition/types/WorkflowDefinitionList';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';
import type { WorkflowDefinitionQuery } from '@module/workflow-definition/types/WorkflowDefinitionQuery';

import { getComplexity } from './workflow-definition.meta';

type StepSpec = {
	type: WorkflowDefinitionNodeType;
	name: string;
	branches?: StepSpec[][];
	children?: StepSpec[];
	fallback?: string;
};

const uuid = (lineage: number, version: number, index: number) =>
	`0199${String(lineage).padStart(4, '0')}-${String(version).padStart(4, '0')}-7000-8000-${String(index).padStart(12, '0')}`;

const buildContent = (lineage: number, version: number, steps: StepSpec[], contextMode: 'full' | 'lean') => {
	let counter = 0;
	const nextId = () => uuid(lineage, version, ++counter);
	const keys: Record<string, string | null> = {};

	const buildSequence = (
		sequence: StepSpec[],
		exitId: string | null,
	): { headId: string | null; nodes: WorkflowDefinitionNode[] } => {
		let followingId = exitId;
		const nodes: WorkflowDefinitionNode[] = [];

		for (const step of [...sequence].reverse()) {
			const node: WorkflowDefinitionNode = { id: nextId(), type: step.type, name: step.name };

			if (step.type === 'conditions' && step.branches) {
				node.conditions = step.branches.map((branch, index) => {
					const built = buildSequence(branch, followingId);
					nodes.push(...built.nodes);
					const key = `${node.id.slice(-4)}_branch_${index}`;
					keys[key] = built.headId;
					return { key, condition: `return context.route === ${index};` };
				});
			} else if (step.type === 'group' && step.children) {
				const built = buildSequence(step.children, null);
				node.nodes = built.nodes;
				node.start_node_id = built.headId ?? undefined;
				node.next_node = followingId;
			} else {
				node.next_node = followingId;
			}

			if (step.fallback) {
				const fallback: WorkflowDefinitionNode = {
					id: nextId(),
					type: 'script',
					name: step.fallback,
					next_node: null,
				};
				node.on_failure = fallback.id;
				nodes.push(fallback);
			}

			nodes.push(node);
			followingId = node.id;
		}

		return { headId: followingId, nodes: nodes.reverse() };
	};

	const { headId, nodes } = buildSequence(steps, null);
	const content: WorkflowDefinitionContent = { start_node_id: headId ?? '', context_mode: contextMode, nodes };
	if (Object.keys(keys).length > 0) content.keys = keys;
	return content;
};

const users = ['0198f000-0000-7000-8000-00000000a001', '0198f000-0000-7000-8000-00000000a002'];
const referenceTime = new Date('2026-09-16T09:00:00Z').getTime();
const hoursAgo = (hours: number) => new Date(referenceTime - hours * 3_600_000).toISOString();

type LineageSpec = {
	name: string;
	contextMode: 'full' | 'lean';
	versions: { createdHoursAgo: number; steps: StepSpec[] }[];
};

const approvalSteps: StepSpec[] = [
	{ type: 'input', name: 'Receive request' },
	{ type: 'script', name: 'Load profile' },
	{
		type: 'conditions',
		name: 'Route by title',
		branches: [[{ type: 'input', name: 'Manager approval' }], [{ type: 'script', name: 'Auto approve' }]],
	},
	{ type: 'external_call', name: 'Notify requester' },
];

const lineages: LineageSpec[] = [
	{
		name: 'Leave Approval',
		contextMode: 'full',
		versions: [
			{ createdHoursAgo: 720, steps: approvalSteps },
			{ createdHoursAgo: 240, steps: [...approvalSteps, { type: 'output', name: 'Publish audit log' }] },
			{
				createdHoursAgo: 3,
				steps: [
					...approvalSteps.slice(0, 3),
					{ type: 'external_call', name: 'Notify requester', fallback: 'Queue retry' },
					{ type: 'output', name: 'Publish audit log' },
				],
			},
		],
	},
	{
		name: 'Order Fulfillment',
		contextMode: 'lean',
		versions: [
			{
				createdHoursAgo: 410,
				steps: [
					{ type: 'input', name: 'Order webhook' },
					{ type: 'script', name: 'Validate order' },
					{ type: 'external_call', name: 'Reserve stock', fallback: 'Mark backorder' },
					{ type: 'poller', name: 'Wait for payment' },
					{
						type: 'group',
						name: 'Ship',
						children: [
							{ type: 'external_call', name: 'Create label' },
							{ type: 'script', name: 'Attach tracking' },
						],
					},
					{ type: 'output', name: 'Emit shipped event' },
				],
			},
			{
				createdHoursAgo: 26,
				steps: [
					{ type: 'input', name: 'Order webhook' },
					{ type: 'script', name: 'Validate order' },
					{
						type: 'conditions',
						name: 'Split by region',
						branches: [
							[{ type: 'external_call', name: 'Reserve stock (EU)', fallback: 'Mark backorder' }],
							[{ type: 'external_call', name: 'Reserve stock (US)' }],
						],
					},
					{ type: 'poller', name: 'Wait for payment' },
					{
						type: 'group',
						name: 'Ship',
						children: [
							{ type: 'external_call', name: 'Create label' },
							{ type: 'script', name: 'Attach tracking' },
						],
					},
					{ type: 'output', name: 'Emit shipped event' },
				],
			},
		],
	},
	{
		name: 'Invoice Reminder',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 52,
				steps: [
					{ type: 'script', name: 'Find overdue invoices' },
					{ type: 'external_call', name: 'Send reminder email' },
					{ type: 'output', name: 'Publish reminder sent' },
				],
			},
		],
	},
	{
		name: 'Employee Onboarding',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 900,
				steps: [
					{ type: 'input', name: 'New hire form' },
					{ type: 'script', name: 'Build account payload' },
					{ type: 'external_call', name: 'Create accounts' },
				],
			},
			{
				createdHoursAgo: 96,
				steps: [
					{ type: 'input', name: 'New hire form' },
					{ type: 'script', name: 'Build account payload' },
					{
						type: 'group',
						name: 'Provision tools',
						children: [
							{ type: 'external_call', name: 'Create email' },
							{ type: 'external_call', name: 'Invite to chat' },
							{ type: 'external_call', name: 'Grant repo access' },
						],
					},
					{ type: 'input', name: 'Manager checklist' },
					{ type: 'output', name: 'Publish onboarded' },
				],
			},
		],
	},
	{
		name: 'Payment Reconciliation',
		contextMode: 'lean',
		versions: [
			{
				createdHoursAgo: 8,
				steps: [
					{ type: 'poller', name: 'Poll settlement file' },
					{ type: 'script', name: 'Parse transactions' },
					{
						type: 'conditions',
						name: 'Match ledger',
						branches: [
							[{ type: 'script', name: 'Mark reconciled' }],
							[
								{ type: 'external_call', name: 'Open dispute ticket' },
								{ type: 'input', name: 'Finance review' },
							],
							[{ type: 'script', name: 'Flag duplicate' }],
						],
					},
					{ type: 'output', name: 'Publish report' },
				],
			},
		],
	},
	{
		name: 'Slack Incident Alert',
		contextMode: 'lean',
		versions: [
			{
				createdHoursAgo: 150,
				steps: [
					{ type: 'input', name: 'Alertmanager hook' },
					{ type: 'external_call', name: 'Post to channel' },
				],
			},
		],
	},
	{
		name: 'Document Collection',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 330,
				steps: [
					{ type: 'script', name: 'Build checklist' },
					{ type: 'input', name: 'Upload ID' },
					{ type: 'input', name: 'Upload contract' },
					{ type: 'external_call', name: 'Store in drive', fallback: 'Notify ops' },
					{ type: 'output', name: 'Publish completed' },
				],
			},
		],
	},
	{
		name: 'Nightly Data Export',
		contextMode: 'lean',
		versions: [
			{
				createdHoursAgo: 1200,
				steps: [
					{ type: 'script', name: 'Compute date window' },
					{ type: 'external_call', name: 'Export rows' },
					{ type: 'output', name: 'Publish export ready' },
				],
			},
			{
				createdHoursAgo: 600,
				steps: [
					{ type: 'script', name: 'Compute date window' },
					{ type: 'external_call', name: 'Export rows', fallback: 'Record failure' },
					{ type: 'poller', name: 'Wait for upload' },
					{ type: 'output', name: 'Publish export ready' },
				],
			},
		],
	},
	{
		name: 'Refund Request',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 70,
				steps: [
					{ type: 'input', name: 'Refund form' },
					{
						type: 'conditions',
						name: 'Check amount',
						branches: [
							[{ type: 'script', name: 'Auto refund' }],
							[
								{ type: 'input', name: 'Supervisor approval' },
								{ type: 'external_call', name: 'Issue refund' },
							],
						],
					},
					{ type: 'external_call', name: 'Email customer' },
				],
			},
		],
	},
	{
		name: 'Payslip Distribution',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 480,
				steps: [
					{ type: 'script', name: 'Load payroll batch' },
					{
						type: 'group',
						name: 'Per employee',
						children: [
							{ type: 'external_call', name: 'Render PDF' },
							{ type: 'external_call', name: 'Send payslip' },
						],
					},
					{ type: 'output', name: 'Publish batch done' },
				],
			},
		],
	},
	{
		name: 'Lead Enrichment',
		contextMode: 'lean',
		versions: [
			{
				createdHoursAgo: 18,
				steps: [
					{ type: 'input', name: 'CRM lead created' },
					{ type: 'external_call', name: 'Lookup company', fallback: 'Mark unknown' },
					{ type: 'script', name: 'Score lead' },
					{
						type: 'conditions',
						name: 'Route by score',
						branches: [
							[{ type: 'external_call', name: 'Assign to sales' }],
							[{ type: 'output', name: 'Nurture queue' }],
						],
					},
				],
			},
		],
	},
	{
		name: 'Contract Renewal Watch',
		contextMode: 'full',
		versions: [
			{
				createdHoursAgo: 1500,
				steps: [
					{ type: 'poller', name: 'Wait until 30 days left' },
					{ type: 'external_call', name: 'Notify account owner' },
				],
			},
		],
	},
];

export const workflowDefinitions: WorkflowDefinition[] = lineages.flatMap((lineage, lineageIndex) => {
	const lineageNo = lineageIndex + 1;
	const lineageId = uuid(lineageNo, 0, 0);

	return lineage.versions.map((version, versionIndex) => {
		const versionNo = versionIndex + 1;
		const createdAt = hoursAgo(version.createdHoursAgo);
		return {
			id: uuid(lineageNo, versionNo, 0),
			name: lineage.name,
			version: versionNo,
			previous_version_id: versionIndex === 0 ? null : uuid(lineageNo, versionNo - 1, 0),
			lineage_id: lineageId,
			content: buildContent(lineageNo, versionNo, version.steps, lineage.contextMode),
			created_by: users[lineageIndex % users.length],
			updated_by: users[(lineageIndex + versionIndex) % users.length],
			created_at: createdAt,
			updated_at: createdAt,
		};
	});
});

const sortableFields = ['name', 'version', 'created_at', 'updated_at'] as const;
type SortableField = (typeof sortableFields)[number];

export const listWorkflowDefinitions = async (query: WorkflowDefinitionQuery = {}): Promise<WorkflowDefinitionList> => {
	const { page = 1, perPage = 8, search, order, filter } = query;

	// Module facets live in `filter` so the shape matches what the real endpoint
	// receives once `Http.parseComplexQueryParam` serializes it.
	const latestOnly = filter?.latest_only ? filter.latest_only.value === 'true' : true;
	const startType = (filter?.start_type?.value as WorkflowDefinitionNodeType | undefined) ?? null;
	const complexity = (filter?.complexity?.value as WorkflowDefinitionComplexity | undefined) ?? null;

	await new Promise((resolve) => setTimeout(resolve, 350));

	const latestByLineage = new Map<string, number>();
	for (const definition of workflowDefinitions) {
		latestByLineage.set(
			definition.lineage_id,
			Math.max(latestByLineage.get(definition.lineage_id) ?? 0, definition.version),
		);
	}

	const term = search?.trim().toLowerCase();
	const filtered = workflowDefinitions.filter((definition) => {
		if (latestOnly && latestByLineage.get(definition.lineage_id) !== definition.version) return false;
		if (term && !definition.name.toLowerCase().includes(term)) return false;
		if (startType) {
			const start = definition.content.nodes.find((node) => node.id === definition.content.start_node_id);
			if (start?.type !== startType) return false;
		}
		if (complexity && getComplexity(definition.content) !== complexity) return false;
		return true;
	});

	const by: SortableField = sortableFields.includes(order?.by as SortableField)
		? (order?.by as SortableField)
		: 'updated_at';
	const direction = order?.direction === 'asc' ? 1 : -1;
	filtered.sort((a, b) => {
		const left = a[by];
		const right = b[by];
		const compared =
			typeof left === 'number' ? left - (right as number) : String(left).localeCompare(String(right));
		return compared * direction;
	});

	const total = filtered.length;
	const start = (page - 1) * perPage;

	return {
		items: filtered.slice(start, start + perPage),
		page,
		per_page: perPage,
		total,
		total_pages: Math.max(1, Math.ceil(total / perPage)),
	};
};
