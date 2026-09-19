import type { WorkflowDefinition } from './WorkflowDefinition';

export type WorkflowDefinitionCreatePayload = Pick<WorkflowDefinition, 'name' | 'content'> & {
	previous_version_id?: string;
};
