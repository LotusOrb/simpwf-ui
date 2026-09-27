import React from 'react';

import { Paper, Stack, Text } from '@mantine/core';
import { NavLink } from 'react-router';

import { SETTINGS_MENU } from '@module/settings/data';

import classes from './SettingsMenu.module.scss';

export const SettingsMenu: React.FC = () => {
	return (
		<Paper component="nav" aria-label="Settings" withBorder radius="md" p={6}>
			<Stack gap={2}>
				{SETTINGS_MENU.map((item) => (
					<NavLink key={item.id} to={item.to} className={classes.item}>
						<item.icon size={18} className={classes.icon} aria-hidden />
						<div>
							<Text fz="sm" fw={600} lh={1.3} c="inherit">
								{item.label}
							</Text>
							<Text fz="xs" c="dimmed" lh={1.3}>
								{item.description}
							</Text>
						</div>
					</NavLink>
				))}
			</Stack>
		</Paper>
	);
};
