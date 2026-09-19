import { workflowDefinitionApi } from '@module/workflow-definition/api';

export const {
	useListWorkflowDefinitionsQuery,
	useLazyListWorkflowDefinitionsQuery,
	useGetWorkflowDefinitionQuery,
	useLazyGetWorkflowDefinitionQuery,
	useCreateWorkflowDefinitionMutation,
	useUpdateWorkflowDefinitionMutation,
	useDeleteWorkflowDefinitionMutation,
} = workflowDefinitionApi;
