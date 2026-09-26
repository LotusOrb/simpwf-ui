import { LuHouse, LuKeyRound, LuPlay, LuSettings, LuWorkflow } from 'react-icons/lu';

import type { MenuConfig } from '@common/types/MenuItem';

export const menuConfig: MenuConfig = {
	top: [
		{ id: 'dashboard', label: 'Dashboard', icon: LuHouse, to: '/app/dashboard' },
		{ id: 'workflow-definition', label: 'Workflow Definition', icon: LuWorkflow, to: '/app/workflow-definition' },
		{ id: 'workflow-run', label: 'Workflow Run', icon: LuPlay, to: '/app/workflow-run' },
		{ id: 'secret', label: 'Secrets', icon: LuKeyRound, to: '/app/secret' },
	],
	bottom: [{ id: 'settings', label: 'Settings', icon: LuSettings, to: '/app/settings' }],
};
