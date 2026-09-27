import { workflowDefinitionApi } from '@module/workflow-definition/api';

export const {
	useListWorkflowDefinitionsQuery,
	useLazyListWorkflowDefinitionsQuery,
	useListWorkflowDefinitionVersionPagesInfiniteQuery,
	useListWorkflowDefinitionVersionsQuery,
	useGetWorkflowDefinitionQuery,
	useLazyGetWorkflowDefinitionQuery,
	useCreateWorkflowDefinitionMutation,
	useDeleteWorkflowDefinitionMutation,
} = workflowDefinitionApi;
