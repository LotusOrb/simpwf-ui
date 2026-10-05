import { Navigate, type RouteObject } from 'react-router';

import { PreferencePage } from './pages/PreferencePage';
import { SettingsLayoutPage } from './pages/SettingsLayoutPage';

export const settingsRoutes: RouteObject = {
	path: 'settings',
	Component: SettingsLayoutPage,
	children: [
		{ index: true, Component: () => Navigate({ to: 'preference', replace: true }) },
		{ path: 'preference', Component: PreferencePage },
	],
};
