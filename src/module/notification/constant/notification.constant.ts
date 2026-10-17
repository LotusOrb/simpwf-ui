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

/** Watched runs are dropped after this even if they never settle. */
export const RUN_WATCH_TTL_MS = 24 * 60 * 60 * 1000;

/** Browsers allow 6 connections per origin over HTTP/1.1; the rest stay free for API calls. */
export const RUN_STREAM_LIMIT = 4;

/** Baseline for a run watched from its start, so the very first snapshot can already notify. */
export const RUN_WATCH_STARTED_KEY = 'started';
