import type { IconType } from 'react-icons';

import type { PermissionRule } from '@core/auth/authorization';

export type MenuItem = {
	id: string;
	label: string;
	icon?: IconType;
	to?: string;
	permission?: PermissionRule;
	children?: MenuItem[];
};

export type MenuConfig = {
	top: MenuItem[];
	bottom: MenuItem[];
};
