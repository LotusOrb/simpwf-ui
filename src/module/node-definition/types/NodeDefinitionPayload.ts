export interface NodeDefinitionPayload {
	name: string;
	/** A builtin node type or a custom type registered with the engine. */
	type: string;
	/** Set to publish the next version of that definition's lineage. */
	previous_version_id?: string;
	content: Record<string, unknown>;
}
