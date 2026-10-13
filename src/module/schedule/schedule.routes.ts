import { createElement } from 'react';

import type { RouteObject } from 'react-router';

import { Permission, RequirePermission } from '@core/auth/authorization';

import { ScheduleListPage } from './pages/ScheduleListPage';

export const scheduleRoutes: RouteObject = {
	path: 'schedule',
	element: createElement(RequirePermission, { rule: Permission.SchedulesRead }),
	children: [{ index: true, Component: ScheduleListPage }],
};
