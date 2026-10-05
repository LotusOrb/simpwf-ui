import { createElement } from 'react';

import { NuqsAdapter } from 'nuqs/adapters/react-router/v8';
import { createBrowserRouter, Navigate, Outlet } from 'react-router';

import { authRoutes } from '@core/auth/auth.routes';
import { RequireAuth } from '@core/auth/components/AuthGuard';

import { NotFound } from '@common/component/NotFound';

import { AppIndexRedirect } from '@module/app/components/AppIndexRedirect';
import { MainLayout } from '@module/app/components/AppMainLayout';
import { dashboardRoutes } from '@module/dashboard/dashboard.routes';
import { secretRoutes } from '@module/secret/secret.routes';
import { settingsRoutes } from '@module/settings/settings.routes';
import { workflowDefinitionRoutes } from '@module/workflow-definition/workflow-definition.routes';
import { workflowRunRoutes } from '@module/workflow-run/workflow-run.routes';

export const routesConfig = createBrowserRouter([
	{
		Component: () => createElement(NuqsAdapter, null, createElement(Outlet)),
		children: [
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
								Component: AppIndexRedirect,
							},
							dashboardRoutes,
							workflowDefinitionRoutes,
							workflowRunRoutes,
							secretRoutes,
							settingsRoutes,
							{
								path: '*',
								Component: () => NotFound({ homePath: '/app', fullHeight: false }),
							},
						],
					},
				],
			},
			{
				path: '*',
				Component: NotFound,
			},
		],
	},
]);
