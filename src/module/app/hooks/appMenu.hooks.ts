import { useMemo } from 'react';

import { menuConfig } from '@config/menu.config';

import { useAuthorization, type Authorization, type AuthorizationStatus } from '@core/auth/authorization';

import type { MenuConfig, MenuItem } from '@common/types/MenuItem';

// A parent whose children are all denied is hidden too, so no empty submenu is left behind.
const filterMenuItems = (items: MenuItem[], authorization: Authorization): MenuItem[] =>
	items.flatMap((item) => {
		if (item.permission && !authorization.evaluate(item.permission)) return [];
		if (!item.children?.length) return [item];

		const children = filterMenuItems(item.children, authorization);
		return children.length ? [{ ...item, children }] : [];
	});

const findFirstPath = (items: MenuItem[]): string | null => {
	for (const item of items) {
		if (item.to) return item.to;
		const nested = item.children ? findFirstPath(item.children) : null;
		if (nested) return nested;
	}
	return null;
};

export interface AllowedMenu {
	menu: MenuConfig;
	/** First top entry the caller can open, or null when nothing is allowed. */
	homePath: string | null;
	status: AuthorizationStatus;
	refetch: () => void;
}

/** The menu filtered by the caller's permissions; gated entries stay hidden while /auth/me loads. */
export const useAllowedMenu = (): AllowedMenu => {
	const { authorization, status, refetch } = useAuthorization();

	return useMemo(() => {
		const top = filterMenuItems(menuConfig.top, authorization);
		const bottom = filterMenuItems(menuConfig.bottom, authorization);
		return { menu: { top, bottom }, homePath: findFirstPath(top), status, refetch };
	}, [authorization, status, refetch]);
};
