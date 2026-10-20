export interface FormUsageInstance {
	id: string;
	workflow_definition_id: string;
	status: string;
	/** Parked on an input node that uses the form. */
	is_waiting_on_form: boolean;
	current_node_id: string | null;
}
