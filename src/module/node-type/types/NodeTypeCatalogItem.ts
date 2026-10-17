import type { JsonSchema } from '@common/types/JsonSchema';

/** One entry of the engine's node type catalog (`GET /v1/node/types`). */
export interface NodeTypeCatalogItem {
	type: string;
	/** A core engine type; registered custom types are false. */
	builtin: boolean;
	/** The full node-object schema. Null when a custom type was registered without one. */
	schema: JsonSchema | null;
}
