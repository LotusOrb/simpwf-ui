import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { clearSession } from '@core/auth/store';
import { LocalKVStore } from '@core/localKVStore';

import { RUN_WATCH_STARTED_KEY, RUN_WATCH_TTL_MS } from '@module/notification/data';
import type { RunStreamState } from '@module/notification/types/RunStreamState';
import type { RunWatchEntry } from '@module/notification/types/RunWatchEntry';

const runWatchStore = new LocalKVStore('runWatch');

const WATCHED_KEY = 'watched';

const isEntry = (value: unknown): value is RunWatchEntry => {
	if (!value || typeof value !== 'object') return false;
	const entry = value as Record<string, unknown>;
	return (
		typeof entry.addedAt === 'number' &&
		(entry.lastKey === null || typeof entry.lastKey === 'string') &&
		(entry.label === undefined || typeof entry.label === 'string')
	);
};

const pruneExpired = (watched: Record<string, RunWatchEntry>, now: number) => {
	for (const [id, entry] of Object.entries(watched)) {
		if (now - entry.addedAt > RUN_WATCH_TTL_MS) delete watched[id];
	}
};

/** Reads the stored watches, dropping malformed and expired ones. */
const loadWatched = (): Record<string, RunWatchEntry> => {
	const stored = runWatchStore.get<unknown>(WATCHED_KEY);
	if (!stored || typeof stored !== 'object') return {};
	const watched = Object.fromEntries(Object.entries(stored).filter(([, entry]) => isEntry(entry)));
	pruneExpired(watched, Date.now());
	return watched;
};

export interface RunWatchState {
	/** Runs that notify on status changes; persisted. */
	watched: Record<string, RunWatchEntry>;
	/** Open run detail pages per run, which stream without notifying. */
	viewers: Record<string, number>;
	streams: Record<string, RunStreamState>;
}

const initialState: RunWatchState = {
	watched: loadWatched(),
	viewers: {},
	streams: {},
};

const persist = (state: RunWatchState) => {
	runWatchStore.set(WATCHED_KEY, state.watched);
};

export const runWatchSlice = createSlice({
	name: 'runWatch',
	initialState,
	reducers: {
		runWatchAdded: {
			reducer: (
				state,
				action: PayloadAction<{ id: string; label?: string; fromStart?: boolean; addedAt: number }>,
			) => {
				const { id, label, fromStart, addedAt } = action.payload;
				pruneExpired(state.watched, addedAt);
				state.watched[id] ??= { addedAt, lastKey: fromStart ? RUN_WATCH_STARTED_KEY : null, label };
				persist(state);
			},
			prepare: (payload: { id: string; label?: string; fromStart?: boolean }) => ({
				payload: { ...payload, addedAt: Date.now() },
			}),
		},
		runWatchRemoved: (state, action: PayloadAction<string>) => {
			if (!state.watched[action.payload]) return;
			delete state.watched[action.payload];
			persist(state);
		},
		runWatchStatusSeen: (state, action: PayloadAction<{ id: string; key: string }>) => {
			const entry = state.watched[action.payload.id];
			if (!entry) return;
			entry.lastKey = action.payload.key;
			persist(state);
		},
		runViewStarted: (state, action: PayloadAction<string>) => {
			state.viewers[action.payload] = (state.viewers[action.payload] ?? 0) + 1;
		},
		runViewEnded: (state, action: PayloadAction<string>) => {
			const count = (state.viewers[action.payload] ?? 0) - 1;
			if (count > 0) state.viewers[action.payload] = count;
			else delete state.viewers[action.payload];
		},
		runStreamStateChanged: (state, action: PayloadAction<{ id: string; state: RunStreamState }>) => {
			state.streams[action.payload.id] = action.payload.state;
		},
		runStreamStateCleared: (state, action: PayloadAction<string>) => {
			delete state.streams[action.payload];
		},
	},
	extraReducers: (builder) => {
		// Watches belong to whoever started them; the next user starts with none.
		builder.addCase(clearSession, (state) => {
			state.watched = {};
			persist(state);
		});
	},
	selectors: {
		selectWatchedRuns: (state) => state.watched,
		selectRunViewers: (state) => state.viewers,
		selectRunStreams: (state) => state.streams,
		selectIsRunWatched: (state, id: string) => !!state.watched[id],
		selectRunStreamState: (state, id: string): RunStreamState | undefined => state.streams[id],
		selectWatchedRunCount: (state) => Object.keys(state.watched).length,
	},
});

export const {
	runWatchAdded,
	runWatchRemoved,
	runWatchStatusSeen,
	runViewStarted,
	runViewEnded,
	runStreamStateChanged,
	runStreamStateCleared,
} = runWatchSlice.actions;
export const {
	selectWatchedRuns,
	selectRunViewers,
	selectRunStreams,
	selectIsRunWatched,
	selectRunStreamState,
	selectWatchedRunCount,
} = runWatchSlice.selectors;
