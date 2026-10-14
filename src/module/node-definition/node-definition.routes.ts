import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { NodeDefinitionDetailPage } from './pages/NodeDefinitionDetailPage';
import { NodeDefinitionListPage } from './pages/NodeDefinitionListPage';

// Writes (new version, delete) are hidden in the pages without definitions:write.
export const nodeDefinitionRoutes: RouteObject = {
	path: 'node-definition',
	element: createElement(RequirePermission, { rule: Permission.DefinitionsRead }),
	children: [
		{ index: true, Component: NodeDefinitionListPage },
		{
			path: 'new',
			element: createElement(RequirePermission, { rule: Permission.DefinitionsWrite }),
			children: [{ index: true, Component: NodeDefinitionDetailPage }],
		},
		// Opens without definitions:write as a view-only editor.
		{ path: ':id', Component: NodeDefinitionDetailPage },
	],
};
