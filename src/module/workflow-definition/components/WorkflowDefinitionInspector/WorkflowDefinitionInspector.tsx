import React, { useState } from 'react';

import { useCoreSelector } from '@core/store';

import { selectEditorNode, selectEditorSelectedId } from '@module/workflow-definition/store';

import { InspectorNode, type NodeTab } from './InspectorNode';
import { InspectorWorkflow } from './InspectorWorkflow';

export const WorkflowDefinitionInspector: React.FC = () => {
	const selectedId = useCoreSelector(selectEditorSelectedId);
	const node = useCoreSelector((state) => selectEditorNode(state, selectedId));
	const [tab, setTab] = useState<NodeTab>('setup');
	// Kept across nodes, so stepping through the graph keeps the same run's types.
	const [debugRunId, setDebugRunId] = useState<string | null>(null);

	return node ? (
		<InspectorNode
			key={node.id}
			node={node}
			tab={tab}
			onTabChange={setTab}
			debugRunId={debugRunId}
			onDebugRunChange={setDebugRunId}
		/>
	) : (
		<InspectorWorkflow />
	);
};
