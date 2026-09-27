import type { IconType } from 'react-icons';

export interface SettingsMenuItem {
	id: string;
	label: string;
	description: string;
	icon: IconType;
	to: string;
}
