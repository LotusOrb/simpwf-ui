import React, { useEffect } from 'react';

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';

import { useCoreDispatch } from '@core/store';

import { setSlotMounted } from '@module/app/store';

import { AppNavRail } from '../AppNavRail';
import { AppTopBar } from '../AppTopBar';
import { MAIN_LAYOUT_SLOT_ID } from './MainLayout.constants';
import classes from './MainLayout.module.scss';

export const MainLayout: React.FC = () => {
	const [opened, { toggle }] = useDisclosure();
	const dispatch = useCoreDispatch();

	useEffect(() => {
		dispatch(setSlotMounted({ side: 'left', mounted: true }));
		dispatch(setSlotMounted({ side: 'right', mounted: true }));

		return () => {
			dispatch(setSlotMounted({ side: 'left', mounted: false }));
			dispatch(setSlotMounted({ side: 'right', mounted: false }));
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
				<div className={classes.surface}>
					<div id={MAIN_LAYOUT_SLOT_ID.left} className={classes.slot} />
					<div className={classes.content}>
						<Outlet />
					</div>
					<div id={MAIN_LAYOUT_SLOT_ID.right} className={classes.slot} />
				</div>
			</AppShell.Main>
		</AppShell>
	);
};
