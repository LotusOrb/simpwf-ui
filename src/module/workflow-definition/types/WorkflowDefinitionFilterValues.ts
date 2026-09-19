import type { WorkflowDefinitionComplexity } from './WorkflowDefinitionComplexity';
import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';
import type { WorkflowDefinitionSort } from './WorkflowDefinitionSort';

/** Filter form state held by the UI, before it is mapped onto `WorkflowDefinitionQuery`. */
export interface WorkflowDefinitionFilterValues {
	sort: WorkflowDefinitionSort;
	startType: WorkflowDefinitionNodeType | null;
	complexity: WorkflowDefinitionComplexity | null;
}
