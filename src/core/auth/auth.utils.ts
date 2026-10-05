import { AUTH_HOME_PATH } from './auth.constants';

// Only in-app paths are accepted, so a crafted login link cannot bounce the user to another site after login.
export const sanitizeReturnTo = (value: unknown): string => {
	if (typeof value !== 'string') return AUTH_HOME_PATH;
	if (
		value !== AUTH_HOME_PATH &&
		!value.startsWith(`${AUTH_HOME_PATH}/`) &&
		!value.startsWith(`${AUTH_HOME_PATH}?`)
	) {
		return AUTH_HOME_PATH;
	}
	return value;
};

export const readReturnTo = (locationState: unknown) =>
	sanitizeReturnTo((locationState as { from?: unknown } | null)?.from);
