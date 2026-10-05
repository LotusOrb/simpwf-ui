import { useNavigate } from 'react-router';

import { coreApi } from '@core/api';
import { authApi } from '@core/auth/api';
import { AUTH_LOGIN_PATH } from '@core/auth/auth.constants';
import { buildOAuthLogoutUrl } from '@core/auth/oauth';
import { clearSession } from '@core/auth/store';
import { useCoreDispatch, useCoreStore } from '@core/store';

export const { useGetAuthConfigQuery, useGetMeQuery, useVerifyApiTokenMutation } = authApi;

export const useLogout = () => {
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const store = useCoreStore();

	return async () => {
		const { method, idToken } = store.getState().auth;
		// The provider URL is built before the session is cleared, since it needs the id token as a hint.
		const providerLogoutUrl = method === 'oauth' ? await buildOAuthLogoutUrl(idToken).catch(() => null) : null;

		dispatch(clearSession());
		dispatch(coreApi.util.resetApiState());

		if (providerLogoutUrl) window.location.assign(providerLogoutUrl);
		else navigate(AUTH_LOGIN_PATH, { replace: true });
	};
};
