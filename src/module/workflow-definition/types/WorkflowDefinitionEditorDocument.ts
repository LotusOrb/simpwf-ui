import type { WorkflowDefinitionContent } from './WorkflowDefinitionContent';
import type { WorkflowDefinitionEditorEdge } from './WorkflowDefinitionEditorEdge';
import type { WorkflowDefinitionEditorNode } from './WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionEditorNodeDefinition } from './WorkflowDefinitionEditorNodeDefinition';
import type { WorkflowDefinitionEditorStart } from './WorkflowDefinitionEditorStart';

export interface WorkflowDefinitionEditorDocument {
	sourceId: string | null;
	sourceVersion: number | null;
	name: string;
	contextMode: WorkflowDefinitionContent['context_mode'] | null;
	statusUpdate: WorkflowDefinitionContent['status_update'] | null;
	nodes: Record<string, WorkflowDefinitionEditorNode>;
	starts: Record<string, WorkflowDefinitionEditorStart>;
	edges: WorkflowDefinitionEditorEdge[];
	/** Set when the document is a node definition rather than a workflow. */
	nodeDefinition: WorkflowDefinitionEditorNodeDefinition | null;
}
