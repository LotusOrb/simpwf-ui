import { useStoreApi, useReactFlow } from '@xyflow/react';

import { useCoreDispatch, useCoreStore } from '@core/store';

import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import { createEditorNode, scopeKey } from '@module/workflow-definition/data';
import {
	jsonDraftChanged,
	nodeAdded,
	nodeConfigChanged,
	nodeRawChanged,
	selectEditorNodes,
	selectEditorScope,
	selectEditorStarts,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorBranch } from '@module/workflow-definition/types/WorkflowDefinitionEditorBranch';
import type { WorkflowDefinitionJsonField } from '@module/workflow-definition/types/WorkflowDefinitionJsonField';
import type { WorkflowDefinitionNodeConfig } from '@module/workflow-definition/types/WorkflowDefinitionNodeConfig';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

export type WorkflowDefinitionPaletteItem = { type: WorkflowDefinitionNodeType } | { definition: NodeDefinition };

export const PALETTE_DRAG_TYPE = 'application/x-simpwf-node';

const NODE_ANCHOR = { x: 110, y: 30 };
const FREE_SPOT_GAP = { x: 240, y: 110 };

export const useWorkflowDefinitionEditorAddNode = () => {
	const dispatch = useCoreDispatch();
	const store = useCoreStore();
	const flow = useReactFlow();
	const flowStore = useStoreApi();

	return (item: WorkflowDefinitionPaletteItem, screenPoint?: { x: number; y: number }) => {
		const state = store.getState();
		const nodes = selectEditorNodes(state);
		const scope = selectEditorScope(state);

		let point = screenPoint;
		if (!point) {
			const rect = flowStore.getState().domNode?.getBoundingClientRect();
			if (!rect) return;
			point = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
		}

		const center = flow.screenToFlowPosition(point);
		const position = { x: center.x - NODE_ANCHOR.x, y: center.y - NODE_ANCHOR.y };

		if (!screenPoint) {
			const start = selectEditorStarts(state)[scopeKey(scope)];
			const occupied = [
				...Object.values(nodes).filter((node) => node.parentId === scope),
				...(start ? [start] : []),
			];
			const isFree = () =>
				occupied.every(
					(node) =>
						Math.abs(node.position.x - position.x) >= FREE_SPOT_GAP.x ||
						Math.abs(node.position.y - position.y) >= FREE_SPOT_GAP.y,
				);
			for (let attempt = 0; attempt < 20 && !isFree(); attempt++) position.y += FREE_SPOT_GAP.y;
		}

		dispatch(nodeAdded(createEditorNode(nodes, scope, position, item)));
	};
};

export const useWorkflowDefinitionEditorNodeActions = (id: string) => {
	const dispatch = useCoreDispatch();

	return {
		patch: (patch: Partial<WorkflowDefinitionNodeConfig>) => dispatch(nodeConfigChanged({ id, patch })),
		replaceRaw: (config: WorkflowDefinitionNodeConfig, branches?: WorkflowDefinitionEditorBranch[]) =>
			dispatch(nodeRawChanged({ id, config, branches })),
		setJsonDraft: (field: WorkflowDefinitionJsonField, text: string | null) =>
			dispatch(jsonDraftChanged({ id, field, text })),
	};
};
