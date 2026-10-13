import { workflowRunApi } from '@module/workflow-run/api';

export const {
	useListWorkflowRunsQuery,
	useLazyListWorkflowRunsQuery,
	useListWorkflowRunPagesInfiniteQuery,
	useGetWorkflowRunQuery,
	useLazyGetWorkflowRunQuery,
	useGetWorkflowRunNodeDebugsQuery,
	useGetWorkflowRunContextQuery,
	useGetWorkflowRunDebugContextQuery,
	useLazyGetWorkflowRunDebugContextQuery,
	useReplaceWorkflowRunContextMutation,
	useProvideWorkflowRunInputMutation,
	useRollbackWorkflowRunMutation,
	useMigrateWorkflowRunMutation,
	useCountWorkflowRunsByStatusQuery,
	usePauseWorkflowRunMutation,
	useResumeWorkflowRunMutation,
	useStopWorkflowRunMutation,
	useStartWorkflowRunMutation,
} = workflowRunApi;
