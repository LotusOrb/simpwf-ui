import { appApi } from '@module/app/api';
import type { AppHealthStatus } from '@module/app/types/AppHealthStatus';

export const { useGetHealthLiveQuery, useLazyGetHealthLiveQuery, useGetHealthReadyQuery, useLazyGetHealthReadyQuery } =
	appApi;

const HEALTH_POLLING_INTERVAL = 15_000;

export const useAppHealthStatus = (pollingInterval = HEALTH_POLLING_INTERVAL) => {
	const live = useGetHealthLiveQuery(undefined, { pollingInterval, skipPollingIfUnfocused: true });
	const ready = useGetHealthReadyQuery(undefined, { pollingInterval, skipPollingIfUnfocused: true });

	let status: AppHealthStatus = 'checking';
	if (live.isError) status = 'down';
	else if (ready.isError) status = 'not-ready';
	else if (live.isSuccess && ready.isSuccess) status = 'ready';

	return {
		status,
		live: live.data ?? null,
		ready: ready.data ?? null,
		fetching: live.isFetching || ready.isFetching,
		refetch: () => {
			live.refetch();
			ready.refetch();
		},
	};
};
