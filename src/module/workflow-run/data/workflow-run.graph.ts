import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';

import { flattenDefinitionNodes } from './workflow-run.detail';

export type WorkflowRunGraphEdgeKind = 'next' | 'branch' | 'failure';

export interface WorkflowRunGraphEdge {
	id: string;
	source: string;
	target: string;
	kind: WorkflowRunGraphEdgeKind;
	label?: string;
}

export interface WorkflowRunGraphNode {
	node: WorkflowDefinitionNode;
	parentId: string | null;
	column: number;
	row: number;
	x: number;
	y: number;
}

export interface WorkflowRunGraphGroup {
	node: WorkflowDefinitionNode;
	x: number;
	y: number;
	width: number;
	height: number;
}

export interface WorkflowRunGraph {
	nodes: WorkflowRunGraphNode[];
	groups: WorkflowRunGraphGroup[];
	edges: WorkflowRunGraphEdge[];
	width: number;
	height: number;
}

export const GRAPH_NODE_WIDTH = 216;
export const GRAPH_NODE_HEIGHT = 96;
const COLUMN_GAP = 76;
const ROW_GAP = 40;
const GROUP_PADDING = 26;
const GROUP_HEADER = 22;

/**
 * Flattens the definition into a layered graph the run canvas can draw. Group containers are
 * not nodes in the flow: edges pointing at a group are redirected to the group's start node,
 * and the container is drawn afterwards as a box around its children.
 */
export const buildRunGraph = (content: WorkflowDefinitionContent): WorkflowRunGraph => {
	const all = flattenDefinitionNodes(content.nodes);
	const byId = new Map(all.map((node) => [node.id, node]));

	const parentOf = new Map<string, string>();
	for (const node of all) {
		for (const child of node.nodes ?? []) parentOf.set(child.id, node.id);
	}

	/** Groups are never a destination: entering one means entering its start node. */
	const resolve = (id: string | null | undefined): string | null => {
		let current = id ? byId.get(id) : undefined;
		while (current?.type === 'group' && current.start_node_id) current = byId.get(current.start_node_id);
		return current?.id ?? null;
	};

	/** The node that follows `node` once its own chain is exhausted. */
	const fallThrough = (node: WorkflowDefinitionNode): string | null => {
		let parentId = parentOf.get(node.id);
		while (parentId) {
			const parent = byId.get(parentId);
			if (parent?.next_node) return resolve(parent.next_node);
			parentId = parentOf.get(parentId);
		}
		return null;
	};

	const steps = all.filter((node) => node.type !== 'group');
	const edges: WorkflowRunGraphEdge[] = [];

	for (const node of steps) {
		const next = node.next_node ? resolve(node.next_node) : fallThrough(node);
		if (node.type === 'conditions') {
			for (const [index, condition] of (node.conditions ?? []).entries()) {
				const target = condition.key ? resolve(content.keys?.[condition.key]) : null;
				if (target) {
					edges.push({
						id: `${node.id}->${target}:branch${index}`,
						source: node.id,
						target,
						kind: 'branch',
						label: condition.key,
					});
				}
			}
		} else if (next) {
			edges.push({ id: `${node.id}->${next}`, source: node.id, target: next, kind: 'next' });
		}

		const failure = resolve(node.on_failure?.next_node);
		if (failure) {
			edges.push({
				id: `${node.id}->${failure}:failure`,
				source: node.id,
				target: failure,
				kind: 'failure',
				label: 'on failure',
			});
		}
	}

	const outgoing = new Map<string, string[]>();
	for (const edge of edges) outgoing.set(edge.source, [...(outgoing.get(edge.source) ?? []), edge.target]);

	const column = new Map<string, number>();
	const visit = (id: string, level: number, trail: Set<string>) => {
		if (trail.has(id) || (column.get(id) ?? -1) >= level) return;
		column.set(id, level);
		const nextTrail = new Set(trail).add(id);
		for (const target of outgoing.get(id) ?? []) visit(target, level + 1, nextTrail);
	};
	const startId = resolve(content.start_node_id);
	if (startId) visit(startId, 0, new Set());

	// Anything unreachable (a dangling failure handler, say) is parked in its own column.
	let orphanColumn = Math.max(-1, ...column.values()) + 1;
	for (const node of steps) {
		if (!column.has(node.id)) column.set(node.id, orphanColumn);
	}

	const rowsPerColumn = new Map<number, number>();
	const nodes: WorkflowRunGraphNode[] = steps
		.slice()
		.sort((a, b) => column.get(a.id)! - column.get(b.id)!)
		.map((node) => {
			const col = column.get(node.id)!;
			const row = rowsPerColumn.get(col) ?? 0;
			rowsPerColumn.set(col, row + 1);
			return {
				node,
				parentId: parentOf.get(node.id) ?? null,
				column: col,
				row,
				x: col * (GRAPH_NODE_WIDTH + COLUMN_GAP),
				y: row * (GRAPH_NODE_HEIGHT + ROW_GAP),
			};
		});

	const positionOf = new Map(nodes.map((item) => [item.node.id, item]));

	const groups: WorkflowRunGraphGroup[] = all
		.filter((node) => node.type === 'group')
		.map((node) => {
			const children = flattenDefinitionNodes(node.nodes ?? [])
				.map((child) => positionOf.get(child.id))
				.filter((child): child is WorkflowRunGraphNode => !!child);

			if (children.length === 0) return null;
			const minX = Math.min(...children.map((child) => child.x));
			const minY = Math.min(...children.map((child) => child.y));
			const maxX = Math.max(...children.map((child) => child.x)) + GRAPH_NODE_WIDTH;
			const maxY = Math.max(...children.map((child) => child.y)) + GRAPH_NODE_HEIGHT;

			return {
				node,
				x: minX - GROUP_PADDING,
				y: minY - GROUP_PADDING - GROUP_HEADER,
				width: maxX - minX + GROUP_PADDING * 2,
				height: maxY - minY + GROUP_PADDING * 2 + GROUP_HEADER,
			};
		})
		.filter((group): group is WorkflowRunGraphGroup => !!group);

	const columns = rowsPerColumn.size;
	const rows = Math.max(1, ...rowsPerColumn.values());

	return {
		nodes,
		groups,
		edges,
		width: columns * GRAPH_NODE_WIDTH + Math.max(0, columns - 1) * COLUMN_GAP,
		height: rows * GRAPH_NODE_HEIGHT + Math.max(0, rows - 1) * ROW_GAP,
	};
};
