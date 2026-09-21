import type { Node } from '@xyflow/react';

import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeOccurrence } from '@module/workflow-run/types/WorkflowRunNodeOccurrence';

export interface WorkflowRunGraphNodeData extends Record<string, unknown> {
	node: WorkflowDefinitionNode;
	occurrence: WorkflowRunNodeOccurrence | null;
	debug: WorkflowRunNodeDebug | null;
	current: boolean;
}

export interface WorkflowRunGraphGroupData extends Record<string, unknown> {
	name: string;
	reached: boolean;
}

export type WorkflowRunStepFlowNode = Node<WorkflowRunGraphNodeData, 'run'>;
export type WorkflowRunGroupFlowNode = Node<WorkflowRunGraphGroupData, 'runGroup'>;
export type WorkflowRunGraphFlowNode = WorkflowRunStepFlowNode | WorkflowRunGroupFlowNode;
