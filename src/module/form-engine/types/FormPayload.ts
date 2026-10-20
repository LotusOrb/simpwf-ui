import type { JsonSchema } from '@common/types/JsonSchema';

import type { FormUi } from './FormUi';

/** The POST /v1/forms and PUT /v1/forms/{id} body. PUT overwrites everything: an omitted `ui` clears it. */
export interface FormPayload {
	name: string;
	schema: JsonSchema;
	ui?: FormUi | Record<string, unknown>;
}
