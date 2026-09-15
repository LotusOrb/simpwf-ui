import type { IconType } from 'react-icons';
import { LuBoxes, LuCode, LuGlobe, LuLogIn, LuRadar, LuSend, LuSplit } from 'react-icons/lu';

import type { WorkflowContent, WorkflowNode, WorkflowNodeType } from './workflow-definition.mock';

export const nodeTypeMeta: Record<WorkflowNodeType, { label: string; color: string; icon: IconType }> = {
	input: { label: 'Input', color: 'teal', icon: LuLogIn },
	script: { label: 'Script', color: 'blue', icon: LuCode },
	conditions: { label: 'Conditions', color: 'orange', icon: LuSplit },
	external_call: { label: 'External call', color: 'pink', icon: LuGlobe },
	poller: { label: 'Poller', color: 'cyan', icon: LuRadar },
	group: { label: 'Group', color: 'violet', icon: LuBoxes },
	output: { label: 'Output', color: 'grape', icon: LuSend },
};

export const nodeTypeOrder = Object.keys(nodeTypeMeta) as WorkflowNodeType[];

export type WorkflowComplexity = 'simple' | 'standard' | 'complex';

export const complexityMeta: Record<WorkflowComplexity, { label: string; color: string }> = {
	simple: { label: 'Simple', color: 'teal' },
	standard: { label: 'Standard', color: 'gray' },
	complex: { label: 'Complex', color: 'pink' },
};

const flattenNodes = (nodes: WorkflowNode[]): WorkflowNode[] =>
	nodes.flatMap((node) => [node, ...(node.nodes ? flattenNodes(node.nodes) : [])]);

export const countNodes = (content: WorkflowContent) => flattenNodes(content.nodes).length;

export const getNodeTypes = (content: WorkflowContent): WorkflowNodeType[] => {
	const present = new Set(flattenNodes(content.nodes).map((node) => node.type));
	return nodeTypeOrder.filter((type) => present.has(type));
};

export const getStartNode = (content: WorkflowContent) =>
	content.nodes.find((node) => node.id === content.start_node_id);

export const getComplexity = (content: WorkflowContent): WorkflowComplexity => {
	const nodes = flattenNodes(content.nodes);
	const branches = nodes.reduce((sum, node) => sum + Math.max(0, (node.conditions?.length ?? 0) - 1), 0);
	const score = nodes.length + branches * 2;
	if (score <= 4) return 'simple';
	if (score <= 9) return 'standard';
	return 'complex';
};

const getTargets = (node: WorkflowNode, content: WorkflowContent): string[] => {
	const targets = [node.next_node, node.on_failure];
	for (const condition of node.conditions ?? []) {
		if (condition.key) targets.push(content.keys?.[condition.key]);
	}
	return targets.filter((target): target is string => !!target);
};

export interface GraphLayoutNode {
	id: string;
	type: WorkflowNodeType;
	column: number;
	row: number;
}

export interface GraphLayout {
	nodes: GraphLayoutNode[];
	edges: { from: string; to: string }[];
	columns: number;
	rows: number;
}

export const layoutGraph = (content: WorkflowContent): GraphLayout => {
	const byId = new Map(content.nodes.map((node) => [node.id, node]));
	const depth = new Map<string, number>();
	const edges: GraphLayout['edges'] = [];

	const visit = (id: string, level: number, trail: Set<string>) => {
		const node = byId.get(id);
		if (!node || trail.has(id) || (depth.get(id) ?? -1) >= level) return;
		depth.set(id, level);
		const nextTrail = new Set(trail).add(id);
		for (const target of getTargets(node, content)) visit(target, level + 1, nextTrail);
	};
	visit(content.start_node_id, 0, new Set());

	for (const node of content.nodes) {
		if (!depth.has(node.id)) continue;
		for (const target of getTargets(node, content)) {
			if (depth.has(target)) edges.push({ from: node.id, to: target });
		}
	}

	const rowsPerColumn: number[] = [];
	const nodes = content.nodes
		.filter((node) => depth.has(node.id))
		.sort((a, b) => depth.get(a.id)! - depth.get(b.id)!)
		.map((node) => {
			const column = depth.get(node.id)!;
			const row = rowsPerColumn[column] ?? 0;
			rowsPerColumn[column] = row + 1;
			return { id: node.id, type: node.type, column, row };
		});

	return {
		nodes,
		edges,
		columns: rowsPerColumn.length,
		rows: Math.max(1, ...rowsPerColumn),
	};
};

export type WorkflowDefinitionSort = 'latest' | 'oldest' | 'name-asc' | 'name-desc' | 'version-desc';

export const sortOrders: Record<WorkflowDefinitionSort, { label: string; by: string; direction: 'asc' | 'desc' }> = {
	latest: { label: 'Latest', by: 'updated_at', direction: 'desc' },
	oldest: { label: 'Oldest', by: 'updated_at', direction: 'asc' },
	'name-asc': { label: 'Name A–Z', by: 'name', direction: 'asc' },
	'name-desc': { label: 'Name Z–A', by: 'name', direction: 'desc' },
	'version-desc': { label: 'Highest version', by: 'version', direction: 'desc' },
};

export interface WorkflowDefinitionFilterValues {
	sort: WorkflowDefinitionSort;
	startType: WorkflowNodeType | null;
	complexity: WorkflowComplexity | null;
}
