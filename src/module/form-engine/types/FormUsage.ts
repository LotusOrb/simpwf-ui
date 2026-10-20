import type { FormUsageInstance } from './FormUsageInstance';
import type { FormUsageNodeDefinition } from './FormUsageNodeDefinition';
import type { FormUsageWorkflowDefinition } from './FormUsageWorkflowDefinition';

/** Everything that references a form. Empty lists come back as `[]`. */
export interface FormUsage {
	form_id: string;
	workflow_definitions: FormUsageWorkflowDefinition[];
	node_definitions: FormUsageNodeDefinition[];
	workflow_instances: FormUsageInstance[];
	instance_total: number;
	page: number;
	per_page: number;
}
