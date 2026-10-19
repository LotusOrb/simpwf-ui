import type { FormUsageNode } from './FormUsageNode';

export interface FormUsageWorkflowDefinition {
	id: string;
	name: string;
	version: number;
	lineage_id: string;
	/** The nodes of this definition that reference the form. */
	nodes: FormUsageNode[];
}
