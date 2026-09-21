import type { RouteObject } from 'react-router';

import { WorkflowRunDetailPage } from './pages/WorkflowRunDetailPage';
import { WorkflowRunListPage } from './pages/WorkflowRunListPage';

export const workflowRunRoutes: RouteObject = {
	path: 'workflow-run',
	children: [
		{ index: true, Component: WorkflowRunListPage },
		{ path: ':id', Component: WorkflowRunDetailPage },
	],
};
