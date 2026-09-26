import React from 'react';

import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuLogOut, LuSettings } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { coreApi } from '@core/api';
import { clearToken } from '@core/auth/store';
import { useCoreDispatch } from '@core/store';

import classes from './AppProfileMenu.module.scss';

const APP_VERSION_LABEL = __APP_VERSION__ === 'dev' ? 'dev' : `v${__APP_VERSION__}`;

interface AppProfileMenuProps {
	name?: string;
	role?: string;
}

export const AppProfileMenu: React.FC<AppProfileMenuProps> = ({ name = 'Admin', role = 'Workspace owner' }) => {
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const initials = name
		.split(' ')
		.map((part) => part.charAt(0))
		.join('')
		.slice(0, 2)
		.toUpperCase();

	const handleLogout = () => {
		dispatch(clearToken());
		dispatch(coreApi.util.resetApiState());
		navigate('/auth/login', { replace: true });
	};

	return (
		<Menu position="bottom-end" offset={6} width={220}>
			<Menu.Target>
				<UnstyledButton className={classes.trigger} aria-label="Open profile menu">
					<Avatar size={24} radius="xl" color="brand">
						{initials}
					</Avatar>
					<Text fz="sm" fw={500} visibleFrom="xs">
						{name}
					</Text>
					<LuChevronDown size={14} className={classes.chevron} />
				</UnstyledButton>
			</Menu.Target>

			<Menu.Dropdown>
				<div className={classes.header}>
					<Avatar size={36} radius="xl" color="brand">
						{initials}
					</Avatar>
					<div>
						<Text fz="sm" fw={600}>
							{name}
						</Text>
						<Text fz="xs" c="dimmed">
							{role}
						</Text>
					</div>
				</div>
				<Menu.Divider />
				<Menu.Item leftSection={<LuSettings size={16} />} onClick={() => navigate('/app/settings')}>
					Settings
				</Menu.Item>
				<Menu.Item color="red" leftSection={<LuLogOut size={16} />} onClick={handleLogout}>
					Logout
				</Menu.Item>
				<Menu.Divider />
				<Text className={classes.version} fz="xs" c="dimmed">
					{APP_VERSION_LABEL}
				</Text>
			</Menu.Dropdown>
		</Menu>
	);
};
