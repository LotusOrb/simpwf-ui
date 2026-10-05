import React from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { WorkflowDefinitionEditorPage } from './pages/WorkflowDefinitionEditorPage';
import { WorkflowDefinitionListPage } from './pages/WorkflowDefinitionListPage';

export const workflowDefinitionRoutes: RouteObject = {
	path: 'workflow-definition',
	element: <RequirePermission rule={Permission.DefinitionsRead} />,
	children: [
		{ index: true, Component: WorkflowDefinitionListPage },
		{
			path: 'new',
			element: <RequirePermission rule={Permission.DefinitionsWrite} />,
			children: [{ index: true, Component: WorkflowDefinitionEditorPage }],
		},
		// Opens without definitions:write as a view-only editor.
		{ path: ':id', Component: WorkflowDefinitionEditorPage },
	],
};
