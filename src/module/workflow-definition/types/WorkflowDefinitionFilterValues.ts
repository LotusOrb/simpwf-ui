import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';
import type { WorkflowDefinitionSort } from './WorkflowDefinitionSort';

export interface WorkflowDefinitionFilterValues {
	sort: WorkflowDefinitionSort;
	startType: WorkflowDefinitionNodeType | null;
}
