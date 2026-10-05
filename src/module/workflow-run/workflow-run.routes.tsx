import React from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { WorkflowRunDetailPage } from './pages/WorkflowRunDetailPage';
import { WorkflowRunListPage } from './pages/WorkflowRunListPage';

export const workflowRunRoutes: RouteObject = {
	path: 'workflow-run',
	element: <RequirePermission rule={Permission.InstancesRead} />,
	children: [
		{ index: true, Component: WorkflowRunListPage },
		{ path: ':id', Component: WorkflowRunDetailPage },
	],
};
