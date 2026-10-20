export interface FormUsageNode {
	node_id: string;
	node_name: string;
	/** The node definition that carries the form, or `""` when the node sets `form_id` inline. */
	node_definition_id: string;
}
