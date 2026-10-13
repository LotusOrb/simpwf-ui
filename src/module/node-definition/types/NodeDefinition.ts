import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

export interface NodeDefinition {
	id: string;
	name: string;
	version: number;
	previous_version_id?: string | null;
	lineage_id: string;
	type: WorkflowDefinitionNodeType;
	content: Omit<WorkflowDefinitionNode, 'id'>;
	/**
	 * JSON Schema (draft 2020-12) of the node object for this type, attached by the engine on read; null when the
	 * type is unknown to the running build. It reflects the current engine, not the one the version was authored on.
	 */
	schema?: Record<string, unknown> | null;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
