import React from 'react';

import { Avatar, Menu, Text, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuLogOut, LuSettings } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { useGetMeQuery, useLogout } from '@core/auth/hooks';
import { selectIsAnonymous } from '@core/auth/store';
import type { AuthMe } from '@core/auth/types/AuthMe';
import { useCoreSelector } from '@core/store';

import classes from './AppProfileMenu.module.scss';

const APP_VERSION_LABEL = __APP_VERSION__ === 'dev' ? 'dev' : `v${__APP_VERSION__}`;

const describeRole = (me?: AuthMe) => {
	if (!me) return '';
	if (me.service) return 'Service account';
	return me.roles?.length ? me.roles.join(', ') : 'No role';
};

export const AppProfileMenu: React.FC = () => {
	const navigate = useNavigate();
	const logout = useLogout();
	const isAnonymous = useCoreSelector(selectIsAnonymous);
	const { data: me } = useGetMeQuery(undefined, { skip: isAnonymous });
	const name = isAnonymous ? 'Guest' : me?.name || me?.email || me?.subject || 'User';
	const role = isAnonymous ? 'Open access' : describeRole(me);
	const initials = name
		.split(' ')
		.map((part) => part.charAt(0))
		.join('')
		.slice(0, 2)
		.toUpperCase();

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
				<Menu.Item color="red" leftSection={<LuLogOut size={16} />} onClick={logout}>
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
