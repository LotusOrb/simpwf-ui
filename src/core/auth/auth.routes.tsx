import React from 'react';

import { Navigate, type RouteObject } from 'react-router';

import { RequireGuest } from './components/AuthGuard';
import { LoginPage } from './pages/LoginPage';

export const authRoutes: RouteObject = {
	path: 'auth',
	Component: RequireGuest,
	children: [
		{
			index: true,
			Component: () => <Navigate to={'login'} />,
		},
		{
			path: 'login',
			Component: LoginPage,
		},
	],
};
