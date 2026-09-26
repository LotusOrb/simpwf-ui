import type { WorkflowDefinitionInputChannel } from '@module/workflow-definition/types/WorkflowDefinitionInputChannel';
import type { WorkflowDefinitionInputForm } from '@module/workflow-definition/types/WorkflowDefinitionInputForm';

export interface WorkflowRunPendingInput {
	node_id: string;
	channel: WorkflowDefinitionInputChannel;
	output_property: string;
	form?: WorkflowDefinitionInputForm;
}
