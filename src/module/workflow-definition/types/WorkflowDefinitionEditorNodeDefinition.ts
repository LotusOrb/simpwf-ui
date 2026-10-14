/** Editor document of a node definition: its one node is edited as a graph of its own. */
export interface WorkflowDefinitionEditorNodeDefinition {
	/** The definition's node in the document. Never deleted; a group definition's canvas opens inside it. */
	rootId: string;
	/** The definition's type: a builtin, or a custom type registered with the engine. */
	type: string;
	/** The node's own `name` in the stored content, if any. The root node shows the definition name instead. */
	contentName?: string;
	/** JSON Schema of the node object for this type, from the engine; null when the running engine doesn't know it. */
	schema: Record<string, unknown> | null;
	/** parallel_start: the join id the definition carries, which no node in it has. Written back as loaded. */
	parallelEndNodeId?: string;
}
