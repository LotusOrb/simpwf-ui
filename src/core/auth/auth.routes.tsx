import React from 'react';

import { Navigate, type RouteObject } from 'react-router';

import { RequireGuest } from './components/AuthGuard';
import { LoginPage } from './pages/LoginPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';

export const authRoutes: RouteObject = {
	path: 'auth',
	children: [
		{
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
		},
		// Kept outside the guest guard: the guard would redirect to /app as soon as the session lands, before the
		// callback can send the user to the page they started from.
		{
			path: 'callback',
			Component: OAuthCallbackPage,
		},
	],
};
