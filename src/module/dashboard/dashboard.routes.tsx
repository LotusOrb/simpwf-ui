import React from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { DashboardPage } from './pages/DashboardPage';

export const dashboardRoutes: RouteObject = {
	path: 'dashboard',
	element: <RequirePermission rule={Permission.StatisticsRead} />,
	children: [{ index: true, Component: DashboardPage }],
};
