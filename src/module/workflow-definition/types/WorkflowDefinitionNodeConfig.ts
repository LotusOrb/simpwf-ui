import type { WorkflowDefinitionNode } from './WorkflowDefinitionNode';

export type WorkflowDefinitionNodeConfig = Omit<
	WorkflowDefinitionNode,
	'id' | 'next_node' | 'on_failure' | 'conditions' | 'nodes' | 'start_node_id' | 'branches' | 'parallel_end_node_id'
>;
