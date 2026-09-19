import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';

export interface WorkflowDefinitionGraphLayoutNode {
	id: string;
	type: WorkflowDefinitionNodeType;
	column: number;
	row: number;
}
