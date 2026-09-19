import type { WorkflowDefinitionNode } from './WorkflowDefinitionNode';

export interface WorkflowDefinitionContent {
	start_node_id: string;
	context_mode?: 'full' | 'lean';
	keys?: Record<string, string | null>;
	nodes: WorkflowDefinitionNode[];
	status_update?: Record<string, unknown>;
}
