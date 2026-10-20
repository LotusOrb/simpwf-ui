import type { JsonSchema } from '@common/types/JsonSchema';

import type { SchemaFieldKind } from './SchemaForm.types';

const LOCAL_REF = '#/$defs/';

/** The `$defs` name a schema points at, if it is a local reference. */
export const refName = (schema: JsonSchema | undefined) =>
	schema?.$ref?.startsWith(LOCAL_REF) ? schema.$ref.slice(LOCAL_REF.length) : undefined;

/** Follows local `$ref`s into the root's `$defs`. Sibling keywords (like a description) win over the target's. */
export const resolveSchema = (schema: JsonSchema | undefined, root: JsonSchema): JsonSchema => {
	let current: JsonSchema = schema ?? {};
	const seen = new Set<string>();
	while (current.$ref) {
		const name = refName(current);
		const target = name ? root.$defs?.[name] : undefined;
		if (!name || !target || seen.has(name)) break;
		seen.add(name);
		const { $ref: _ref, ...siblings } = current;
		current = { ...target, ...siblings };
	}
	return current;
};

export const schemaTypes = (schema: JsonSchema): string[] =>
	Array.isArray(schema.type) ? schema.type : schema.type ? [schema.type] : [];

const isObjectSchema = (schema: JsonSchema) => schemaTypes(schema).includes('object') || !!schema.properties;

const hasProperties = (schema: JsonSchema) => Object.keys(schema.properties ?? {}).length > 0;

/**
 * The property names of a `oneOf` that only says "exactly one of these keys is present", e.g. an external call's
 * `http_config` or `execution_config`. Null for any other `oneOf`.
 */
export const variantKeys = (schema: JsonSchema): string[] | null => {
	const arms = schema.oneOf;
	if (!arms || arms.length < 2) return null;
	const keys = arms.map((arm) => {
		const { required, ...rest } = arm;
		return required?.length === 1 && Object.keys(rest).length === 0 ? required[0] : null;
	});
	return keys.every((key): key is string => !!key && !!schema.properties?.[key]) ? keys : null;
};

const ACRONYMS: Record<string, string> = {
	api: 'API',
	http: 'HTTP',
	https: 'HTTPS',
	id: 'ID',
	ids: 'IDs',
	json: 'JSON',
	rabbitmq: 'RabbitMQ',
	ui: 'UI',
	url: 'URL',
	uuid: 'UUID',
};

/** A label for a schema key or enum value: `output_property` → "Output property", `url` → "URL". */
export const humanizeKey = (key: string) =>
	key
		.split(/[_\s]+/)
		.filter(Boolean)
		.map((word, index) => {
			const acronym = ACRONYMS[word.toLowerCase()];
			if (acronym) return acronym;
			if (word === word.toUpperCase()) return word;
			return index === 0 ? word[0].toUpperCase() + word.slice(1) : word;
		})
		.join(' ');

const SCRIPT_KEY = /(^|_)script$|^until$|^condition$/;

/** The widget a property gets when nothing overrides it. */
export const fieldKind = (key: string, raw: JsonSchema, root: JsonSchema, required: boolean): SchemaFieldKind => {
	const ref = refName(raw);
	if (ref === 'nodeId') return 'hidden';
	if (ref === 'duration') return 'duration';

	const schema = resolveSchema(raw, root);
	const types = schemaTypes(schema);
	if (schema.const !== undefined) return 'hidden';
	if (schema.enum) return 'enum';

	if (isObjectSchema(schema)) {
		if (hasProperties(schema)) return types.includes('null') || !required ? 'toggleObject' : 'object';
		const values = schema.additionalProperties;
		if (typeof values === 'object' && schemaTypes(resolveSchema(values, root)).includes('string')) {
			return 'stringMap';
		}
		return 'json';
	}

	if (types.includes('array')) {
		const items = resolveSchema(schema.items, root);
		if (schemaTypes(items).includes('string') && !items.enum) return 'stringList';
		if (isObjectSchema(items) && hasProperties(items)) return 'objectList';
		return 'json';
	}

	if (types.includes('boolean')) return 'boolean';
	if (types.includes('integer') || types.includes('number')) return 'number';
	if (types.includes('string')) {
		if (SCRIPT_KEY.test(key)) return 'script';
		const description = schema.description ?? '';
		if (description.includes('{{')) return 'template';
		if (/context path/i.test(description)) return 'contextPath';
		return 'string';
	}
	return 'json';
};

/**
 * A starting value that has every required field: the schema's `default`, the first enum value, the first variant
 * of an exactly-one-of object, or an empty value of the right type. Undefined when nothing sensible exists.
 */
export const seedValue = (raw: JsonSchema | undefined, root: JsonSchema): unknown => {
	const schema = resolveSchema(raw, root);
	if (schema.default !== undefined) return structuredClone(schema.default);
	if (schema.const !== undefined) return schema.const;
	if (schema.enum?.length) return schema.enum[0];

	const types = schemaTypes(schema).filter((type) => type !== 'null');
	if (isObjectSchema(schema)) return seedObject(schema, root);
	if (types.includes('array')) {
		const count = schema.minItems ?? 0;
		return Array.from({ length: count }, () => seedValue(schema.items, root) ?? '');
	}
	if (types.includes('string')) return '';
	if (types.includes('boolean')) return false;
	if (types.includes('integer') || types.includes('number')) return schema.minimum ?? 0;
	return undefined;
};

/** An object holding the defaults and required fields of `schema`, minus the keys in `skip`. */
export const seedObject = (schema: JsonSchema, root: JsonSchema, skip: ReadonlySet<string> = new Set()) => {
	const object: Record<string, unknown> = {};
	const required = new Set(schema.required ?? []);
	const variants = variantKeys(schema);
	if (variants && !variants.some((key) => skip.has(key))) required.add(variants[0]);

	for (const [key, property] of Object.entries(schema.properties ?? {})) {
		if (skip.has(key)) continue;
		const resolved = resolveSchema(property, root);
		if (resolved.default === undefined && !required.has(key)) continue;
		const value = seedValue(property, root);
		if (value !== undefined) object[key] = value;
	}
	return object;
};

/** `patch` applied to `value`: undefined deletes a key, anything else replaces it. */
export const applyPatch = (value: unknown, patch: Record<string, unknown>): Record<string, unknown> => {
	const next: Record<string, unknown> = { ...(isRecord(value) ? value : {}) };
	for (const [key, item] of Object.entries(patch)) {
		if (item === undefined) delete next[key];
		else next[key] = item;
	}
	return next;
};

export const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const joinPath = (prefix: string, key: string | number) => (prefix ? `${prefix}.${key}` : String(key));
