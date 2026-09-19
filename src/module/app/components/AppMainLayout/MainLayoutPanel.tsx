import React from 'react';

import { Box, type BoxProps, type MantineBreakpoint } from '@mantine/core';
import { createPortal } from 'react-dom';

import { useCoreSelector } from '@core/store';

import { useAppLayoutPanel } from '@module/app/hooks';
import { selectSlotMounted, type AppLayoutPanelSide } from '@module/app/store';

import { MAIN_LAYOUT_SLOT_ID } from './MainLayout.constants';
import classes from './MainLayout.module.scss';

interface MainLayoutPanelProps extends Pick<BoxProps, 'w'> {
	side: AppLayoutPanelSide;
	visibleFrom?: MantineBreakpoint;
	children: React.ReactNode;
}

export const MainLayoutPanel: React.FC<MainLayoutPanelProps> = ({ side, w, visibleFrom, children }) => {
	const mounted = useCoreSelector((state) => selectSlotMounted(state, side));
	const { opened } = useAppLayoutPanel();

	const slot = mounted ? document.getElementById(MAIN_LAYOUT_SLOT_ID[side]) : null;
	if (!slot || !opened[side]) return null;

	return createPortal(
		<Box w={w} visibleFrom={visibleFrom} className={classes.panel}>
			{children}
		</Box>,
		slot,
	);
};
