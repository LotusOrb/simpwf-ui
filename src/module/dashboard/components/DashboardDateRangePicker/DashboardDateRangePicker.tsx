import React, { useState } from 'react';

import { DatePickerInput, type DatesRangeValue } from '@mantine/dates';
import dayjs from 'dayjs';
import { LuCalendar } from 'react-icons/lu';

import {
	DASHBOARD_DATE_FORMAT,
	DASHBOARD_RANGE_LABEL_FORMAT,
	DASHBOARD_RANGE_PRESETS,
} from '@module/dashboard/constant/dashboard.constant';
import { getRecentDaysRange } from '@module/dashboard/hooks';
import type { DashboardDateRange } from '@module/dashboard/types/DashboardDateRange';

interface DashboardDateRangePickerProps {
	value: DashboardDateRange;
	onChange: (value: DashboardDateRange) => void;
}

export const DashboardDateRangePicker: React.FC<DashboardDateRangePickerProps> = ({ value, onChange }) => {
	// Picking a range emits `[start, null]` first; only a complete range reaches the dashboard.
	const [draft, setDraft] = useState<DatesRangeValue<string> | null>(null);

	const handleChange = (next: DatesRangeValue<string>) => {
		const [start, end] = next;
		// Clearing resets to the default range; the dashboard always needs one.
		if (!start && !end) {
			setDraft(null);
			onChange(getRecentDaysRange());
		} else if (start && end) {
			setDraft(null);
			onChange([start, end]);
		} else {
			setDraft(next);
		}
	};

	return (
		<DatePickerInput
			type="range"
			aria-label="Date range"
			value={draft ?? value}
			onChange={handleChange}
			onDropdownClose={() => setDraft(null)}
			allowSingleDateInRange
			clearable
			maxDate={dayjs().format(DASHBOARD_DATE_FORMAT)}
			valueFormat={DASHBOARD_RANGE_LABEL_FORMAT}
			leftSection={<LuCalendar size={16} />}
			presets={DASHBOARD_RANGE_PRESETS.map((preset) => ({
				label: preset.label,
				value: getRecentDaysRange(preset.days),
			}))}
			miw={240}
		/>
	);
};
