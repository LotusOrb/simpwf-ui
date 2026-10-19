import type { CronPreset } from '@module/schedule/types/CronPreset';

export const SCHEDULE_ROUTE = '/app/schedule';

/** Opens the create form prefilled with this definition id, e.g. from the workflow definition editor. */
export const SCHEDULE_CREATE_PARAM = 'new';

export const SCHEDULE_PREVIEW_COUNT = 5;

/** `explain` on a replace error whose delete went through: the old schedule is gone. */
export const SCHEDULE_REPLACE_REMOVED = 'Schedule removed';

export const CRON_PRESETS: CronPreset[] = [
	{ label: 'Every 5 minutes', crontab: '*/5 * * * *' },
	{ label: 'Hourly', crontab: '0 * * * *' },
	{ label: 'Daily at 09:00', crontab: '0 9 * * *' },
	{ label: 'Weekdays at 09:00', crontab: '0 9 * * 1-5' },
	{ label: 'Weekly, Monday 09:00', crontab: '0 9 * * 1' },
	{ label: 'Monthly, 1st at 00:00', crontab: '0 0 1 * *' },
	{ label: 'Every 30 minutes (interval)', crontab: '@every 30m' },
];

/** Every IANA zone the browser knows, with UTC first since it is the engine default. */
export const TIMEZONE_OPTIONS: string[] = (() => {
	const zones = typeof Intl.supportedValuesOf === 'function' ? Intl.supportedValuesOf('timeZone') : [];
	return ['UTC', ...zones.filter((zone) => zone !== 'UTC')];
})();
