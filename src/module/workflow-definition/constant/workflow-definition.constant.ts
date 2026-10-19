import type { WorkflowDefinitionSort } from '@module/workflow-definition/types/WorkflowDefinitionSort';

export const ROOT_SCOPE = 'root';

export const HANDLE_NEXT = 'next';

export const HANDLE_FAILURE = 'failure';

/** Hidden handles the derived start → join edge hangs off. Never connectable, never stored. */
export const HANDLE_PAIR = 'pair';

export const EDITOR_METADATA_KEY = 'editor';

/**
 * Node fields the canvas owns: they are drawn as edges, branches and scopes, so the generated form never shows them
 * and the canvas checks them itself.
 */
export const GRAPH_FIELDS: ReadonlySet<string> = new Set([
	'id',
	'type',
	'next_node',
	'on_failure',
	'conditions',
	'branches',
	'parallel_end_node_id',
	'start_node_id',
	'nodes',
	'keys',
]);

export const DEFAULT_COMBINING = `// branch["<name>"] is read-only: { context, status, branch_id, start_node_id }.
// Whatever context holds when this script ends REPLACES the parent context.
// Nothing is merged automatically: copy every value you want to keep.
for (const name of Object.keys(branch)) {
\tcontext[name] = branch[name].context;
}
`;

export const DEFINITION_ROUTE = '/app/workflow-definition';

export const sortOrders: Record<WorkflowDefinitionSort, { label: string; by: string; direction: 'asc' | 'desc' }> = {
	latest: { label: 'Latest', by: 'updated_at', direction: 'desc' },
	oldest: { label: 'Oldest', by: 'updated_at', direction: 'asc' },
	'name-asc': { label: 'Name A–Z', by: 'name', direction: 'asc' },
	'name-desc': { label: 'Name Z–A', by: 'name', direction: 'desc' },
	'version-desc': { label: 'Highest version', by: 'version', direction: 'desc' },
};

/** The engine's defaults: `max_branches_per_parallel` and `max_depth`. */
export const MIN_PARALLEL_BRANCHES = 2;

export const MAX_PARALLEL_BRANCHES = 32;

export const MAX_PARALLEL_DEPTH = 4;
