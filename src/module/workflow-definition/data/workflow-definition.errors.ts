import type { CoreQueryError } from '@core/api';

export interface WorkflowDefinitionErrorCopy {
	title: string;
	detail: string | null;
}

const readError = (error: unknown): Partial<CoreQueryError> =>
	error && typeof error === 'object' ? (error as Partial<CoreQueryError>) : {};

// `HTTPError` maps RFC 7807 `title` -> `explain` and `detail` -> `message`.
const joinDetail = (...parts: (string | undefined)[]) => {
	const unique = [...new Set(parts.filter((part): part is string => !!part))];
	return unique.length > 0 ? unique.join(' — ') : null;
};

export const describeSaveError = (error: unknown): WorkflowDefinitionErrorCopy => {
	const { code, explain, message } = readError(error);

	if (code === 422) {
		// `explain` is usually just the status text here; the engine's reason is in `message`.
		return { title: 'The engine rejected this definition', detail: joinDetail(message) ?? joinDetail(explain) };
	}
	if (code === 409) {
		return {
			title: 'Version conflict',
			detail: joinDetail(message) ?? 'A definition with this name or version already exists.',
		};
	}
	return {
		title: "Couldn't save workflow definition",
		detail: joinDetail(explain, message) ?? 'Something went wrong while saving',
	};
};

export const describeDeleteError = (error: unknown): WorkflowDefinitionErrorCopy | null => {
	if (!error) return null;
	const { code, explain, message } = readError(error);

	if (code === 409) {
		return {
			title: "This version is still referenced by workflow runs and can't be deleted.",
			detail: joinDetail(message),
		};
	}
	return {
		title: explain || "Couldn't delete workflow definition",
		detail: message && message !== explain ? message : null,
	};
};
