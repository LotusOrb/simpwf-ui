import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

/** The schedule list only supports pagination. */
export type ScheduleQuery = Pick<ComplexQueryParam, 'page' | 'perPage'>;
