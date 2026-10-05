import React from 'react';

import { Navigate } from 'react-router';

import { AuthorizationError, AuthorizationLoading } from '@core/auth/authorization';

import { Forbidden } from '@common/component/Forbidden';

import { useAllowedMenu } from '@module/app/hooks';

/** Lands on the first menu entry the caller can open, so a missing statistics:read never starts on a 403. */
export const AppIndexRedirect: React.FC = () => {
	const { homePath, status, refetch } = useAllowedMenu();

	if (status === 'loading') return <AuthorizationLoading />;
	if (status === 'error') return <AuthorizationError onRetry={refetch} />;
	return homePath ? <Navigate to={homePath} replace /> : <Forbidden showHomeLink={false} />;
};
