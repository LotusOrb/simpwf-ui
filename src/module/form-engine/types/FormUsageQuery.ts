import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

/** Only the instance list of a usage is paginated; definitions come back whole. */
export type FormUsageQuery = Pick<ComplexQueryParam, 'page' | 'perPage'> & { id: string };
