export const SCHEDULE_ROUTE = '/app/schedule';

/** Opens the create form prefilled with this definition id, e.g. from the workflow definition editor. */
export const SCHEDULE_CREATE_PARAM = 'new';

export const scheduleCreateLink = (definitionId: string) =>
	`${SCHEDULE_ROUTE}?${SCHEDULE_CREATE_PARAM}=${encodeURIComponent(definitionId)}`;

export const SCHEDULE_PREVIEW_COUNT = 5;

/** `explain` on a replace error whose delete went through: the old schedule is gone. */
export const SCHEDULE_REPLACE_REMOVED = 'Schedule removed';
