export interface WorkflowDefinitionEditorIssue {
	nodeId: string | null;
	scope: string | null;
	message: string;
	/** Dotted path of the node field the issue is about, when it is about one. */
	path?: string;
	/** A warning is shown but doesn't block saving. */
	severity?: 'warning';
}
