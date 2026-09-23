import dayjs, { type Dayjs } from 'dayjs';

import {
	DASHBOARD_CHART_DATE_FORMAT,
	DASHBOARD_DATE_FORMAT,
	DASHBOARD_DEFAULT_RANGE_DAYS,
} from '@module/dashboard/constant/dashboard.constant';
import { dashboardStatDefinitions } from '@module/dashboard/constant/dashboardStat.constant';
import type { DashboardDateRange } from '@module/dashboard/types/DashboardDateRange';
import type { DashboardRunsPoint } from '@module/dashboard/types/DashboardRunsPoint';
import type { DashboardStat } from '@module/dashboard/types/DashboardStat';
import type { DashboardStatistics } from '@module/dashboard/types/DashboardStatistics';
import type { DashboardStatisticsQuery } from '@module/dashboard/types/DashboardStatisticsQuery';

import { useGetStatisticsQuery } from './dashboard.hooks';

export const getRecentDaysRange = (days: number = DASHBOARD_DEFAULT_RANGE_DAYS): DashboardDateRange => {
	const today = dayjs();
	return [today.subtract(days - 1, 'day').format(DASHBOARD_DATE_FORMAT), today.format(DASHBOARD_DATE_FORMAT)];
};

const toStatisticsQuery = (from: Dayjs, to: Dayjs): DashboardStatisticsQuery => ({
	filter: {
		created_from: { op: '_eq', value: from.startOf('day').format() },
		created_to: { op: '_eq', value: to.endOf('day').format() },
	},
	order: { by: 'date', direction: 'asc' },
});

const toStats = (current?: DashboardStatistics, previous?: DashboardStatistics): DashboardStat[] =>
	dashboardStatDefinitions.map((definition) => {
		const value = current ? definition.getValue(current) : null;
		const previousValue = previous ? definition.getValue(previous) : null;

		let change: number | null = null;
		if (value !== null && previousValue !== null) {
			if (definition.deltaMode === 'absolute') change = value - previousValue;
			else if (previousValue !== 0) change = ((value - previousValue) / previousValue) * 100;
		}

		return {
			id: definition.id,
			label: definition.label,
			upIsGood: definition.upIsGood,
			value: value === null ? '—' : definition.format(value),
			delta: change === null ? null : definition.formatDelta(change),
			trend: change === null || Math.abs(change) < 0.05 ? 'flat' : change > 0 ? 'up' : 'down',
		};
	});

/** One point per day of the range; the API only returns days that had runs. */
const toSeries = (from: Dayjs, days: number, stats?: DashboardStatistics): DashboardRunsPoint[] => {
	const byDate = new Map((stats?.runs_per_day ?? []).map((day) => [day.date, day]));

	return Array.from({ length: days }, (_, index) => {
		const date = from.add(index, 'day');
		const key = date.format(DASHBOARD_DATE_FORMAT);
		const day = byDate.get(key);
		return {
			date: key,
			label: date.format(DASHBOARD_CHART_DATE_FORMAT),
			total: day?.total_runs ?? 0,
			finished: day?.finished_runs ?? 0,
			failed: day?.failed_runs ?? 0,
			stopped: day?.stopped_runs ?? 0,
		};
	});
};

export interface DashboardOverviewState {
	stats: DashboardStat[];
	series: DashboardRunsPoint[];
	/** Number of days in the selected range, inclusive. */
	days: number;
	comparisonLabel: string;
	isLoading: boolean;
	isFetching: boolean;
	isError: boolean;
	refetch: () => void;
}

/** Statistics for the selected range plus the same-length window right before it, for the deltas. */
export const useDashboardOverview = ([start, end]: DashboardDateRange): DashboardOverviewState => {
	const from = dayjs(start);
	const to = dayjs(end);
	const days = to.diff(from, 'day') + 1;
	const previousTo = from.subtract(1, 'day');
	const previousFrom = previousTo.subtract(days - 1, 'day');

	const current = useGetStatisticsQuery(toStatisticsQuery(from, to));
	const previous = useGetStatisticsQuery(toStatisticsQuery(previousFrom, previousTo));

	return {
		stats: toStats(current.data, previous.data),
		series: toSeries(from, days, current.data),
		days,
		comparisonLabel: days === 1 ? 'vs previous day' : `vs previous ${days} days`,
		isLoading: current.isLoading || previous.isLoading,
		isFetching: current.isFetching || previous.isFetching,
		isError: current.isError,
		refetch: () => {
			void current.refetch();
			void previous.refetch();
		},
	};
};
