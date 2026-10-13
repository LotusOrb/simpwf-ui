import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { NodeDefinitionDetailPage } from './pages/NodeDefinitionDetailPage';
import { NodeDefinitionListPage } from './pages/NodeDefinitionListPage';

// Writes (new, new version, delete) are hidden in the pages without definitions:write.
export const nodeDefinitionRoutes: RouteObject = {
	path: 'node-definition',
	element: createElement(RequirePermission, { rule: Permission.DefinitionsRead }),
	children: [
		{ index: true, Component: NodeDefinitionListPage },
		{ path: ':id', Component: NodeDefinitionDetailPage },
	],
};
