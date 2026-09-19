import type { WorkflowDefinitionGraphLayoutNode } from './WorkflowDefinitionGraphLayoutNode';

export interface WorkflowDefinitionGraphLayout {
	nodes: WorkflowDefinitionGraphLayoutNode[];
	edges: { from: string; to: string }[];
	columns: number;
	rows: number;
}
