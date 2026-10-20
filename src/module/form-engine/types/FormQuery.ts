import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

/** The forms list only supports pagination, ordered by `created_at, id`. */
export type FormQuery = Pick<ComplexQueryParam, 'page' | 'perPage'>;
