import type { ComplexQueryParam } from '@common/types/ComplexQueryParam';

/** The secrets list only supports pagination. */
export type SecretQuery = Pick<ComplexQueryParam, 'page' | 'perPage'>;
