import { isEqual, omit } from 'es-toolkit';

import type { CoreQueryError } from '@core/api';

import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunMigrateStep } from '@module/workflow-run/types/WorkflowRunMigrateStep';

import { flattenDefinitionNodes } from './workflow-run.detail';

// Parallel node types are not in the editor's node type list yet, so they are matched as plain strings.
const PARALLEL_START = 'parallel_start';
const PARALLEL_END = 'parallel_end';

const isType = (node: WorkflowDefinitionNode, type: string) => (node.type as string) === type;

export const isParallelStart = (node: WorkflowDefinitionNode) => isType(node, PARALLEL_START);

/** A group with its node tree inline; a bare library reference has none until the engine materializes it. */
const hasGroupBody = (node: WorkflowDefinitionNode) => node.type === 'group' && !!node.nodes;

/** A library-referencing parallel_start without inline branches is resolved only by the engine. */
const parallelUnresolved = (node: WorkflowDefinitionNode) =>
	!!node.node_definition_id &&
	((isType(node, PARALLEL_START) && !node.branches) || (isType(node, PARALLEL_END) && !node.combining_script));

/** A library-referencing node whose routing is hidden until materialization. */
const parallelOpaque = (node: WorkflowDefinitionNode) => {
	if (!node.node_definition_id) return false;
	if (node.type === 'conditions') return (node.conditions ?? []).length === 0;
	if (node.type === 'group') return (node.nodes ?? []).length === 0;
	if (isType(node, PARALLEL_START)) return !node.branches;
	return false;
};

interface Cursor {
	node: string;
	stack: string[];
}

/**
 * Ids of the nodes strictly inside a parallel region: everything reachable from a parallel_start's
 * branch targets without passing its join, minus the parallel_start/parallel_end boundaries. A port of
 * `model.ParallelInterior` in the engine, which rejects such a node as a migration start (422).
 * Walks the raw definition: a library reference the engine resolves later may route differently.
 */
export const parallelInterior = (content: WorkflowDefinitionContent): Set<string> => {
	const byId = new Map<string, WorkflowDefinitionNode>();
	const scopeOf = new Map<string, string>();
	const keysOf = new Map<string, Record<string, string | null> | undefined>();
	const baseOf = new Map<string, string[]>();

	const index = (
		nodes: WorkflowDefinitionNode[],
		scopeId: string,
		stack: string[],
		keys?: Record<string, string | null>,
	) => {
		keysOf.set(scopeId, keys);
		for (const node of nodes) {
			byId.set(node.id, node);
			scopeOf.set(node.id, scopeId);
			baseOf.set(node.id, stack);
			if (hasGroupBody(node)) index(node.nodes ?? [], node.id, [...stack, node.id], node.keys);
		}
	};
	index(content.nodes, '', [], content.keys);

	const starts: WorkflowDefinitionNode[] = [];
	const boundary = new Set<string>();
	const collect = (nodes: WorkflowDefinitionNode[]) => {
		for (const node of nodes) {
			if (isType(node, PARALLEL_START) && !parallelUnresolved(node)) {
				starts.push(node);
				boundary.add(node.id);
				if (node.parallel_end_node_id) boundary.add(node.parallel_end_node_id);
			} else if (isType(node, PARALLEL_END)) {
				boundary.add(node.id);
			}
			if (hasGroupBody(node)) collect(node.nodes ?? []);
		}
	};
	collect(content.nodes);

	const interior = new Set<string>();

	const collectBranch = (start: WorkflowDefinitionNode, target: string) => {
		const end = start.parallel_end_node_id;
		const base = baseOf.get(start.id) ?? [];
		const visited = new Set<string>();
		const work: Cursor[] = [{ node: target, stack: [...base] }];

		// Never pops below the start's own group stack: leaving it means the path left the region.
		const advance = (next: string | null | undefined, from: string[]) => {
			const stack = [...from];
			let target = next ?? '';
			while (!target && stack.length > base.length) {
				const group = byId.get(stack.pop()!);
				if (!group) return;
				target = group.next_node ?? '';
			}
			if (target) work.push({ node: target, stack });
		};

		while (work.length > 0) {
			const cursor = work.pop()!;
			if (cursor.node === end) continue;
			const key = [cursor.node, ...cursor.stack].join('\u0000');
			if (visited.has(key)) continue;
			visited.add(key);

			const node = byId.get(cursor.node);
			if (!node) continue;
			interior.add(node.id);
			if (parallelOpaque(node)) continue;

			if (isType(node, PARALLEL_START)) {
				// A nested region is skipped over to its own join.
				if (node.id === start.id) continue;
				if (node.parallel_end_node_id) work.push({ node: node.parallel_end_node_id, stack: [...cursor.stack] });
			} else if (node.type === 'conditions') {
				const keys = keysOf.get(scopeOf.get(node.id) ?? '') ?? {};
				for (const condition of node.conditions ?? []) {
					if (!condition.key) {
						advance('', cursor.stack);
						continue;
					}
					if (!(condition.key in keys)) continue;
					advance(keys[condition.key], cursor.stack);
				}
			} else if (node.type === 'group') {
				if (node.start_node_id) work.push({ node: node.start_node_id, stack: [...cursor.stack, node.id] });
			} else {
				advance(node.next_node, cursor.stack);
			}
			if (node.on_failure) advance(node.on_failure.next_node, cursor.stack);
		}
	};

	for (const start of starts) {
		for (const target of Object.values(start.branches ?? {})) collectBranch(start, target);
	}
	for (const id of boundary) interior.delete(id);
	return interior;
};

export interface WorkflowRunDefinitionDiff {
	added: WorkflowDefinitionNode[];
	removed: WorkflowDefinitionNode[];
	changed: WorkflowDefinitionNode[];
}

/**
 * Nodes added, removed or changed between two versions, matched by id. A group counts as changed
 * only for its own fields; its children are compared on their own.
 */
export const diffDefinitionNodes = (
	source: WorkflowDefinitionContent,
	target: WorkflowDefinitionContent,
): WorkflowRunDefinitionDiff => {
	const before = new Map(flattenDefinitionNodes(source.nodes).map((node) => [node.id, node]));
	const after = flattenDefinitionNodes(target.nodes);
	const afterIds = new Set(after.map((node) => node.id));

	return {
		added: after.filter((node) => !before.has(node.id)),
		removed: [...before.values()].filter((node) => !afterIds.has(node.id)),
		changed: after.filter((node) => {
			const previous = before.get(node.id);
			return !!previous && !isEqual(omit(previous, ['nodes']), omit(node, ['nodes']));
		}),
	};
};

/** The node a migration most likely resumes from: where the source stopped, parked or failed. */
export const migrateSourceNodeId = (detail: WorkflowRunDetail): string | null =>
	detail.current_node_id ??
	detail.pending_input?.node_id ??
	Object.entries(detail.nodes).find(([, occurrence]) => occurrence.status === 'failed')?.[0] ??
	null;

export interface WorkflowRunMigrateErrorCopy {
	step: WorkflowRunMigrateStep;
	title: string;
	detail: string | null;
}

// The engine's reasons come from instanceService.Migrate: 409 for the source state, 422 for the request.
const stepOf = (message: string): WorkflowRunMigrateStep => {
	if (/start node|start_node_id|parallel region/i.test(message)) return 'start';
	if (/context_patch/i.test(message)) return 'context';
	if (/lineage|newer than|workflow_definition_id|definition/i.test(message)) return 'version';
	return 'confirm';
};

export const describeMigrateError = (error: unknown): WorkflowRunMigrateErrorCopy => {
	const { code, explain, message } = (error && typeof error === 'object' ? error : {}) as Partial<CoreQueryError>;

	if (code === 409) {
		return { step: 'confirm', title: 'This run can no longer be migrated', detail: message ?? null };
	}
	if ((code === 422 || code === 400) && message) {
		return { step: stepOf(message), title: 'The engine rejected this migration', detail: message };
	}
	return {
		step: 'confirm',
		title: "Couldn't migrate this run",
		detail: message || explain || 'Something went wrong while migrating',
	};
};
