/**
 * A node type name as the engine's catalog (`GET /v1/node/types`) lists it. Builtins like `script` or `parallel_start`
 * and registered custom types alike; which ones exist and what they accept comes from the catalog.
 */
export type WorkflowDefinitionNodeType = string;
