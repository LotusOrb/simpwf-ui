import { isEqual, omit } from 'es-toolkit';

import type { CoreQueryError } from '@core/api';

import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunMigrateStep } from '@module/workflow-run/types/WorkflowRunMigrateStep';

import { flattenDefinitionNodes } from './workflow-run.detail';

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
