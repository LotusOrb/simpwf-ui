/** A form's render contract as frozen into a run started with `snapshot_forms`. */
export interface WorkflowRunPendingInputForm {
	schema: Record<string, unknown>;
	ui?: Record<string, unknown> | null;
}
