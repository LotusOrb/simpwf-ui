import type { CoreQueryError } from '@core/api/core.baseQuery';

import type { Form } from '@module/form-engine/types/Form';

/** Top-level properties of the form's schema; nested fields count as part of their parent. */
export const formFieldCount = (form: Pick<Form, 'schema'>) => Object.keys(form.schema.properties ?? {}).length;

export const formErrorMessage = (error: unknown, fallback: string) => {
	const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
	return typeof message === 'string' && message ? message : fallback;
};

export const formErrorCode = (error: unknown) =>
	error && typeof error === 'object' && 'code' in error ? (error as CoreQueryError).code : null;

export const formLibraryPath = (id?: string) => (id ? `/app/form/${id}` : '/app/form');
