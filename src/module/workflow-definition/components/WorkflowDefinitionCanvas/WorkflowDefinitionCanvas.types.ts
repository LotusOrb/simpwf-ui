import type { Node } from '@xyflow/react';

import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';

export type WorkflowDefinitionStepNodeData = {
	node: WorkflowDefinitionEditorNode;
	issueCount: number;
	branchTargets: Record<string, boolean>;
	/** parallel_end: the start it closes, when the pair is intact. */
	pairedStart?: { name: string; branchCount: number };
	/** The other half of this parallel block is selected. */
	pairedSelected: boolean;
	/** A node definition's own node: alone on the canvas, so it has nothing to connect. */
	standalone?: boolean;
};

export type WorkflowDefinitionStepFlowNode = Node<WorkflowDefinitionStepNodeData, 'step'>;

export type WorkflowDefinitionStartFlowNode = Node<{ connected: boolean }, 'start'>;

export type WorkflowDefinitionFlowNode = WorkflowDefinitionStepFlowNode | WorkflowDefinitionStartFlowNode;
