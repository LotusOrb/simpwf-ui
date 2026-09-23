import type { DashboardStatistics } from '@module/dashboard/types/DashboardStatistics';
import type { DashboardStatKey } from '@module/dashboard/types/DashboardStatKey';

export interface DashboardStatDefinition {
	id: DashboardStatKey;
	label: string;
	upIsGood: boolean;
	/** `relative` compares as % change; `absolute` as the plain difference (e.g. percentage points). */
	deltaMode: 'relative' | 'absolute';
	/** `null` when the window has nothing to measure (e.g. no finished runs for a rate). */
	getValue: (stats: DashboardStatistics) => number | null;
	format: (value: number) => string;
	formatDelta: (delta: number) => string;
}

const formatPercentDelta = (delta: number) => `${Math.abs(delta).toFixed(1)}%`;

export const formatStatDuration = (ms: number): string => {
	if (ms < 1000) return `${Math.round(ms)}ms`;
	const seconds = ms / 1000;
	if (seconds < 60) return `${seconds.toFixed(1)}s`;
	const minutes = Math.floor(seconds / 60);
	if (minutes < 60) return `${minutes}m ${Math.round(seconds % 60)}s`;
	const hours = Math.floor(minutes / 60);
	if (hours < 24) return `${hours}h ${minutes % 60}m`;
	return `${Math.floor(hours / 24)}d ${hours % 24}h`;
};

export const dashboardStatDefinitions: DashboardStatDefinition[] = [
	{
		id: 'total',
		label: 'Total runs',
		upIsGood: true,
		deltaMode: 'relative',
		getValue: (stats) => stats.total_runs,
		format: (value) => value.toLocaleString(),
		formatDelta: formatPercentDelta,
	},
	{
		id: 'success',
		label: 'Success rate',
		upIsGood: true,
		deltaMode: 'absolute',
		getValue: (stats) => (stats.success_rate === null ? null : stats.success_rate * 100),
		format: (value) => `${value.toFixed(1)}%`,
		formatDelta: (delta) => `${Math.abs(delta).toFixed(1)} pts`,
	},
	{
		id: 'duration',
		label: 'Avg. duration',
		upIsGood: false,
		deltaMode: 'relative',
		getValue: (stats) => stats.average_duration_ms,
		format: formatStatDuration,
		formatDelta: formatPercentDelta,
	},
	{
		id: 'failed',
		label: 'Failed runs',
		upIsGood: false,
		deltaMode: 'relative',
		getValue: (stats) => stats.failed_runs,
		format: (value) => value.toLocaleString(),
		formatDelta: formatPercentDelta,
	},
];
