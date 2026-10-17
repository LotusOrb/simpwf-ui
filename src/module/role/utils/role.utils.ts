import { Permission, WILDCARD_PERMISSION } from '@core/auth/authorization';

const KNOWN_PERMISSIONS = new Set<string>(Object.values(Permission));

export const isKnownPermission = (value: string): value is Permission => KNOWN_PERMISSIONS.has(value);

/**
 * Permissions the backend returned that this UI does not know. The wildcard is a known spelling of the
 * bypass, not drift, so it is left out.
 */
export const unrecognizedPermissions = (permissions: string[]): string[] =>
	[...new Set(permissions)].filter((value) => value !== WILDCARD_PERMISSION && !isKnownPermission(value)).sort();

export const hasWildcard = (permissions: string[]) => permissions.includes(WILDCARD_PERMISSION);
