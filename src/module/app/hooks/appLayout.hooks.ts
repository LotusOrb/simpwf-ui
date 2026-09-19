import { useCallback } from 'react';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { selectPanelOpened, setPanelOpened, togglePanel, type AppLayoutPanelSide } from '@module/app/store';

export const useAppLayoutPanel = () => {
	const dispatch = useCoreDispatch();
	const left = useCoreSelector((state) => selectPanelOpened(state, 'left'));
	const right = useCoreSelector((state) => selectPanelOpened(state, 'right'));

	const setOpened = useCallback(
		(side: AppLayoutPanelSide, opened: boolean) => dispatch(setPanelOpened({ side, opened })),
		[dispatch],
	);

	return {
		opened: { left, right },
		setOpened,
		open: useCallback((side: AppLayoutPanelSide) => setOpened(side, true), [setOpened]),
		close: useCallback((side: AppLayoutPanelSide) => setOpened(side, false), [setOpened]),
		toggle: useCallback((side: AppLayoutPanelSide) => dispatch(togglePanel(side)), [dispatch]),
	};
};
