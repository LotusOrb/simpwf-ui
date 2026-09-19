import { workflowRunApi } from '@module/workflow-run/api';

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
