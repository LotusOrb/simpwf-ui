export interface WorkflowRunDebugContext {
	instance_id: string;
	/** Resolved graph node id; empty when the debug cursor is empty. */
	node_id: string;
	occurrence_id: string | null;
	attempt: number | null;
	/** True while a debug run sits paused between two steps. */
	is_debug_paused: boolean;
	/** A `declare const context …` declaration (types only, secrets redacted) for Monaco. */
	typescript: string;
}
