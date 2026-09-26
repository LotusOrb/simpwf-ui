import type { WorkflowDefinitionContent } from './WorkflowDefinitionContent';

export interface WorkflowDefinition {
	id: string;
	name: string;
	version: number;
	previous_version_id?: string | null;
	lineage_id: string;
	content: WorkflowDefinitionContent;
	/**
	 * JSON Schema per node type used by `content`, computed by the engine on read. It reflects the
	 * *current* engine, not the engine this version was authored against.
	 */
	schemas?: Record<string, unknown>;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
