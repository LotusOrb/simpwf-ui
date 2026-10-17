import { useCallback, useEffect, useMemo } from 'react';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import {
	runViewEnded,
	runViewStarted,
	runWatchAdded,
	runWatchRemoved,
	selectIsRunWatched,
	selectRunStreamState,
	selectWatchedRunCount,
} from '@module/notification/store';

export interface RunWatchOptions {
	/** Shown in notifications, e.g. the definition name and version. */
	label?: string;
	/** The run was just started here, so its first snapshot may already notify. */
	fromStart?: boolean;
}

/** Starts or stops notifications for any run. */
export const useRunWatchActions = () => {
	const dispatch = useCoreDispatch();
	return useMemo(
		() => ({
			watch: (id: string, options?: RunWatchOptions) => dispatch(runWatchAdded({ id, ...options })),
			unwatch: (id: string) => dispatch(runWatchRemoved(id)),
		}),
		[dispatch],
	);
};

/** Whether one run notifies on status changes, and the toggles for it. */
export const useRunWatch = (runId: string) => {
	const actions = useRunWatchActions();
	const watching = useCoreSelector((state) => selectIsRunWatched(state, runId));
	const watch = useCallback((options?: RunWatchOptions) => actions.watch(runId, options), [actions, runId]);
	const unwatch = useCallback(() => actions.unwatch(runId), [actions, runId]);
	return { watching, watch, unwatch };
};

/**
 * Keeps a status stream open for a run while `enabled`, without notifying, and reports its state.
 * Status events land in the `getWorkflowRun` cache, so the caller reads the run from there.
 */
export const useRunStream = (runId: string, enabled: boolean) => {
	const dispatch = useCoreDispatch();

	useEffect(() => {
		if (!enabled) return;
		dispatch(runViewStarted(runId));
		return () => {
			dispatch(runViewEnded(runId));
		};
	}, [dispatch, runId, enabled]);

	return useCoreSelector((state) => (enabled ? selectRunStreamState(state, runId) : undefined));
};

export const useWatchedRunCount = () => useCoreSelector(selectWatchedRunCount);
