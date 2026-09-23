import type { DashboardStatKey } from './DashboardStatKey';

export type DashboardStatTrend = 'up' | 'down' | 'flat';

export interface DashboardStat {
	id: DashboardStatKey;
	label: string;
	value: string;
	/** Formatted change vs the previous window; `null` when there is nothing to compare against. */
	delta: string | null;
	trend: DashboardStatTrend;
	upIsGood: boolean;
}
