import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';

/** The engine's defaults: `max_branches_per_parallel` and `max_depth`. */
export const MIN_PARALLEL_BRANCHES = 2;
export const MAX_PARALLEL_BRANCHES = 32;
export const MAX_PARALLEL_DEPTH = 4;

export const isParallelStart = (node: WorkflowDefinitionNode) => node.type === 'parallel_start';
export const isParallelEnd = (node: WorkflowDefinitionNode) => node.type === 'parallel_end';

/** A group with its node tree inline; a bare library reference has none until the engine materializes it. */
const hasGroupBody = (node: WorkflowDefinitionNode) => node.type === 'group' && !!node.nodes;

/** A library-referencing parallel node without inline fields is resolved only by the engine. */
export const parallelUnresolved = (node: WorkflowDefinitionNode) =>
	!!node.node_definition_id &&
	((isParallelStart(node) && !node.branches) || (isParallelEnd(node) && !node.combining_script));

/** A library-referencing node whose routing is hidden until materialization. */
const parallelOpaque = (node: WorkflowDefinitionNode) => {
	if (!node.node_definition_id) return false;
	if (node.type === 'conditions') return (node.conditions ?? []).length === 0;
	if (node.type === 'group') return (node.nodes ?? []).length === 0;
	if (isParallelStart(node)) return !node.branches;
	return false;
};

export type ParallelProblemKind =
	/** A path ends at `nodeId` without reaching the join. */
	| 'dead_end'
	/** A path runs off the end of the start's own group, i.e. out of the parallel's scope. */
	| 'escape'
	/** A path reaches an id that is not in the workflow. */
	| 'unknown_node'
	/** A path comes back to its own parallel_start. */
	| 'self_loop'
	/** A conditions node routes through a key its scope does not define. */
	| 'missing_key'
	/** The branch never reaches its join at all. */
	| 'no_path'
	/** The parallel_start nests deeper than the engine allows. */
	| 'too_deep'
	/** The parallel_start is reachable from its own branches through other blocks. */
	| 'nested_cycle';

export interface ParallelProblem {
	kind: ParallelProblemKind;
	/** Where the problem shows: the node the path stopped at, or the parallel_start itself. */
	nodeId: string;
	startId: string;
	branch: string | null;
	/** The unknown id for `unknown_node`, the key for `missing_key`, the depth for `too_deep`. */
	detail?: string;
}

export interface ParallelBranchWalk {
	startId: string;
	endId: string;
	branch: string;
	target: string;
	/** Every known node the branch's paths pass through before the join, nested blocks' boundaries included. */
	visited: Set<string>;
	reached: boolean;
}

export interface ParallelAnalysis {
	/** Resolved parallel_starts, in tree order. */
	starts: WorkflowDefinitionNode[];
	/** One walk per branch, branches in name order like the engine's branch index. */
	walks: ParallelBranchWalk[];
	/** Structural nesting per start id; 1 is top level. Missing for starts caught in a nesting cycle. */
	depth: Map<string, number>;
	problems: ParallelProblem[];
}

interface Cursor {
	node: string;
	stack: string[];
}

/**
 * A port of the engine's parallel convergence walk (`model.validateParallelConvergence`). It walks
 * every branch of every resolved parallel_start with an abstract cursor that carries the group stack,
 * so a path may enter a group and fall back out of it, but never pops below the start's own groups.
 * Unlike the engine it never stops at the first problem: it records each one and keeps walking, which
 * also makes it the engine's `ParallelInterior` walk.
 */
export const analyzeParallel = (content: WorkflowDefinitionContent): ParallelAnalysis => {
	const byId = new Map<string, WorkflowDefinitionNode>();
	const scopeOf = new Map<string, string>();
	const keysOf = new Map<string, Record<string, string | null> | undefined>();
	const baseOf = new Map<string, string[]>();
	const starts: WorkflowDefinitionNode[] = [];

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
			if (isParallelStart(node) && !parallelUnresolved(node)) starts.push(node);
			if (hasGroupBody(node)) index(node.nodes ?? [], node.id, [...stack, node.id], node.keys);
		}
	};
	index(content.nodes, '', [], content.keys);

	const walks: ParallelBranchWalk[] = [];
	const problems: ParallelProblem[] = [];
	const parents = new Map<string, Set<string>>();

	const walkBranch = (start: WorkflowDefinitionNode, branch: string, target: string) => {
		const end = start.parallel_end_node_id ?? '';
		const base = baseOf.get(start.id) ?? [];
		const walk: ParallelBranchWalk = {
			startId: start.id,
			endId: end,
			branch,
			target,
			visited: new Set(),
			reached: false,
		};
		const problem = (kind: ParallelProblemKind, nodeId: string, detail?: string) =>
			problems.push({ kind, nodeId, startId: start.id, branch, detail });
		const seen = new Set<string>();
		const work: Cursor[] = [{ node: target, stack: [...base] }];

		const advance = (from: string, next: string | null | undefined, cursorStack: string[]) => {
			const stack = [...cursorStack];
			let target = next ?? '';
			while (!target && stack.length > base.length) {
				const group = byId.get(stack.pop()!);
				if (!group) return;
				target = group.next_node ?? '';
			}
			if (target) work.push({ node: target, stack });
			else problem(base.length > 0 ? 'escape' : 'dead_end', from);
		};

		while (work.length > 0) {
			const cursor = work.pop()!;
			if (cursor.node === end) {
				walk.reached = true;
				continue;
			}
			const key = [cursor.node, ...cursor.stack].join('\u0000');
			if (seen.has(key)) continue;
			seen.add(key);

			const node = byId.get(cursor.node);
			if (!node) {
				problem('unknown_node', start.id, cursor.node);
				continue;
			}
			walk.visited.add(node.id);
			if (parallelOpaque(node)) continue;

			if (isParallelStart(node)) {
				if (node.id === start.id) {
					problem('self_loop', start.id);
					continue;
				}
				// A nested block is skipped over to its own join.
				parents.set(node.id, (parents.get(node.id) ?? new Set()).add(start.id));
				if (node.parallel_end_node_id) work.push({ node: node.parallel_end_node_id, stack: [...cursor.stack] });
			} else if (node.type === 'conditions') {
				const keys = keysOf.get(scopeOf.get(node.id) ?? '') ?? {};
				for (const condition of node.conditions ?? []) {
					if (!condition.key) {
						advance(node.id, '', cursor.stack);
						continue;
					}
					if (!(condition.key in keys)) {
						problem('missing_key', node.id, condition.key);
						continue;
					}
					advance(node.id, keys[condition.key], cursor.stack);
				}
			} else if (node.type === 'group') {
				if (node.start_node_id) work.push({ node: node.start_node_id, stack: [...cursor.stack, node.id] });
			} else {
				advance(node.id, node.next_node, cursor.stack);
			}
			if (node.on_failure) advance(node.id, node.on_failure.next_node, cursor.stack);
		}

		if (!walk.reached) problem('no_path', start.id);
		walks.push(walk);
	};

	for (const start of starts) {
		const names = Object.keys(start.branches ?? {}).sort();
		for (const name of names) walkBranch(start, name, start.branches![name]);
	}

	const depth = new Map<string, number>();
	const visiting = new Set<string>();
	const cyclic = new Set<string>();
	const compute = (id: string): number | null => {
		if (depth.has(id)) return depth.get(id)!;
		if (visiting.has(id) || cyclic.has(id)) {
			cyclic.add(id);
			return null;
		}
		visiting.add(id);
		let value: number | null = 1;
		for (const parent of parents.get(id) ?? []) {
			const parentDepth = compute(parent);
			if (parentDepth === null) {
				value = null;
				break;
			}
			value = Math.max(value, parentDepth + 1);
		}
		visiting.delete(id);
		if (value === null) cyclic.add(id);
		else depth.set(id, value);
		return value;
	};
	for (const start of starts) {
		const value = compute(start.id);
		if (value === null) {
			problems.push({ kind: 'nested_cycle', nodeId: start.id, startId: start.id, branch: null });
		} else if (value > MAX_PARALLEL_DEPTH) {
			problems.push({
				kind: 'too_deep',
				nodeId: start.id,
				startId: start.id,
				branch: null,
				detail: String(value),
			});
		}
	}

	return { starts, walks, depth, problems };
};

/**
 * Ids of the nodes strictly inside a parallel region: everything reachable from a parallel_start's
 * branch targets without passing its join, minus every parallel_start/parallel_end boundary. A port of
 * `model.ParallelInterior` in the engine, which rejects such a node as a migration start (422).
 * Walks the raw definition: a library reference the engine resolves later may route differently.
 */
export const parallelInterior = (content: WorkflowDefinitionContent, analysis = analyzeParallel(content)) => {
	const interior = new Set<string>();
	for (const walk of analysis.walks) for (const id of walk.visited) interior.add(id);

	const boundary = (nodes: WorkflowDefinitionNode[]) => {
		for (const node of nodes) {
			if (isParallelStart(node) && !parallelUnresolved(node)) {
				interior.delete(node.id);
				if (node.parallel_end_node_id) interior.delete(node.parallel_end_node_id);
			} else if (isParallelEnd(node)) {
				interior.delete(node.id);
			}
			if (hasGroupBody(node)) boundary(node.nodes ?? []);
		}
	};
	boundary(content.nodes);
	return interior;
};

export interface ParallelMembership {
	startId: string;
	branch: string;
}

/**
 * The branch each node structurally belongs to, for nodes that exactly one branch can reach.
 * Nested blocks' nodes belong to their innermost branch; the boundaries of a nested block belong
 * to the enclosing branch. Nodes reachable from several branches are left out on purpose.
 */
export const parallelMembership = (content: WorkflowDefinitionContent, analysis = analyzeParallel(content)) => {
	const owners = new Map<string, ParallelMembership[]>();
	for (const walk of analysis.walks) {
		for (const id of walk.visited) {
			owners.set(id, [...(owners.get(id) ?? []), { startId: walk.startId, branch: walk.branch }]);
		}
	}
	const membership = new Map<string, ParallelMembership>();
	for (const [id, list] of owners) if (list.length === 1) membership.set(id, list[0]);
	return membership;
};
