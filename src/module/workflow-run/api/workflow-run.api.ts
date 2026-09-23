import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import {
	toRunDetail,
	toRunNodeDebug,
	type WorkflowRunNodeDebugResponse,
	type WorkflowRunStatusResponse,
} from '@module/workflow-run/data/workflow-run.mapper';
import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunList } from '@module/workflow-run/types/WorkflowRunList';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunQuery } from '@module/workflow-run/types/WorkflowRunQuery';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

const RESOURCE = 'v1/workflow/instance';

export interface WorkflowRunNodeDebugQuery {
	id: string;
	/** Graph node ids with their current occurrence; a new occurrence or status refetches. */
	nodes: { nodeId: string; occurrenceId: string; status: string; attempt: number }[];
}

export const workflowRunApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listWorkflowRuns: build.query<WorkflowRunList, WorkflowRunQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowRun, id: item.id })),
			],
		}),

		getWorkflowRun: build.query<WorkflowRunDetail, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}/status` }),
			transformResponse: (res: WorkflowRunStatusResponse) => toRunDetail(res),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		/** Debug detail of every executed node, keyed by occurrence id. */
		getWorkflowRunNodeDebugs: build.query<Record<string, WorkflowRunNodeDebug>, WorkflowRunNodeDebugQuery>({
			queryFn: async ({ id, nodes }, _api, _extra, baseQuery) => {
				const results = await Promise.all(
					nodes.map((node) =>
						baseQuery({
							method: 'get',
							url: `${RESOURCE}/${id}/status/node/${encodeURIComponent(node.nodeId)}`,
						}),
					),
				);

				const debug: Record<string, WorkflowRunNodeDebug> = {};
				for (const result of results) {
					if (result.error) return { error: result.error };
					const node = toRunNodeDebug(result.data as WorkflowRunNodeDebugResponse);
					debug[node.occurrence_id] = node;
				}
				return { data: debug };
			},
			providesTags: (_result, _error, { id }) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		getWorkflowRunContext: build.query<Record<string, unknown>, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}/context` }),
			transformResponse: (res: { id: string; context: Record<string, unknown> | null }) => res.context ?? {},
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		replaceWorkflowRunContext: build.mutation<
			Record<string, unknown>,
			{ id: string; context: Record<string, unknown>; reason?: string }
		>({
			query: ({ id, context, reason }) => ({
				method: 'put',
				url: `${RESOURCE}/${id}/context`,
				body: context,
				head: reason ? { 'X-Context-Update-Reason': reason } : undefined,
			}),
			transformResponse: (res: { id: string; context: Record<string, unknown> | null }) => res.context ?? {},
			invalidatesTags: (_result, _error, { id }) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		provideWorkflowRunInput: build.mutation<{ accepted: boolean }, { id: string; payload: unknown }>({
			query: ({ id, payload }) => ({
				method: 'put',
				url: `${RESOURCE}/${id}/input`,
				// Pre-serialised so a bare string/number payload still goes out as JSON.
				body: JSON.stringify(payload),
				head: { 'Idempotency-Key': crypto.randomUUID() },
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: apiTagConfig.workflowRun, id }],
		}),

		rollbackWorkflowRun: build.mutation<
			Pick<WorkflowRunDetail, 'status' | 'current_node_id'>,
			{ id: string; targetOccurrenceId: string; reason?: string }
		>({
			query: ({ id, targetOccurrenceId, reason }) => ({
				method: 'post',
				url: `${RESOURCE}/${id}/rollback`,
				body: { target_occurrence_id: targetOccurrenceId, reason: reason || undefined },
			}),
			invalidatesTags: (_result, _error, { id }) => [{ type: apiTagConfig.workflowRun, id }],
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

		startWorkflowRun: build.mutation<Pick<WorkflowRun, 'id' | 'status'>, string>({
			query: (workflowDefinitionId) => ({
				method: 'post',
				url: RESOURCE,
				body: { workflow_definition_id: workflowDefinitionId },
			}),
			invalidatesTags: [{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID }],
		}),
	}),
});
