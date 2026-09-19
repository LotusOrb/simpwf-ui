import { createBrowserRouter, Navigate } from 'react-router';

import { authRoutes } from '@core/auth/auth.routes';
import { RequireAuth } from '@core/auth/components/AuthGuard';

import { MainLayout } from '@module/app/components/AppMainLayout';
import { dashboardRoutes } from '@module/dashboard/dashboard.routes';
import { workflowDefinitionRoutes } from '@module/workflow-definition/workflow-definition.routes';
import { workflowRunRoutes } from '@module/workflow-run/workflow-run.routes';

export const routesConfig = createBrowserRouter([
	{
		path: '/',
		Component: () => Navigate({ to: 'auth' }),
	},
	authRoutes,
	{
		path: 'app',
		Component: RequireAuth,
		children: [
			{
				Component: MainLayout,
				children: [
					{
						index: true,
						Component: () => Navigate({ to: 'dashboard', replace: true }),
					},
					dashboardRoutes,
					workflowDefinitionRoutes,
					workflowRunRoutes,
				],
			},
		],
	},
]);
