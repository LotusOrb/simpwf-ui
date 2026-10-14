import React, { useState } from 'react';

import { useCoreSelector } from '@core/store';

import {
	selectEditorNode,
	selectEditorNodeDefinition,
	selectEditorSelectedId,
} from '@module/workflow-definition/store';

import { InspectorNode, type NodeTab } from './InspectorNode';
import { InspectorWorkflow } from './InspectorWorkflow';

export const WorkflowDefinitionInspector: React.FC = () => {
	const selectedId = useCoreSelector(selectEditorSelectedId);
	const nodeDefinition = useCoreSelector(selectEditorNodeDefinition);
	// A node definition has no workflow settings: with nothing selected, its own node is shown.
	const shownId = selectedId ?? nodeDefinition?.rootId ?? null;
	const node = useCoreSelector((state) => selectEditorNode(state, shownId));
	const [tab, setTab] = useState<NodeTab>('setup');

	if (!node) return <InspectorWorkflow />;
	return (
		<InspectorNode
			key={node.id}
			node={node}
			isDefinitionRoot={node.id === nodeDefinition?.rootId}
			tab={tab}
			onTabChange={setTab}
		/>
	);
};
