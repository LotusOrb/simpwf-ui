import React, { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

import { Box, Drawer, useMantineTheme, type MantineBreakpoint } from '@mantine/core';
import { useMediaQuery } from '@mantine/hooks';

import { useCoreSelector, useCoreStore } from '@core/store';

import { useAppLayoutPanel } from '@module/app/hooks';
import { selectPanelOpened, selectSlotMounted, type AppLayoutPanelSide } from '@module/app/store';

import { MAIN_LAYOUT_SLOT_ID } from './MainLayout.constants';
import classes from './MainLayout.module.scss';

interface MainLayoutPanelProps {
	side: AppLayoutPanelSide;
	/** Width of a left or right panel. */
	w?: number;
	/** Height of a top or bottom panel; defaults to its content. */
	h?: number;
	/** Below this breakpoint a left or right panel opens as a drawer instead of floating. */
	drawerBelow?: MantineBreakpoint;
	children: React.ReactNode;
}

export const MainLayoutPanel: React.FC<MainLayoutPanelProps> = ({ side, w, h, drawerBelow, children }) => {
	const theme = useMantineTheme();
	const mounted = useCoreSelector((state) => selectSlotMounted(state, side));
	const store = useCoreStore();
	const { opened, close, setOpened } = useAppLayoutPanel();

	const drawerCapable = !!drawerBelow && (side === 'left' || side === 'right');
	const wide = useMediaQuery(`(min-width: ${theme.breakpoints[drawerBelow ?? 'xs']})`, true, {
		getInitialValueInEffect: false,
	});
	const drawer = drawerCapable && !wide;

	// A drawer covers the page, so it starts closed instead of inheriting the floating state; the
	// floating state comes back once the screen is wide again.
	const floatingOpened = useRef<boolean | null>(null);
	useEffect(() => {
		if (drawer) {
			floatingOpened.current = selectPanelOpened(store.getState(), side);
			close(side);
		} else if (floatingOpened.current !== null) {
			setOpened(side, floatingOpened.current);
			floatingOpened.current = null;
		}
	}, [drawer, side, close, setOpened, store]);

	if (drawer) {
		return (
			<Drawer
				opened={opened[side]}
				onClose={() => close(side)}
				position={side as 'left' | 'right'}
				size={w}
				withCloseButton={false}
				classNames={{ body: classes.drawerBody }}
			>
				{children}
			</Drawer>
		);
	}

	const slot = mounted ? document.getElementById(MAIN_LAYOUT_SLOT_ID[side]) : null;
	if (!slot || !opened[side]) return null;

	return createPortal(
		<Box w={w} h={h} className={classes.panel} data-side={side}>
			{children}
		</Box>,
		slot,
	);
};
