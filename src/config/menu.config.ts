import { LuHouse, LuKeyRound, LuPlay, LuSettings, LuWorkflow } from 'react-icons/lu';

import { Permission } from '@core/auth/authorization/permission';

import type { MenuConfig } from '@common/types/MenuItem';

export const menuConfig: MenuConfig = {
	top: [
		{
			id: 'dashboard',
			label: 'Dashboard',
			icon: LuHouse,
			to: '/app/dashboard',
			permission: Permission.StatisticsRead,
		},
		{
			id: 'workflow-definition',
			label: 'Workflow Definition',
			icon: LuWorkflow,
			to: '/app/workflow-definition',
			permission: Permission.DefinitionsRead,
		},
		{
			id: 'workflow-run',
			label: 'Workflow Run',
			icon: LuPlay,
			to: '/app/workflow-run',
			permission: Permission.InstancesRead,
		},
		{ id: 'secret', label: 'Secrets', icon: LuKeyRound, to: '/app/secret', permission: Permission.SecretsRead },
	],
	bottom: [{ id: 'settings', label: 'Settings', icon: LuSettings, to: '/app/settings' }],
};
