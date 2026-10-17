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
	/** JSON text by field path, kept while it is being typed (and may not parse yet). */
	jsonDrafts: Record<WorkflowDefinitionJsonField, string>;
	reference?: WorkflowDefinitionEditorReference;
	/** parallel_start and parallel_end: the other half of the block. Set on both nodes. */
	pairId?: string;
}
