import { workflowRunApi } from '@module/workflow-run/api';

/**
 * The hooks RTK Query generates for the injected endpoints. Components import
 * from here; `api/` stays the endpoint definition and nothing else.
 */
export const {
	useListWorkflowRunsQuery,
	useLazyListWorkflowRunsQuery,
	useGetWorkflowRunQuery,
	useLazyGetWorkflowRunQuery,
	useCountWorkflowRunsByStatusQuery,
	usePauseWorkflowRunMutation,
	useResumeWorkflowRunMutation,
	useStopWorkflowRunMutation,
	useStartWorkflowRunMutation,
} = workflowRunApi;
