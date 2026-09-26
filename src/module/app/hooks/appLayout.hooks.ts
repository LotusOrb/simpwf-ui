import { useCallback, useEffect, useRef } from 'react';

import { useCoreDispatch, useCoreSelector, useCoreStore } from '@core/store';

import {
	selectPanelInsets,
	selectPanelsCollapsed,
	selectPanelsOpened,
	setPanelCollapsed,
	setPanelOpened,
	togglePanel,
	togglePanelCollapsed,
	type AppLayoutPanelSide,
} from '@module/app/store';

export const useAppLayoutPanel = () => {
	const dispatch = useCoreDispatch();
	const opened = useCoreSelector(selectPanelsOpened);
	const collapsed = useCoreSelector(selectPanelsCollapsed);

	const setOpened = useCallback(
		(side: AppLayoutPanelSide, value: boolean) => dispatch(setPanelOpened({ side, opened: value })),
		[dispatch],
	);
	const setCollapsed = useCallback(
		(side: AppLayoutPanelSide, value: boolean) => dispatch(setPanelCollapsed({ side, collapsed: value })),
		[dispatch],
	);

	return {
		opened,
		setOpened,
		open: useCallback((side: AppLayoutPanelSide) => setOpened(side, true), [setOpened]),
		close: useCallback((side: AppLayoutPanelSide) => setOpened(side, false), [setOpened]),
		toggle: useCallback((side: AppLayoutPanelSide) => dispatch(togglePanel(side)), [dispatch]),
		collapsed,
		setCollapsed,
		toggleCollapsed: useCallback((side: AppLayoutPanelSide) => dispatch(togglePanelCollapsed(side)), [dispatch]),
	};
};

/** Space in px covered by each floating panel, measured from the layout surface edge. */
export const useAppLayoutInsets = () => useCoreSelector(selectPanelInsets);

type AppLayoutPanelsInitial = Partial<Record<AppLayoutPanelSide, { opened?: boolean; collapsed?: boolean }>>;

/**
 * Applies a page's initial panel state on mount and restores what was there before on unmount,
 * so one page's layout doesn't leak into the next.
 */
export const useAppLayoutPanels = (initial: AppLayoutPanelsInitial) => {
	const dispatch = useCoreDispatch();
	const store = useCoreStore();
	// Only the first value matters; later renders must not re-apply it over the user's toggles.
	const initialRef = useRef(initial);

	useEffect(() => {
		const { panels, collapsed } = store.getState().appLayout;
		const entries = Object.entries(initialRef.current) as [
			AppLayoutPanelSide,
			NonNullable<AppLayoutPanelsInitial[AppLayoutPanelSide]>,
		][];

		for (const [side, state] of entries) {
			if (state.opened !== undefined) dispatch(setPanelOpened({ side, opened: state.opened }));
			if (state.collapsed !== undefined) dispatch(setPanelCollapsed({ side, collapsed: state.collapsed }));
		}

		return () => {
			for (const [side, state] of entries) {
				if (state.opened !== undefined) dispatch(setPanelOpened({ side, opened: panels[side] }));
				if (state.collapsed !== undefined) dispatch(setPanelCollapsed({ side, collapsed: collapsed[side] }));
			}
		};
	}, [dispatch, store]);
};
