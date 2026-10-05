import React from 'react';

import { ScrollArea, Stack, Text, Title } from '@mantine/core';
import { Outlet } from 'react-router';

import { SettingsMenu } from '@module/settings/components/SettingsMenu';

import classes from './SettingsLayoutPage.module.scss';

export const SettingsLayoutPage: React.FC = () => {
	return (
		<ScrollArea h="100%" className={classes.canvas}>
			<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1180} mx="auto">
				<div>
					<Title order={2} fz={22}>
						Settings
					</Title>
					<Text c="dimmed" fz="sm">
						Manage how the app looks and behaves for you
					</Text>
				</div>
				<div className={classes.body}>
					<SettingsMenu />
					<div className={classes.content}>
						<Outlet />
					</div>
				</div>
			</Stack>
		</ScrollArea>
	);
};
