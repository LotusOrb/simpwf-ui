import { workflowDefinitionApi } from '@module/workflow-definition/api';

/**
 * The hooks RTK Query generates for the injected endpoints. Components import
 * from here; `api/` stays the endpoint definition and nothing else.
 */
export const {
	useListWorkflowDefinitionsQuery,
	useLazyListWorkflowDefinitionsQuery,
	useGetWorkflowDefinitionQuery,
	useLazyGetWorkflowDefinitionQuery,
	useCreateWorkflowDefinitionMutation,
	useUpdateWorkflowDefinitionMutation,
	useDeleteWorkflowDefinitionMutation,
} = workflowDefinitionApi;
