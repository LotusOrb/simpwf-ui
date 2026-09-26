import { workflowDefinitionApi } from '@module/workflow-definition/api';

export const {
	useListWorkflowDefinitionsQuery,
	useLazyListWorkflowDefinitionsQuery,
	useListWorkflowDefinitionVersionsQuery,
	useGetWorkflowDefinitionQuery,
	useLazyGetWorkflowDefinitionQuery,
	useCreateWorkflowDefinitionMutation,
	useDeleteWorkflowDefinitionMutation,
} = workflowDefinitionApi;
