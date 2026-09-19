import type { WorkflowDefinitionContent } from './WorkflowDefinitionContent';

export interface WorkflowDefinition {
	id: string;
	name: string;
	version: number;
	previous_version_id?: string | null;
	lineage_id: string;
	content: WorkflowDefinitionContent;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
