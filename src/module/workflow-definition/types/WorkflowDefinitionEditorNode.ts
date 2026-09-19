import type { WorkflowDefinitionEditorBranch } from './WorkflowDefinitionEditorBranch';
import type { WorkflowDefinitionEditorPosition } from './WorkflowDefinitionEditorPosition';
import type { WorkflowDefinitionEditorReference } from './WorkflowDefinitionEditorReference';
import type { WorkflowDefinitionJsonField } from './WorkflowDefinitionJsonField';
import type { WorkflowDefinitionNodeConfig } from './WorkflowDefinitionNodeConfig';

export interface WorkflowDefinitionEditorNode {
	id: string;
	parentId: string | null;
	position: WorkflowDefinitionEditorPosition;
	measured?: { width?: number; height?: number };
	config: WorkflowDefinitionNodeConfig;
	branches: WorkflowDefinitionEditorBranch[];
	failureOutputProperty: string;
	jsonDrafts: Partial<Record<WorkflowDefinitionJsonField, string>>;
	reference?: WorkflowDefinitionEditorReference;
}
