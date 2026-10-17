/** The JSON Schema (draft 2020-12) keywords the UI reads. Anything else is carried through untouched. */
export interface JsonSchema {
	$schema?: string;
	$ref?: string;
	$defs?: Record<string, JsonSchema>;
	title?: string;
	description?: string;
	type?: string | string[];
	const?: unknown;
	enum?: unknown[];
	default?: unknown;
	properties?: Record<string, JsonSchema>;
	required?: string[];
	additionalProperties?: boolean | JsonSchema;
	minProperties?: number;
	items?: JsonSchema;
	minItems?: number;
	minLength?: number;
	pattern?: string;
	format?: string;
	minimum?: number;
	maximum?: number;
	oneOf?: JsonSchema[];
	anyOf?: JsonSchema[];
	allOf?: JsonSchema[];
	[keyword: string]: unknown;
}
