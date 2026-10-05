import { useMemo } from 'react';

import { useGetMeQuery } from '@core/auth/hooks';
import { selectIsAnonymous, selectIsAuthenticated } from '@core/auth/store';
import { useCoreSelector } from '@core/store';

import { Authorization, type PermissionRule } from './authorization';

export type AuthorizationStatus = 'loading' | 'ready' | 'error';

export interface AuthorizationState {
	authorization: Authorization;
	status: AuthorizationStatus;
	refetch: () => void;
}

const ALLOW_ALL = Authorization.allowAll();
const DENY_ALL = Authorization.denyAll();

export const useAuthorization = (): AuthorizationState => {
	const isAnonymous = useCoreSelector(selectIsAnonymous);
	const isAuthenticated = useCoreSelector(selectIsAuthenticated);
	// An engine with auth disabled has no gate to mirror, so /auth/me is skipped.
	const skip = isAnonymous || !isAuthenticated;
	const { data: me, isError, refetch } = useGetMeQuery(undefined, { skip });

	const authorization = useMemo(() => (me ? Authorization.fromMe(me) : null), [me]);

	return useMemo(() => {
		if (isAnonymous) return { authorization: ALLOW_ALL, status: 'ready', refetch: () => undefined };
		if (!isAuthenticated) return { authorization: DENY_ALL, status: 'ready', refetch: () => undefined };
		// A failed background refetch keeps the last known permissions rather than blanking the UI.
		if (authorization) return { authorization, status: 'ready', refetch };
		return { authorization: DENY_ALL, status: isError ? 'error' : 'loading', refetch };
	}, [isAnonymous, isAuthenticated, authorization, isError, refetch]);
};

export const useCan = (rule: PermissionRule): boolean => {
	const { authorization } = useAuthorization();
	return authorization.evaluate(rule);
};
