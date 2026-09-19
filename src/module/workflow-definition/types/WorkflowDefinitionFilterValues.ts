import type { WorkflowDefinitionComplexity } from './WorkflowDefinitionComplexity';
import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';
import type { WorkflowDefinitionSort } from './WorkflowDefinitionSort';

export interface WorkflowDefinitionFilterValues {
	sort: WorkflowDefinitionSort;
	startType: WorkflowDefinitionNodeType | null;
	complexity: WorkflowDefinitionComplexity | null;
}
