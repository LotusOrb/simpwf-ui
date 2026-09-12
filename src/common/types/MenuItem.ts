import type { IconType } from 'react-icons';

export type MenuItem = {
	id: string;
	label: string;
	icon?: IconType;
	to?: string;
	children?: MenuItem[];
};

export type MenuConfig = {
	top: MenuItem[];
	bottom: MenuItem[];
};
