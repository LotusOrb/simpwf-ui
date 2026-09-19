import type { Node } from '@xyflow/react';

import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';

export type WorkflowDefinitionStepNodeData = {
	node: WorkflowDefinitionEditorNode;
	issueCount: number;
	childCount: number;
	branchTargets: Record<string, boolean>;
};

export type WorkflowDefinitionStepFlowNode = Node<WorkflowDefinitionStepNodeData, 'step'>;

export type WorkflowDefinitionStartFlowNode = Node<{ connected: boolean }, 'start'>;

export type WorkflowDefinitionFlowNode = WorkflowDefinitionStepFlowNode | WorkflowDefinitionStartFlowNode;
