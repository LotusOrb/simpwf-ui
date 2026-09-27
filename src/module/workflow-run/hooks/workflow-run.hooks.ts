import { workflowRunApi } from '@module/workflow-run/api';

export const {
	useListWorkflowRunsQuery,
	useLazyListWorkflowRunsQuery,
	useListWorkflowRunPagesInfiniteQuery,
	useGetWorkflowRunQuery,
	useLazyGetWorkflowRunQuery,
	useGetWorkflowRunNodeDebugsQuery,
	useGetWorkflowRunContextQuery,
	useReplaceWorkflowRunContextMutation,
	useProvideWorkflowRunInputMutation,
	useRollbackWorkflowRunMutation,
	useCountWorkflowRunsByStatusQuery,
	usePauseWorkflowRunMutation,
	useResumeWorkflowRunMutation,
	useStopWorkflowRunMutation,
	useStartWorkflowRunMutation,
} = workflowRunApi;
