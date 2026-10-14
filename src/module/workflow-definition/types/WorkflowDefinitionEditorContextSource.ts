/** Where the editor's script autocomplete gets `context` types from. Shared by every node inspector. */
export type WorkflowDefinitionEditorContextSource =
	| { mode: 'latest' }
	| { mode: 'run'; runId: string; debug: boolean }
	| { mode: 'off' };
