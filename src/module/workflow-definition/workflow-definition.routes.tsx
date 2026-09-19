import type { RouteObject } from 'react-router';

import { WorkflowDefinitionEditorPage } from './pages/WorkflowDefinitionEditorPage';
import { WorkflowDefinitionListPage } from './pages/WorkflowDefinitionListPage';

export const workflowDefinitionRoutes: RouteObject = {
	path: 'workflow-definition',
	children: [
		{ index: true, Component: WorkflowDefinitionListPage },
		{ path: 'new', Component: WorkflowDefinitionEditorPage },
		{ path: ':id', Component: WorkflowDefinitionEditorPage },
	],
};
