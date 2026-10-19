import { SCHEDULE_CREATE_PARAM, SCHEDULE_ROUTE } from '@module/schedule/constant';

export const scheduleCreateLink = (definitionId: string) =>
	`${SCHEDULE_ROUTE}?${SCHEDULE_CREATE_PARAM}=${encodeURIComponent(definitionId)}`;
