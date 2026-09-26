import React, { useEffect, useRef } from 'react';

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';

import { useCoreDispatch } from '@core/store';

import { setPanelInset, setSlotMounted, type AppLayoutPanelSide } from '@module/app/store';

import { AppNavRail } from '../AppNavRail';
import { AppTopBar } from '../AppTopBar';
import { MAIN_LAYOUT_PANEL_GAP, MAIN_LAYOUT_PANEL_SIDES, MAIN_LAYOUT_SLOT_ID } from './MainLayout.constants';
import classes from './MainLayout.module.scss';

const isHorizontal = (side: AppLayoutPanelSide) => side === 'left' || side === 'right';

export const MainLayout: React.FC = () => {
	const [opened, { toggle }] = useDisclosure();
	const dispatch = useCoreDispatch();
	const surfaceRef = useRef<HTMLDivElement>(null);

	useEffect(() => {
		for (const side of MAIN_LAYOUT_PANEL_SIDES) dispatch(setSlotMounted({ side, mounted: true }));

		return () => {
			for (const side of MAIN_LAYOUT_PANEL_SIDES) dispatch(setSlotMounted({ side, mounted: false }));
		};
	}, [dispatch]);

	// Publish how much of the surface each floating panel covers, so canvases can keep their
	// controls and fitted content in the visible area. An empty slot is `display: none`, so it
	// measures 0 and its inset collapses.
	useEffect(() => {
		const surface = surfaceRef.current;
		if (!surface) return;

		const insets = new Map<AppLayoutPanelSide, number>();
		const observers = MAIN_LAYOUT_PANEL_SIDES.map((side) => {
			const slot = document.getElementById(MAIN_LAYOUT_SLOT_ID[side]);
			const observer = new ResizeObserver(([entry]) => {
				const box = entry.borderBoxSize[0];
				const size = Math.round(isHorizontal(side) ? box.inlineSize : box.blockSize);
				const inset = size > 0 ? size + MAIN_LAYOUT_PANEL_GAP : 0;
				if (insets.get(side) === inset) return;

				insets.set(side, inset);
				surface.style.setProperty(`--layout-inset-${side}`, `${inset}px`);
				dispatch(setPanelInset({ side, inset }));
			});
			if (slot) observer.observe(slot);
			return observer;
		});

		return () => {
			for (const observer of observers) observer.disconnect();
			for (const side of MAIN_LAYOUT_PANEL_SIDES) dispatch(setPanelInset({ side, inset: 0 }));
		};
	}, [dispatch]);

	return (
		<AppShell
			header={{ height: 52 }}
			navbar={{ width: 64, breakpoint: 'sm', collapsed: { mobile: !opened } }}
			padding={0}
			classNames={{ root: classes.root, header: classes.header, navbar: classes.navbar, main: classes.main }}
		>
			<AppShell.Header>
				<AppTopBar navOpened={opened} onToggleNav={toggle} />
			</AppShell.Header>
			<AppShell.Navbar>
				<AppNavRail />
			</AppShell.Navbar>
			<AppShell.Main>
				<div
					ref={surfaceRef}
					className={classes.surface}
					style={{ '--layout-panel-gap': `${MAIN_LAYOUT_PANEL_GAP}px` } as React.CSSProperties}
				>
					<div className={classes.content}>
						<Outlet />
					</div>
					<div className={classes.overlay}>
						{MAIN_LAYOUT_PANEL_SIDES.map((side) => (
							<div key={side} id={MAIN_LAYOUT_SLOT_ID[side]} className={classes.slot} data-side={side} />
						))}
					</div>
				</div>
			</AppShell.Main>
		</AppShell>
	);
};
