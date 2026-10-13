export interface WorkflowRunMigratePayload {
	/** The source run. */
	id: string;
	/** A newer version of the source's lineage. */
	workflow_definition_id: string;
	/** Must not sit strictly inside a parallel region of the target graph. */
	start_node_id: string;
	/** Deep-merged over the carried source context; arrays are replaced. */
	context_patch?: Record<string, unknown>;
	start_paused: boolean;
	reason?: string;
}
