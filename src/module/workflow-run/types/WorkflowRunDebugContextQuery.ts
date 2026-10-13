export interface WorkflowRunDebugContextQuery {
	id: string;
	/** Graph node id or occurrence id; omitted selects the debug cursor. */
	nodeId?: string;
	/** Exact execution; omitted selects the latest. */
	attempt?: number;
}
