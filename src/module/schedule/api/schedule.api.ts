import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';
import type { CoreQueryError } from '@core/api/core.baseQuery';

import { SCHEDULE_REPLACE_REMOVED } from '@module/schedule/data/schedule.constant';
import type { Schedule } from '@module/schedule/types/Schedule';
import type { ScheduleList } from '@module/schedule/types/ScheduleList';
import type { SchedulePayload } from '@module/schedule/types/SchedulePayload';
import type { ScheduleQuery } from '@module/schedule/types/ScheduleQuery';

const RESOURCE = 'v1/workflow/schedules';

const scheduleUrl = (id: string) => `${RESOURCE}/${encodeURIComponent(id)}`;

const listTag = { type: apiTagConfig.schedule, id: API_TAG_LIST_ID } as const;

// Reads are injected first so the optimistic pause/resume below can patch their caches without a circular type.
const scheduleQueryApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listSchedules: build.query<ScheduleList, ScheduleQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				listTag,
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.schedule, id: item.id })),
			],
		}),

		getSchedule: build.query<Schedule, string>({
			query: (id) => ({ method: 'get', url: scheduleUrl(id) }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.schedule, id }],
		}),
	}),
});

export const scheduleApi = scheduleQueryApi.injectEndpoints({
	endpoints: (build) => ({
		createSchedule: build.mutation<Schedule, SchedulePayload>({
			query: (body) => ({ method: 'post', url: RESOURCE, body }),
			invalidatesTags: [listTag],
		}),

		/**
		 * The API has no update, so editing replaces the schedule: delete, then create. The new schedule gets a new
		 * id. If the create fails the old one is already gone; the error says so (and keeps the engine's reason in
		 * `data`), so the caller can fix the form and create it again.
		 */
		replaceSchedule: build.mutation<Schedule, { id: string; payload: SchedulePayload }>({
			queryFn: async ({ id, payload }, _api, _extra, baseQuery) => {
				const removed = await baseQuery({ method: 'delete', url: scheduleUrl(id) });
				if (removed.error && (removed.error as CoreQueryError).code !== 404) {
					return { error: removed.error };
				}

				const created = await baseQuery({ method: 'post', url: RESOURCE, body: payload });
				if (created.error) {
					const error = created.error as CoreQueryError;
					return {
						error: {
							...error,
							data: error.message,
							explain: SCHEDULE_REPLACE_REMOVED,
							message: `The old schedule was removed but the new one couldn't be created (${error.message}). Fix it and create it again.`,
						},
					};
				}
				return { data: created.data as Schedule };
			},
			invalidatesTags: (_result, _error, { id }) => [{ type: apiTagConfig.schedule, id }, listTag],
		}),

		deleteSchedule: build.mutation<void, string>({
			query: (id) => ({ method: 'delete', url: scheduleUrl(id) }),
			invalidatesTags: (_result, _error, id) => [{ type: apiTagConfig.schedule, id }, listTag],
		}),

		// Pause and resume are idempotent and return the schedule, so the switch flips at once and rolls back on error.
		pauseSchedule: build.mutation<Schedule, string>({
			query: (id) => ({ method: 'post', url: `${scheduleUrl(id)}/pause` }),
			onQueryStarted: (id, api) => optimisticEnabled(id, false, api),
		}),

		resumeSchedule: build.mutation<Schedule, string>({
			query: (id) => ({ method: 'post', url: `${scheduleUrl(id)}/resume` }),
			onQueryStarted: (id, api) => optimisticEnabled(id, true, api),
		}),
	}),
});

type PatchThunk = ReturnType<typeof scheduleQueryApi.util.updateQueryData>;

interface OptimisticApi {
	dispatch: (thunk: PatchThunk) => { undo: () => void };
	getState: () => unknown;
	queryFulfilled: Promise<{ data: Schedule }>;
}

/** Sets `enabled` in every cached list page and detail holding the schedule; undoes it if the request fails. */
async function optimisticEnabled(id: string, enabled: boolean, { dispatch, getState, queryFulfilled }: OptimisticApi) {
	const apply = (next: Schedule | null) => {
		const cached = scheduleQueryApi.util.selectInvalidatedBy(
			getState() as Parameters<typeof scheduleQueryApi.util.selectInvalidatedBy>[0],
			[{ type: apiTagConfig.schedule, id }],
		);
		return cached.flatMap(({ endpointName, originalArgs }) => {
			if (endpointName === 'listSchedules') {
				return [
					dispatch(
						scheduleQueryApi.util.updateQueryData(
							'listSchedules',
							originalArgs as ScheduleQuery,
							(draft) => {
								const index = draft.items.findIndex((item) => item.id === id);
								if (index < 0) return;
								draft.items[index] = next ?? { ...draft.items[index], enabled };
							},
						),
					),
				];
			}
			if (endpointName === 'getSchedule') {
				return [
					dispatch(
						scheduleQueryApi.util.updateQueryData('getSchedule', originalArgs as string, (draft) =>
							next ? next : { ...draft, enabled },
						),
					),
				];
			}
			return [];
		});
	};

	const patches = apply(null);
	try {
		const { data } = await queryFulfilled;
		// The response is the source of truth (e.g. updated_at), so it replaces the guess.
		apply(data);
	} catch {
		for (const patch of patches) patch.undo();
	}
}
