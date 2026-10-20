import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { FormBuilderPage } from './pages/FormBuilderPage';
import { FormListPage } from './pages/FormListPage';

// Writes (new, edit, duplicate, delete) are hidden in the pages without forms:write.
export const formEngineRoutes: RouteObject = {
	path: 'form',
	element: createElement(RequirePermission, { rule: Permission.FormsRead }),
	children: [
		{ index: true, Component: FormListPage },
		{
			path: 'new',
			element: createElement(RequirePermission, { rule: Permission.FormsWrite }),
			children: [{ index: true, Component: FormBuilderPage }],
		},
		// Opens without forms:write as a view-only builder.
		{ path: ':id', Component: FormBuilderPage },
	],
};
