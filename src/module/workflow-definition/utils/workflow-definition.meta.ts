import { sortNodeTypes } from '@module/node-type/utils';
import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionGraphLayout } from '@module/workflow-definition/types/WorkflowDefinitionGraphLayout';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

/**
 * Card subtitle under a node's name: an inline delay node shows its duration instead of the type label. A library
 * delay keeps the label, since its duration lives in the definition.
 */
export const nodeSubtitle = (
	node: Pick<WorkflowDefinitionNode, 'type' | 'delay' | 'node_definition_id'>,
	label: string,
) => (node.type === 'delay' && !node.node_definition_id ? `${label} · ${node.delay || 'not set'}` : label);

/** The start delay a card shows. Null (disabled) and omitted (inherited from the library) show nothing. */
export const shownStartDelay = (node: Pick<WorkflowDefinitionNode, 'start_delay'>) =>
	typeof node.start_delay === 'string' && node.start_delay ? node.start_delay : null;

const flattenNodes = (nodes: WorkflowDefinitionNode[]): WorkflowDefinitionNode[] =>
	nodes.flatMap((node) => [node, ...(node.nodes ? flattenNodes(node.nodes) : [])]);

export const countNodes = (content: WorkflowDefinitionContent) => flattenNodes(content.nodes).length;

export const getNodeTypes = (content: WorkflowDefinitionContent): WorkflowDefinitionNodeType[] =>
	sortNodeTypes(new Set(flattenNodes(content.nodes).map((node) => node.type)));

export const getStartNode = (content: WorkflowDefinitionContent) =>
	content.nodes.find((node) => node.id === content.start_node_id);

const getTargets = (node: WorkflowDefinitionNode, content: WorkflowDefinitionContent): string[] => {
	const targets = [node.next_node, node.on_failure?.next_node];
	for (const condition of node.conditions ?? []) {
		if (condition.key) targets.push(content.keys?.[condition.key]);
	}
	targets.push(...Object.values(node.branches ?? {}));
	return targets.filter((target): target is string => !!target);
};

export const layoutGraph = (content: WorkflowDefinitionContent): WorkflowDefinitionGraphLayout => {
	const byId = new Map(content.nodes.map((node) => [node.id, node]));
	const depth = new Map<string, number>();
	const edges: WorkflowDefinitionGraphLayout['edges'] = [];

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
