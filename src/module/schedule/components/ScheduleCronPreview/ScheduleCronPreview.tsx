import React from 'react';

import { Group, List, Stack, Text } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuCalendarClock } from 'react-icons/lu';

import { analyzeCrontab, formatInZone, SCHEDULE_PREVIEW_COUNT } from '@module/schedule/data';

dayjs.extend(relativeTime);

interface ScheduleCronPreviewProps {
	crontab: string;
	timezone: string;
}

/** The plain-language reading of a crontab and its next few ticks, in the zone they fire in. */
export const ScheduleCronPreview: React.FC<ScheduleCronPreviewProps> = ({ crontab, timezone }) => {
	if (!crontab.trim()) return null;
	const analysis = analyzeCrontab(crontab, timezone);
	// Errors are shown on the field itself.
	if (!analysis.ok) return null;

	const runs = analysis.next(SCHEDULE_PREVIEW_COUNT);
	const interval = crontab.includes('@every');

	return (
		<Stack gap={4}>
			<Group gap={6}>
				<LuCalendarClock size={14} aria-hidden />
				<Text fz="sm" fw={500}>
					{analysis.description ?? 'Custom schedule'}
				</Text>
				<Text fz="xs" c="dimmed">
					· {analysis.zone}
				</Text>
			</Group>
			<Text fz="xs" c="dimmed">
				{interval
					? 'Intervals count from when the engine loads the schedule, so these times are approximate:'
					: `Next ${SCHEDULE_PREVIEW_COUNT} runs:`}
			</Text>
			<List size="xs" spacing={2} c="dimmed">
				{runs.map((run) => (
					<List.Item key={run.getTime()}>
						<Text span fz="xs" ff="monospace">
							{formatInZone(run, analysis.zone)}
						</Text>{' '}
						<Text span fz="xs" c="dimmed">
							({dayjs(run).fromNow()})
						</Text>
					</List.Item>
				))}
			</List>
		</Stack>
	);
};
