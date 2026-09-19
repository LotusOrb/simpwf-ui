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
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
