import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi, openCoreStream } from '@core/api';

import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunList } from '@module/workflow-run/types/WorkflowRunList';
import type { WorkflowRunQuery } from '@module/workflow-run/types/WorkflowRunQuery';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';
import type { WorkflowRunStreamMessage } from '@module/workflow-run/types/WorkflowRunStreamMessage';

const RESOURCE = '/workflow-runs';

/** Does an incoming run still belong in the filtered list we are holding? */
const matchesQuery = (run: WorkflowRun, param: WorkflowRunQuery) => {
	const definitionId = param.filter?.workflow_definition_id?.value;
	if (definitionId && run.workflow_definition_id !== definitionId) return false;

	const statusValue = param.filter?.status?.value;
	const statuses = Array.isArray(statusValue) ? statusValue : statusValue ? [statusValue] : [];
	if (statuses.length && !statuses.includes(run.status)) return false;

	return true;
};

export const workflowRunApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listWorkflowRuns: build.query<WorkflowRunList, WorkflowRunQuery>({
			// The param is already a `ComplexQueryParam`, so it goes to `Http` untouched.
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowRun, id: item.id })),
			],

			/**
			 * The subscription's lifetime is the cache entry's lifetime: it opens
			 * when the first component subscribes to this exact query and closes
			 * when the last one unsubscribes. Frames are merged into the same
			 * cache entry the initial GET filled, so the list is never refetched
			 * just because a status changed.
			 */
			async onCacheEntryAdded(param, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) {
				const stream = openCoreStream<WorkflowRunStreamMessage>({
					path: `${RESOURCE}/stream`,
					params: { workflow_definition_id: param.filter?.workflow_definition_id?.value?.toString() },
					onMessage: (message) => {
						updateCachedData((draft) => {
							if (message.type === 'run.deleted') {
								const index = draft.items.findIndex((item) => item.id === message.payload.id);
								if (index !== -1) {
									draft.items.splice(index, 1);
									draft.total -= 1;
								}
								return;
							}

							const run = message.payload;
							const index = draft.items.findIndex((item) => item.id === run.id);

							if (index !== -1) {
								// A run that no longer matches the active filter drops out
								// of this page rather than lingering as a stale row.
								if (matchesQuery(run, param)) draft.items[index] = run;
								else {
									draft.items.splice(index, 1);
									draft.total -= 1;
								}
								return;
							}

							// New runs only enter page 1; other pages would need a refetch
							// to stay consistent with the server's ordering.
							if (matchesQuery(run, param) && (param.page ?? 1) === 1) {
								draft.items.unshift(run);
								draft.total += 1;
								if (param.perPage && draft.items.length > param.perPage) draft.items.pop();
							}
						});
					},
				});

				try {
					// Merging before the initial data lands would throw away the GET.
					await cacheDataLoaded;
					await cacheEntryRemoved;
				} catch {
					// The entry was removed before the query resolved; fall through and close.
				} finally {
					stream.close();
				}
			},
		}),

		getWorkflowRun: build.query<WorkflowRun, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowRun, id }],

			async onCacheEntryAdded(id, { cacheDataLoaded, cacheEntryRemoved, updateCachedData }) {
				const stream = openCoreStream<WorkflowRunStreamMessage>({
					path: `${RESOURCE}/${id}/stream`,
					onMessage: (message) => {
						if (message.type !== 'run.updated') return;
						updateCachedData(() => message.payload);
					},
				});

				try {
					await cacheDataLoaded;
					await cacheEntryRemoved;
				} catch {
					// See above.
				} finally {
					stream.close();
				}
			},
		}),

		countWorkflowRunsByStatus: build.query<Record<WorkflowRunStatus | 'all', number>, WorkflowRunQuery>({
			query: (param) => ({ method: 'get', url: `${RESOURCE}/status-counts`, qParam: param }),
			providesTags: [{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID }],
		}),

		/**
		 * Pause/resume/stop are acknowledgements, not final states -- the backend
		 * settles asynchronously and the real transition arrives over the stream.
		 * Invalidating the row covers the case where the stream is down.
		 */
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
