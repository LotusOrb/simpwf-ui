import type { WorkflowDefinitionEditorPosition } from './WorkflowDefinitionEditorPosition';

export interface WorkflowDefinitionEditorStart {
	position: WorkflowDefinitionEditorPosition;
	measured?: { width?: number; height?: number };
}
