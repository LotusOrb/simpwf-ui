import type { DashboardRunsPerDay } from './DashboardRunsPerDay';

export interface DashboardStatistics {
	total_runs: number;
	finished_runs: number;
	failed_runs: number;
	stopped_runs: number;
	terminal_runs: number;
	active_runs: number;
	/** Fraction of terminal runs that finished, 0–1; `null` when the window has no terminal runs. */
	success_rate: number | null;
	/** `null` when the window has no terminal runs. */
	average_duration_ms: number | null;
	runs_per_day: DashboardRunsPerDay[];
}
