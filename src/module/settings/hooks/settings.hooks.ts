import { useCallback } from 'react';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import type { ViewMode } from '@common/component/ViewModeToggle';

import { listViewChanged, selectListViewOf } from '@module/settings/store';
import type { ListViewKey } from '@module/settings/types/ListViewPreference';

/** The saved view mode of a list, and a setter that persists it. */
export const useListViewPreference = (key: ListViewKey): [ViewMode, (view: ViewMode) => void] => {
	const dispatch = useCoreDispatch();
	const view = useCoreSelector((state) => selectListViewOf(state, key));
	const setView = useCallback((next: ViewMode) => dispatch(listViewChanged({ key, view: next })), [dispatch, key]);
	return [view, setView];
};
