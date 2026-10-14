export interface WorkflowDefinitionEditorIssue {
	nodeId: string | null;
	scope: string | null;
	message: string;
	/** A warning is shown but doesn't block saving. */
	severity?: 'warning';
}
