import React from 'react';

import { Navigate, Outlet, useLocation } from 'react-router';

import { AUTH_LOGIN_PATH } from '@core/auth/auth.constants';
import { readReturnTo } from '@core/auth/auth.utils';
import { selectIsAuthenticated } from '@core/auth/store';
import { useCoreSelector } from '@core/store';

export const RequireAuth: React.FC = () => {
	const isAuthenticated = useCoreSelector(selectIsAuthenticated);
	const location = useLocation();

	// The current path rides along so login can bring the user back to it.
	return isAuthenticated ? (
		<Outlet />
	) : (
		<Navigate to={AUTH_LOGIN_PATH} replace state={{ from: `${location.pathname}${location.search}` }} />
	);
};

export const RequireGuest: React.FC = () => {
	const isAuthenticated = useCoreSelector(selectIsAuthenticated);
	const location = useLocation();

	return isAuthenticated ? <Navigate to={readReturnTo(location.state)} replace /> : <Outlet />;
};
