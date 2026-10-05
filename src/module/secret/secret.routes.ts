import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { SecretListPage } from './pages/SecretListPage';

export const secretRoutes: RouteObject = {
	path: 'secret',
	element: createElement(RequirePermission, { rule: Permission.SecretsRead }),
	children: [{ index: true, Component: SecretListPage }],
};
