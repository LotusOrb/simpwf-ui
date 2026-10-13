import type { Schedule } from './Schedule';

export interface ScheduleList {
	items: Schedule[];
	page: number;
	per_page: number;
	total: number;
	total_pages: number;
}
