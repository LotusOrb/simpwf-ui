import type { JsonSchema } from '@common/types/JsonSchema';

/** One forms-library entry. `schema` and `ui` are the stored bytes, exactly as saved. */
export interface Form {
	id: string;
	name: string;
	schema: JsonSchema;
	/** Absent when the form was saved without one. Parsed with `formUiSchema` before use; never trusted as is. */
	ui?: Record<string, unknown> | null;
	created_at: string;
	updated_at: string;
}
