import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { WorkflowDefinitionEditorDocument } from '@module/workflow-definition/types/WorkflowDefinitionEditorDocument';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import {
	createEditorNode,
	EDITOR_METADATA_KEY,
	scopeKey,
	toEditorDocument,
	toWorkflowDefinitionContent,
} from './workflow-definition.editor';
import { isBuiltinNodeType } from './workflow-definition.meta';

/**
 * A node definition as an editor document: a workflow whose only root node is the definition's node, so the canvas,
 * inspector and validation work on it unchanged. A group definition's inner graph is that node's scope. Routing the
 * canvas can't draw (next_node, on_failure, parallel targets) rides on edges to ids outside the document, so it is
 * written back as loaded.
 */
export const toNodeEditorDocument = (definition: NodeDefinition): WorkflowDefinitionEditorDocument => {
	const { parallel_end_node_id, ...content } = definition.content as Omit<WorkflowDefinitionNode, 'id'>;
	const rootId = definition.id;
	const root: WorkflowDefinitionNode = {
		...content,
		id: rootId,
		// Custom types are plain strings the editor treats as opaque.
		type: definition.type as WorkflowDefinitionNodeType,
		name: definition.name,
	};

	const document = toEditorDocument({ ...definition, content: { start_node_id: rootId, nodes: [root] } }, {});
	return {
		...document,
		nodeDefinition: {
			rootId,
			type: definition.type,
			contentName: content.name,
			schema: definition.schema ?? null,
			parallelEndNodeId: parallel_end_node_id,
		},
	};
};

/** A new node definition of `type`, unnamed, with the type's starting config. */
export const newNodeEditorDocument = (
	type: string,
	schema: Record<string, unknown> | null,
): WorkflowDefinitionEditorDocument => {
	const document = toEditorDocument(null, {});
	const root = createEditorNode({}, null, { x: 0, y: 0 }, { type: type as WorkflowDefinitionNodeType });
	root.config.name = '';
	// A custom type's only executable field is its `config` object.
	if (!isBuiltinNodeType(type)) Object.assign(root.config, { config: {} });

	document.nodes[root.id] = root;
	// A group definition's canvas opens inside it, so its Start needs a place there.
	if (type === 'group') document.starts[scopeKey(root.id)] = { position: { x: 0, y: 0 } };
	return { ...document, nodeDefinition: { rootId: root.id, type, schema } };
};

/** The definition content to save: the root node without the graph fields only a workflow gives it. */
export const toNodeDefinitionContent = (document: WorkflowDefinitionEditorDocument): Record<string, unknown> => {
	const { nodeDefinition } = document;
	const editorRoot = nodeDefinition && document.nodes[nodeDefinition.rootId];
	const written = editorRoot && toWorkflowDefinitionContent(document).nodes.find((node) => node.id === editorRoot.id);
	if (!nodeDefinition || !editorRoot || !written) return {};

	const content: Partial<WorkflowDefinitionNode> = { ...written };
	delete content.id;
	delete content.keys;
	if (nodeDefinition.contentName === undefined) delete content.name;
	else content.name = nodeDefinition.contentName;
	// A workflow node gets a default output property on save; a definition leaves it to the workflow using it.
	if (!editorRoot.config.output_property) delete content.output_property;
	if (nodeDefinition.parallelEndNodeId) content.parallel_end_node_id = nodeDefinition.parallelEndNodeId;

	// The root's canvas position means nothing outside this editor; inner nodes keep theirs for the next open.
	const metadata = { ...content.metadata };
	delete metadata[EDITOR_METADATA_KEY];
	if (Object.keys(metadata).length > 0) content.metadata = metadata;
	else delete content.metadata;

	return content;
};

/** The scope a node definition's canvas shows: inside a group definition, else the root with its one node. */
export const nodeDefinitionScope = (document: WorkflowDefinitionEditorDocument) => {
	const rootId = document.nodeDefinition?.rootId;
	return rootId && document.nodes[rootId]?.config.type === 'group' ? rootId : null;
};
