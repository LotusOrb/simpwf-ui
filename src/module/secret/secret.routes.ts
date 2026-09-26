import type { RouteObject } from 'react-router';

import { SecretListPage } from './pages/SecretListPage';

export const secretRoutes: RouteObject = {
	path: 'secret',
	children: [{ index: true, Component: SecretListPage }],
};
