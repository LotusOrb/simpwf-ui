import * as z from 'zod';

import { humanizeKey, isRecord, variantKeys } from '@common/component/SchemaForm';
import type { JsonSchema } from '@common/types/JsonSchema';

import type { NodeTypeCatalogItem } from '@module/node-type/types/NodeTypeCatalogItem';

export interface NodeTypeIssue {
	path: (string | number)[];
	message: string;
}

export type NodeTypeValidation =
	/** The type has a schema zod can check. */
	| { kind: 'checked'; validate: (node: unknown) => NodeTypeIssue[] }
	/** The schema uses something zod can't express; the engine checks the node on save. */
	| { kind: 'unsupported'; reason: string }
	/** The type was registered without a schema. */
	| { kind: 'none' };

// A Go duration that parses and is positive, like 30s or 1h30m: what the engine's parser accepts.
const DURATION_UNITS = '(ns|us|µs|ms|s|m|h)';
const DURATION_PATTERN = `^(?!(0+(\\.0+)?${DURATION_UNITS})+$)(\\d+(\\.\\d+)?${DURATION_UNITS})+$`;

interface VariantGroup {
	path: string[];
	keys: string[];
}

const walk = (value: unknown, visit: (node: Record<string, unknown>) => void) => {
	if (Array.isArray(value)) value.forEach((item) => walk(item, visit));
	else if (isRecord(value)) {
		visit(value);
		Object.values(value).forEach((item) => walk(item, visit));
	}
};

const openSchemas = new WeakMap<JsonSchema, JsonSchema>();

/**
 * The schema with `additionalProperties: false` dropped, for editors that check against it (like the JSON tab): the
 * served schemas leave out fields the engine accepts, so a closed object would flag valid nodes.
 */
export const openNodeSchema = (schema: JsonSchema): JsonSchema => {
	let open = openSchemas.get(schema);
	if (!open) {
		open = structuredClone(schema);
		walk(open, (node) => {
			if (node.additionalProperties === false) delete node.additionalProperties;
		});
		openSchemas.set(schema, open);
	}
	return open;
};

/**
 * Turns a served schema into one zod checks the way the engine behaves:
 * - `additionalProperties: false` is dropped. The served schemas leave out fields the parser accepts (`start_delay`
 *   everywhere, `id` on input), so a closed object would reject valid nodes.
 * - A group's `nodes` is dropped: every child is checked as a node of its own, and the child union carries a `not`
 *   zod can't express.
 * - An exactly-one-of-these-keys `oneOf` is taken out and checked separately: zod reads each arm as "anything", so
 *   every value would match more than one arm.
 * - Durations get the pattern of a positive Go duration; the schema only says so in prose.
 */
const prepareSchema = (schema: JsonSchema) => {
	const prepared = structuredClone(openNodeSchema(schema));
	if (prepared.properties?.nodes) {
		delete prepared.properties.nodes;
		prepared.required = prepared.required?.filter((key) => key !== 'nodes');
	}

	const variants: VariantGroup[] = [];
	const collect = (object: JsonSchema, path: string[]) => {
		const keys = variantKeys(object);
		if (keys) {
			variants.push({ path, keys });
			delete object.oneOf;
		}
		for (const [key, property] of Object.entries(object.properties ?? {})) collect(property, [...path, key]);
	};
	collect(prepared, []);

	pruneUnusedDefs(prepared);
	const duration = prepared.$defs?.duration;
	if (duration) duration.pattern = DURATION_PATTERN;
	return { prepared, variants };
};

/** Drops the `$defs` nothing outside them refers to, directly or through other defs. */
const pruneUnusedDefs = (schema: JsonSchema) => {
	const defs = schema.$defs;
	if (!defs) return;
	const { $defs: _defs, ...body } = schema;
	const used = new Set<string>();
	const pending: unknown[] = [body];
	while (pending.length > 0) {
		walk(pending.pop(), (node) => {
			const ref = typeof node.$ref === 'string' && node.$ref.startsWith('#/$defs/') ? node.$ref.slice(8) : null;
			if (ref && !used.has(ref) && defs[ref]) {
				used.add(ref);
				pending.push(defs[ref]);
			}
		});
	}
	for (const name of Object.keys(defs)) if (!used.has(name)) delete defs[name];
};

const label = (path: PropertyKey[]) => {
	const last = path.at(-1);
	if (last === undefined) return 'This node';
	if (typeof last === 'number') return `${humanizeKey(String(path.at(-2) ?? 'Item'))} ${last + 1}`;
	return humanizeKey(String(last));
};

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/** The issue in words, prefixed with the parent object for a nested field: "HTTP config: URL is required". */
const describeIssue = (issue: z.core.$ZodIssue): string => {
	const message = describeLeaf(issue);
	const parentIndex = typeof issue.path.at(-1) === 'number' ? -3 : -2;
	const parent = issue.path.length >= -parentIndex ? issue.path.at(parentIndex) : undefined;
	return typeof parent === 'string' ? `${humanizeKey(parent)}: ${message}` : message;
};

const describeLeaf = (issue: z.core.$ZodIssue): string => {
	const name = label(issue.path);
	switch (issue.code) {
		case 'invalid_type':
			return issue.input === undefined ? `${name} is required` : `${name} must be ${issue.expected}`;
		case 'too_small': {
			const minimum = Number(issue.minimum);
			if (issue.origin === 'string') {
				return minimum <= 1 ? `${name} is required` : `${name} needs at least ${plural(minimum, 'character')}`;
			}
			if (issue.origin === 'array' || issue.origin === 'set')
				return `${name} needs at least ${plural(minimum, 'item')}`;
			return `${name} must be at least ${minimum}`;
		}
		case 'too_big':
			return `${name} must be at most ${Number(issue.maximum)}`;
		case 'invalid_format':
			if (issue.format === 'regex' && issue.pattern?.includes(DURATION_UNITS)) {
				return `${name} must be a duration like 30s or 5m`;
			}
			if (issue.format === 'uuid' || issue.format === 'guid') return `${name} must be a UUID`;
			if (issue.format === 'regex') return `${name} must match ${issue.pattern?.replace(/^\/|\/$/g, '')}`;
			return `${name} must be a valid ${issue.format}`;
		case 'invalid_value':
			return issue.values.length === 1
				? `${name} must be ${String(issue.values[0])}`
				: `${name} must be one of: ${issue.values.map(String).join(', ')}`;
		case 'invalid_union':
			return `${name} doesn't match any accepted shape`;
		default:
			return `${name}: ${issue.message}`;
	}
};

const valueAt = (value: unknown, path: string[]) =>
	path.reduce<unknown>((current, key) => (isRecord(current) ? current[key] : undefined), value);

const compile = (schema: JsonSchema): NodeTypeValidation => {
	const { prepared, variants } = prepareSchema(schema);
	let base: z.ZodType;
	try {
		base = z.fromJSONSchema(prepared as z.core.JSONSchema.JSONSchema);
	} catch (error) {
		return { kind: 'unsupported', reason: error instanceof Error ? error.message : String(error) };
	}

	return {
		kind: 'checked',
		validate: (node) => {
			const result = base.safeParse(node, { reportInput: true });
			// One message per field: an empty duration is "required", not also "not a duration".
			const seen = new Set<string>();
			const issues: NodeTypeIssue[] = [];
			for (const issue of result.success ? [] : result.error.issues) {
				const path = issue.path.filter((key): key is string | number => typeof key !== 'symbol');
				if (seen.has(path.join('.'))) continue;
				seen.add(path.join('.'));
				issues.push({ path, message: describeIssue(issue) });
			}
			for (const group of variants) {
				const object = valueAt(node, group.path);
				if (!isRecord(object)) continue;
				const present = group.keys.filter((key) => object[key] !== undefined);
				if (present.length !== 1) {
					issues.push({
						path: group.path,
						message: `Set exactly one of ${group.keys.map(humanizeKey).join(', ')}`,
					});
				}
			}
			return issues;
		},
	};
};

const compiled = new WeakMap<NodeTypeCatalogItem, NodeTypeValidation>();

/** How nodes of a catalog type are checked in the browser. Compiled once per catalog entry. */
export const nodeTypeValidation = (item: NodeTypeCatalogItem): NodeTypeValidation => {
	if (!item.schema) return { kind: 'none' };
	let validation = compiled.get(item);
	if (!validation) {
		validation = compile(item.schema);
		compiled.set(item, validation);
	}
	return validation;
};
