import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { RoleListPage } from './pages/RoleListPage';

/** Mounted under settings, so the path is relative to `/app/settings`. */
export const roleRoutes: RouteObject = {
	path: 'roles',
	element: createElement(RequirePermission, { rule: Permission.RolesRead }),
	children: [{ index: true, Component: RoleListPage }],
};
