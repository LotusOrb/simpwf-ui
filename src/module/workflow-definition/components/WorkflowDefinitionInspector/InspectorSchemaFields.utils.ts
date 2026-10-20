import type { JsonSchema } from '@common/types/JsonSchema';

import { fieldKind, resolveSchema } from '@module/form-engine/components/SchemaForm';
import { GRAPH_FIELDS } from '@module/workflow-definition/constant';

export type NodeFormSection = 'setup' | 'hooks' | 'advanced';

// Shown by the inspector itself: graph fields on the canvas, the rest as fixed inputs every node has.
const FIXED_FIELDS: ReadonlySet<string> = new Set([
	...GRAPH_FIELDS,
	'name',
	'metadata',
	'output_property',
	'node_definition_id',
]);
const HOOK_FIELDS = ['pre_script', 'post_script'];
const ADVANCED_FIELDS = ['timeout', 'retry_on_recovery'];

/**
 * The generated fields of one inspector tab, in schema order. A library reference only takes hooks and the advanced
 * lifecycle fields: its behavior comes from the definition it points at.
 */
export const nodeFormKeys = (schema: JsonSchema | null, section: NodeFormSection, reference: boolean): string[] => {
	const keys = Object.keys(schema?.properties ?? {}).filter((key) => !FIXED_FIELDS.has(key));
	switch (section) {
		// In lifecycle order rather than the schema's alphabetical one.
		case 'hooks':
			return HOOK_FIELDS.filter((key) => keys.includes(key));
		case 'advanced':
			return ADVANCED_FIELDS.filter((key) => keys.includes(key) && !(reference && key === 'timeout'));
		case 'setup':
			return reference ? [] : keys.filter((key) => !HOOK_FIELDS.includes(key) && !ADVANCED_FIELDS.includes(key));
	}
};

/** Whether any of `keys`, or a field one level inside them, is a script whose editor sees `context`. */
export const hasScriptField = (schema: JsonSchema | null, keys: string[]) =>
	!!schema &&
	keys.some((key) => {
		const property = schema.properties?.[key];
		if (!property) return false;
		if (fieldKind(key, property, schema, false) === 'script') return true;
		return Object.entries(resolveSchema(property, schema).properties ?? {}).some(
			([child, childSchema]) => fieldKind(child, childSchema, schema, false) === 'script',
		);
	});
