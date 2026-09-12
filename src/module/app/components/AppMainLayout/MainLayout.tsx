import React from 'react';

import { AppShell } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { Outlet } from 'react-router';

import { AppNavRail } from '../AppNavRail';
import { AppTopBar } from '../AppTopBar';
import classes from './MainLayout.module.scss';

export const MainLayout: React.FC = () => {
	const [opened, { toggle }] = useDisclosure();

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
					<Outlet />
				</div>
			</AppShell.Main>
		</AppShell>
	);
};
