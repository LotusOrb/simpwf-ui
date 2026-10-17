import React, { useEffect, useMemo, useRef } from 'react';

import { openCoreSse, type CoreSse, type CoreSseFrame } from '@core/api';
import { Permission, useCan } from '@core/auth/authorization';
import { selectIsAuthenticated } from '@core/auth/store';
import { useCoreDispatch, useCoreSelector, useCoreStore } from '@core/store';

import { RUN_STREAM_LIMIT } from '@module/notification/constant';
import { useNotify } from '@module/notification/hooks';
import {
	runStreamStateChanged,
	runStreamStateCleared,
	runWatchRemoved,
	runWatchStatusSeen,
	selectRunStreams,
	selectRunViewers,
	selectWatchedRuns,
} from '@module/notification/store';
import type { RunStreamState } from '@module/notification/types/RunStreamState';
import { isTerminalRunStatus, toRunWatchKey, toRunWatchNotification } from '@module/notification/utils';
import { workflowRunApi } from '@module/workflow-run/api';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import { toRunDetail, type WorkflowRunStatusResponse } from '@module/workflow-run/utils/workflow-run.mapper';

const isSettled = (state?: RunStreamState) => state === 'done' || state === 'failed';

/**
 * Keeps one status stream per watched or viewed run, up to the stream limit, with viewed runs
 * first. Every status event refreshes the run's cached detail; for watched runs a new status
 * also publishes a notification, recorded without a toast when the run's page is already open.
 * Renders nothing; mounted once in the app layout.
 */
export const RunWatchManager: React.FC = () => {
	const store = useCoreStore();
	const dispatch = useCoreDispatch();
	const notify = useNotify();
	const canRead = useCan(Permission.InstancesRead);
	const authenticated = useCoreSelector(selectIsAuthenticated);
	const watched = useCoreSelector(selectWatchedRuns);
	const viewers = useCoreSelector(selectRunViewers);
	const streams = useCoreSelector(selectRunStreams);
	const open = useRef(new Map<string, CoreSse>());

	const desired = useMemo(() => {
		if (!canRead || !authenticated) return [];
		const watchedOnly = Object.entries(watched)
			.filter(([id]) => !viewers[id])
			.sort(([, a], [, b]) => a.addedAt - b.addedAt)
			.map(([id]) => id);
		return [...Object.keys(viewers), ...watchedOnly];
	}, [canRead, authenticated, watched, viewers]);

	const desiredKey = desired.join(',');
	const selectedKey = desired
		.filter((id) => !isSettled(streams[id]))
		.slice(0, RUN_STREAM_LIMIT)
		.join(',');

	useEffect(() => {
		const setState = (id: string, state: RunStreamState) => dispatch(runStreamStateChanged({ id, state }));

		const settle = (id: string, state: RunStreamState) => {
			open.current.get(id)?.close();
			open.current.delete(id);
			setState(id, state);
		};

		const report = (id: string, detail: WorkflowRunDetail) => {
			const { watched: entries, viewers: viewing } = store.getState().runWatch;
			const entry = entries[id];
			if (!entry) return;

			const key = toRunWatchKey(detail);
			if (key !== entry.lastKey) {
				dispatch(runWatchStatusSeen({ id, key }));
				// A null key means this is the first snapshot of a run watched mid-flight: it only sets the baseline.
				const notification = entry.lastKey === null ? null : toRunWatchNotification(detail, entry.label);
				if (notification) {
					const { level, ...options } = notification;
					notify[level]({ ...options, recordOnly: !!viewing[id] });
				}
			}
			if (isTerminalRunStatus(detail.status)) dispatch(runWatchRemoved(id));
		};

		const handleFrame = (id: string, frame: CoreSseFrame) => {
			if (frame.event === 'error') return settle(id, 'failed');
			if (frame.event !== 'status') return;

			let detail: WorkflowRunDetail;
			try {
				detail = toRunDetail(JSON.parse(frame.data) as WorkflowRunStatusResponse);
			} catch {
				return;
			}

			void dispatch(workflowRunApi.util.upsertQueryData('getWorkflowRun', id, detail));
			report(id, detail);
			// The server closes the stream after a terminal status; nothing more can change.
			if (isTerminalRunStatus(detail.status)) settle(id, 'done');
		};

		const desiredIds = new Set(desiredKey ? desiredKey.split(',') : []);
		const selectedIds = new Set(selectedKey ? selectedKey.split(',') : []);

		for (const [id, stream] of open.current) {
			if (selectedIds.has(id)) continue;
			stream.close();
			open.current.delete(id);
		}

		for (const id of selectedIds) {
			if (open.current.has(id)) continue;
			setState(id, 'connecting');
			open.current.set(
				id,
				openCoreSse({
					api: store,
					path: `v1/workflow/instance/${encodeURIComponent(id)}/status/stream`,
					onFrame: (frame) => handleFrame(id, frame),
					onOpen: () => setState(id, 'open'),
					onRetry: () => setState(id, 'reconnecting'),
					onEnd: (reason) => {
						open.current.delete(id);
						setState(id, 'failed');
						// A run that no longer exists will never notify.
						if (reason.type === 'http' && reason.code === 404) dispatch(runWatchRemoved(id));
					},
				}),
			);
		}

		// Queued and dropped runs lose their state, so a viewer falls back to polling; settled ones keep it
		// while still wanted, so they are not reopened.
		for (const [id, state] of Object.entries(store.getState().runWatch.streams)) {
			const keep = desiredIds.has(id) && (open.current.has(id) || isSettled(state));
			if (!keep) dispatch(runStreamStateCleared(id));
		}
	}, [desiredKey, selectedKey, store, dispatch, notify]);

	useEffect(
		() => () => {
			for (const [id, stream] of open.current) {
				stream.close();
				dispatch(runStreamStateCleared(id));
			}
			open.current.clear();
		},
		[dispatch],
	);

	return null;
};
