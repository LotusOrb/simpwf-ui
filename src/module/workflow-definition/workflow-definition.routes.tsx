import type { RouteObject } from 'react-router';

import { WorkflowDefinitionListPage } from './pages/WorkflowDefinitionListPage';

export const workflowDefinitionRoutes: RouteObject = {
	path: 'workflow-definition',
	Component: WorkflowDefinitionListPage,
};
