import type { IconType } from 'react-icons';
import { LuCircleCheck, LuCircleX, LuInfo, LuTriangleAlert } from 'react-icons/lu';

import type { NotificationLevel } from '@module/notification/types/AppNotification';

export const NOTIFICATION_LIMIT = 50;

export const NOTIFICATION_LEVEL: Record<NotificationLevel, { color: string; icon: IconType }> = {
	success: { color: 'green', icon: LuCircleCheck },
	error: { color: 'red', icon: LuCircleX },
	info: { color: 'blue', icon: LuInfo },
	warning: { color: 'yellow', icon: LuTriangleAlert },
};
