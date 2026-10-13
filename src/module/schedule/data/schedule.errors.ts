import type { CoreQueryError } from '@core/api';

import type { SchedulePayload } from '@module/schedule/types/SchedulePayload';

export type ScheduleField = keyof SchedulePayload;

export interface ScheduleErrorCopy {
	/** Set when the engine's reason names one field, so the form can show it inline. */
	field: ScheduleField | null;
	message: string;
}

const readError = (error: unknown): Partial<CoreQueryError> =>
	error && typeof error === 'object' ? (error as Partial<CoreQueryError>) : {};

// The engine's 422 reasons come from model.ResolveCronSpec and service/schedule.go.
const FIELD_PATTERNS: [RegExp, ScheduleField][] = [
	[/timezone/i, 'timezone'],
	[/crontab/i, 'crontab'],
	[/workflow_definition_id|definition/i, 'workflow_definition_id'],
	[/context/i, 'context'],
];

/**
 * Maps a create/replace failure to a field when it can. `detail` is the engine's own reason; a replace whose
 * create failed carries it in `data`, since its `message` explains that the old schedule is already gone.
 */
export const describeScheduleError = (error: unknown, fallback: string): ScheduleErrorCopy => {
	const { code, message, data } = readError(error);
	const detail = (code === 422 || code === 404) && data && data !== 'Unknown Error' ? data : message;

	if (code === 404) return { field: 'workflow_definition_id', message: 'That workflow definition no longer exists' };
	if (code === 422 && detail) {
		const field = FIELD_PATTERNS.find(([pattern]) => pattern.test(detail))?.[1] ?? null;
		return { field, message: detail };
	}
	return { field: null, message: message || fallback };
};
