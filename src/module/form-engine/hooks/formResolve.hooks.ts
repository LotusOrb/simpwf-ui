import { Permission, useCan } from '@core/auth/authorization';

import type { JsonSchema } from '@common/types/JsonSchema';

import type { FormResolveState } from '@module/form-engine/types/FormResolveState';
import { formErrorCode, formErrorMessage } from '@module/form-engine/utils';

import { useGetFormQuery } from './form.hooks';

interface FormReference {
	form_id?: string | null;
	/** The form frozen into a run started with `snapshot_forms`. */
	form?: { schema: Record<string, unknown>; ui?: Record<string, unknown> | null } | null;
}

/** The form an input expects: the run's frozen copy first, else the library form fetched by id. */
export const useResolvedForm = (reference: FormReference | null): FormResolveState => {
	const canRead = useCan(Permission.FormsRead);
	const snapshot = reference?.form ?? null;
	const formId = reference?.form_id ?? null;
	const fetchable = !snapshot && !!formId && canRead;

	const query = useGetFormQuery(formId ?? '', { skip: !fetchable });

	if (snapshot) return { status: 'ready', schema: snapshot.schema as JsonSchema, ui: snapshot.ui, frozen: true };
	if (!formId) return { status: 'none' };
	if (!canRead) return { status: 'forbidden', formId };

	if (query.data && query.data.id === formId) {
		return { status: 'ready', schema: query.data.schema, ui: query.data.ui, frozen: false, form: query.data };
	}
	if (query.isError) {
		return {
			status: 'error',
			formId,
			message:
				formErrorCode(query.error) === 404
					? 'The form this input references no longer exists.'
					: formErrorMessage(query.error, "Couldn't load the form."),
			retry: query.refetch,
		};
	}
	return { status: 'loading', formId };
};
