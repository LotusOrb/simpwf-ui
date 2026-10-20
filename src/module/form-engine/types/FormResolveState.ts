import type { JsonSchema } from '@common/types/JsonSchema';

import type { Form } from './Form';

export type FormResolveState =
	/** The input references no form. */
	| { status: 'none' }
	| { status: 'loading'; formId: string }
	/** `frozen` when the schema is the run's snapshot; `form` is the library entry when it was fetched. */
	| { status: 'ready'; schema: JsonSchema; ui: unknown; frozen: boolean; form?: Form }
	/** The caller lacks forms:read and the run has no frozen copy. */
	| { status: 'forbidden'; formId: string }
	| { status: 'error'; formId: string; message: string; retry: () => void };
