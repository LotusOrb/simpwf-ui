import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { LocalKVStore } from '@core/localKVStore';

import type { ViewMode } from '@common/component/ViewModeToggle';

import { DEFAULT_LIST_VIEW } from '@module/settings/data';
import type { ListViewKey, ListViewPreference } from '@module/settings/types/ListViewPreference';

const settingsStore = new LocalKVStore('settings');

const LIST_VIEW_KEY = 'listView';

const isViewMode = (value: unknown): value is ViewMode => value === 'card' || value === 'list';

/** Merges the stored record over the defaults, keeping only known keys with valid values. */
const loadListView = (): ListViewPreference => {
	const stored = settingsStore.get<Record<string, unknown>>(LIST_VIEW_KEY);
	const listView = { ...DEFAULT_LIST_VIEW };
	if (!stored || typeof stored !== 'object') return listView;
	for (const key of Object.keys(listView) as ListViewKey[]) {
		if (isViewMode(stored[key])) listView[key] = stored[key];
	}
	return listView;
};

export interface SettingsState {
	listView: ListViewPreference;
}

const initialState: SettingsState = {
	listView: loadListView(),
};

export const settingsSlice = createSlice({
	name: 'settings',
	initialState,
	reducers: {
		listViewChanged: (state, action: PayloadAction<{ key: ListViewKey; view: ViewMode }>) => {
			state.listView[action.payload.key] = action.payload.view;
			settingsStore.set(LIST_VIEW_KEY, state.listView);
		},
		listViewSaved: (state, action: PayloadAction<ListViewPreference>) => {
			state.listView = settingsStore.set(LIST_VIEW_KEY, { ...action.payload });
		},
	},
	selectors: {
		selectListView: (state) => state.listView,
		selectListViewOf: (state, key: ListViewKey) => state.listView[key],
	},
});

export const { listViewChanged, listViewSaved } = settingsSlice.actions;
export const { selectListView, selectListViewOf } = settingsSlice.selectors;
