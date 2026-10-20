import type React from 'react';

import type { JsonSchema } from '@common/types/JsonSchema';

export type SchemaFieldKind =
	| 'hidden'
	| 'string'
	/** Free text with `{{ path }}` templates. */
	| 'template'
	/** A bare context path like `order.items`. */
	| 'contextPath'
	| 'script'
	| 'duration'
	| 'enum'
	| 'boolean'
	| 'number'
	| 'stringList'
	| 'stringMap'
	| 'object'
	/** An optional or nullable object: switched on and off as a whole. */
	| 'toggleObject'
	| 'objectList'
	| 'json';

/** Per-path adjustments made before a field is rendered. */
export interface SchemaFieldOverride {
	label?: string;
	description?: string;
	kind?: SchemaFieldKind;
	placeholder?: string;
}

export interface SchemaFieldContext {
	/** Dotted path from the form's root, e.g. `http_config.url` or `command.0`. */
	path: string;
	key: string;
	/** The property schema with local `$ref`s resolved. */
	schema: JsonSchema;
	kind: SchemaFieldKind;
	label: string;
	description?: string;
	placeholder?: string;
	required: boolean;
	value: unknown;
	/** Undefined removes the property. */
	onChange: (value: unknown) => void;
	error?: string;
	readOnly: boolean;
}

export type SchemaFieldRenderer = (field: SchemaFieldContext) => React.ReactNode | undefined;
