import type { IconType } from 'react-icons';
import {
	LuBoxes,
	LuCode,
	LuGitFork,
	LuGitMerge,
	LuGlobe,
	LuLogIn,
	LuPuzzle,
	LuRadar,
	LuSend,
	LuSplit,
	LuTimer,
} from 'react-icons/lu';

import { humanizeKey } from '@common/component/SchemaForm';
import type { JsonSchema } from '@common/types/JsonSchema';

import type { NodeTypeCatalogItem } from '@module/node-type/types/NodeTypeCatalogItem';

export interface NodeTypeMeta {
	label: string;
	color: string;
	icon: IconType;
	description: string;
}

/**
 * How the types this UI already knows look. Cosmetic only: which types exist and what they accept comes from the
 * engine's catalog, and a type missing here still works with a generic look.
 */
const knownNodeTypeMeta: Record<string, NodeTypeMeta> = {
	input: {
		label: 'Input',
		color: 'teal',
		icon: LuLogIn,
		description: 'Wait for a payload over HTTP, Redis or RabbitMQ',
	},
	script: {
		label: 'Script',
		color: 'blue',
		icon: LuCode,
		description: 'Run JavaScript against the workflow context',
	},
	conditions: { label: 'Conditions', color: 'orange', icon: LuSplit, description: 'Route to exactly one branch' },
	external_call: {
		label: 'External call',
		color: 'pink',
		icon: LuGlobe,
		description: 'Call an HTTP endpoint or run a command',
	},
	poller: { label: 'Poller', color: 'cyan', icon: LuRadar, description: 'Repeat a check until a predicate matches' },
	delay: { label: 'Delay', color: 'lime', icon: LuTimer, description: 'Wait a fixed duration, then continue' },
	parallel_start: {
		label: 'Parallel',
		color: 'indigo',
		icon: LuGitFork,
		description: 'Run named branches at once, then join them',
	},
	parallel_end: {
		label: 'Join',
		color: 'indigo',
		icon: LuGitMerge,
		description: 'Wait for every branch and combine their contexts',
	},
	group: { label: 'Group', color: 'violet', icon: LuBoxes, description: 'Nested sub-graph with its own start' },
	output: {
		label: 'Output',
		color: 'grape',
		icon: LuSend,
		description: 'Publish a context value to Redis or RabbitMQ',
	},
};

const knownOrder = Object.keys(knownNodeTypeMeta);

/** A schema description without the engine's "Go parsers stay authoritative" disclaimer. */
export const schemaDescription = (schema: JsonSchema | null | undefined) => {
	const text = schema?.description?.replace(/[;,.]?\s*go parsers stay authoritative\.?/i, '').trim();
	if (!text) return undefined;
	return /[.!?]$/.test(text) ? text : `${text}.`;
};

/** Display meta for any node type; one this UI doesn't know is named after its type and described by its schema. */
export const nodeTypeMetaOf = (type: string, item?: NodeTypeCatalogItem): NodeTypeMeta =>
	knownNodeTypeMeta[type] ?? {
		label: humanizeKey(type),
		color: 'gray',
		icon: LuPuzzle,
		description:
			schemaDescription(item?.schema) ??
			(item?.builtin ? 'Node type served by the engine' : 'Custom node type registered with the engine'),
	};

/** Types in a stable display order: the ones this UI knows first, then the rest by name. */
export const sortNodeTypes = <T extends string>(types: Iterable<T>): T[] => {
	const rank = (type: string) => {
		const index = knownOrder.indexOf(type);
		return index === -1 ? knownOrder.length : index;
	};
	return [...types].sort((a, b) => rank(a) - rank(b) || (a < b ? -1 : a > b ? 1 : 0));
};
