import type { WorkflowDefinitionNodeCondition } from './WorkflowDefinitionNodeCondition';
import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';

export interface WorkflowDefinitionNode {
	id: string;
	type: WorkflowDefinitionNodeType;
	name: string;
	next_node?: string | null;
	on_failure?: string | null;
	conditions?: WorkflowDefinitionNodeCondition[];
	start_node_id?: string;
	keys?: Record<string, string | null>;
	nodes?: WorkflowDefinitionNode[];
}
