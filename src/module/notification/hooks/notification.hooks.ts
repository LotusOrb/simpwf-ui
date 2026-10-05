import React, { useCallback, useMemo } from 'react';

import { notifications } from '@mantine/notifications';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { NOTIFICATION_LEVEL } from '@module/notification/data';
import {
	notificationAdded,
	notificationDismissed,
	notificationRead,
	notificationsAllRead,
	notificationsCleared,
	selectNotifications,
	selectUnreadNotificationCount,
} from '@module/notification/store';
import type { NotificationLevel } from '@module/notification/types/AppNotification';
import type { NotifyOptions } from '@module/notification/types/NotifyOptions';

/** Publishes a notification: shows a toast and records it in the notification list. */
export const useNotify = () => {
	const dispatch = useCoreDispatch();
	return useMemo(() => {
		const publish =
			(level: NotificationLevel) =>
			({ title, message, link, toastOnly, autoClose }: NotifyOptions) => {
				const { color, icon: Icon } = NOTIFICATION_LEVEL[level];
				notifications.show({ color, icon: React.createElement(Icon, { size: 18 }), title, message, autoClose });
				if (toastOnly) return;
				dispatch(
					notificationAdded({
						id: crypto.randomUUID(),
						level,
						title,
						message,
						link,
						createdAt: Date.now(),
						read: false,
					}),
				);
			};
		return {
			success: publish('success'),
			error: publish('error'),
			info: publish('info'),
			warning: publish('warning'),
		};
	}, [dispatch]);
};

/** The recorded notifications, newest first, and the actions on them. */
export const useNotificationList = () => {
	const dispatch = useCoreDispatch();
	const items = useCoreSelector(selectNotifications);
	const read = useCallback((id: string) => dispatch(notificationRead(id)), [dispatch]);
	const readAll = useCallback(() => dispatch(notificationsAllRead()), [dispatch]);
	const dismiss = useCallback((id: string) => dispatch(notificationDismissed(id)), [dispatch]);
	const clear = useCallback(() => dispatch(notificationsCleared()), [dispatch]);
	return { items, read, readAll, dismiss, clear };
};

export const useUnreadNotificationCount = () => useCoreSelector(selectUnreadNotificationCount);
