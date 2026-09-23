export const DASHBOARD_DEFAULT_RANGE_DAYS = 14;

export const DASHBOARD_RECENT_RUNS_LIMIT = 4;

/** Value format of Mantine date pickers and of `runs_per_day[].date`. */
export const DASHBOARD_DATE_FORMAT = 'YYYY-MM-DD';

export const DASHBOARD_CHART_DATE_FORMAT = 'MMM D';

export const DASHBOARD_RANGE_LABEL_FORMAT = 'MMM D, YYYY';

export const DASHBOARD_RUN_TIME_FORMAT = 'DD MMM HH:mm';

/** Preset ranges offered by the date picker, in days ending today. */
export const DASHBOARD_RANGE_PRESETS = [
	{ label: 'Today', days: 1 },
	{ label: 'Last 7 days', days: 7 },
	{ label: 'Last 14 days', days: 14 },
	{ label: 'Last 30 days', days: 30 },
] as const;
