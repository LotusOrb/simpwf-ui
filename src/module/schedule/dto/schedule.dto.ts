import * as z from 'zod';

import { analyzeCrontab, isValidTimeZone } from '@module/schedule/utils';

import type { Schedule } from '../types/Schedule';
import type { SchedulePayload } from '../types/SchedulePayload';

const parseContext = (text: string): unknown => {
	try {
		return text.trim() ? JSON.parse(text) : {};
	} catch {
		return undefined;
	}
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
	!!value && typeof value === 'object' && !Array.isArray(value);

export const scheduleSchema = z
	.object({
		workflow_definition_id: z.string().min(1, 'Pick a workflow definition'),
		crontab: z.string().trim().min(1, 'Enter a crontab'),
		timezone: z
			.string()
			.trim()
			.refine((zone) => !zone || isValidTimeZone(zone), 'Unknown timezone'),
		/** JSON text of the context new runs start from. */
		context: z.string().refine((text) => isPlainObject(parseContext(text)), 'Context must be a JSON object'),
		enabled: z.boolean(),
	})
	.superRefine((values, ctx) => {
		const analysis = analyzeCrontab(values.crontab, values.timezone);
		if (!analysis.ok) ctx.addIssue({ code: 'custom', path: ['crontab'], message: analysis.error });
	});

export type ScheduleDto = z.infer<typeof scheduleSchema>;

export const scheduleInitialValues: ScheduleDto = {
	workflow_definition_id: '',
	crontab: '',
	timezone: 'UTC',
	context: '{}',
	enabled: true,
};

export const scheduleToDto = (schedule: Schedule): ScheduleDto => ({
	workflow_definition_id: schedule.workflow_definition_id,
	crontab: schedule.crontab,
	timezone: schedule.timezone,
	context: JSON.stringify(schedule.context ?? {}, null, 2),
	enabled: schedule.enabled,
});

export const scheduleFromDto = (values: ScheduleDto): SchedulePayload => ({
	workflow_definition_id: values.workflow_definition_id,
	crontab: values.crontab.trim(),
	timezone: values.timezone.trim() || 'UTC',
	context: (parseContext(values.context) as Record<string, unknown>) ?? {},
	enabled: values.enabled,
});
