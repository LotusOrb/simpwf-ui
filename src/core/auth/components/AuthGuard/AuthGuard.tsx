import React from 'react';

import { Navigate, Outlet } from 'react-router';

import { selectIsAuthenticated } from '@core/auth/store';
import { useCoreSelector } from '@core/store';

export const RequireAuth: React.FC = () => {
	const isAuthenticated = useCoreSelector(selectIsAuthenticated);
	return isAuthenticated ? <Outlet /> : <Navigate to="/auth/login" replace />;
};

export const RequireGuest: React.FC = () => {
	const isAuthenticated = useCoreSelector(selectIsAuthenticated);
	return isAuthenticated ? <Navigate to="/app" replace /> : <Outlet />;
};
