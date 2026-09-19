import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunList } from '@module/workflow-run/types/WorkflowRunList';
import type { WorkflowRunQuery } from '@module/workflow-run/types/WorkflowRunQuery';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

const RESOURCE = 'v1/workflow/instance';

export const workflowRunApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listWorkflowRuns: build.query<WorkflowRunList, WorkflowRunQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowRun, id: item.id })),
			],
		}),

		getWorkflowRun: build.query<WorkflowRun, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}/status` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		countWorkflowRunsByStatus: build.query<Record<WorkflowRunStatus | 'all', number>, WorkflowRunQuery>({
			query: (param) => ({ method: 'get', url: `${RESOURCE}/status-counts`, qParam: param }),
			providesTags: [{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID }],
		}),

		pauseWorkflowRun: build.mutation<Pick<WorkflowRun, 'status' | 'pause_requested'>, string>({
			query: (id) => ({ method: 'post', url: `${RESOURCE}/${id}/pause` }),
			invalidatesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		resumeWorkflowRun: build.mutation<Pick<WorkflowRun, 'status'>, string>({
			query: (id) => ({ method: 'post', url: `${RESOURCE}/${id}/resume` }),
			invalidatesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		stopWorkflowRun: build.mutation<Pick<WorkflowRun, 'status' | 'termination_pending'>, string>({
			query: (id) => ({ method: 'post', url: `${RESOURCE}/${id}/stop` }),
			invalidatesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		startWorkflowRun: build.mutation<WorkflowRun, { workflowDefinitionId: string; input?: unknown }>({
			query: ({ workflowDefinitionId, input }) => ({
				method: 'post',
				url: RESOURCE,
				body: { workflow_definition_id: workflowDefinitionId, input },
			}),
			invalidatesTags: [{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID }],
		}),
	}),
});
