import type { RouteObject } from 'react-router';

import { WorkflowRunListPage } from './pages/WorkflowRunListPage';

export const workflowRunRoutes: RouteObject = {
	path: 'workflow-run',
	Component: WorkflowRunListPage,
};
