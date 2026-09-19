import { createSelector, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { Connection, EdgeChange, NodeChange } from '@xyflow/react';

import {
	branchHandle,
	descendantIds,
	EDITOR_METADATA_KEY,
	isStartNodeId,
	scopeKey,
	scopeOfStartNode,
	startNodeId,
	toEditorDocument,
	toWorkflowDefinitionContent,
	validateEditorDocument,
} from '@module/workflow-definition/data/workflow-definition.editor';
import type { WorkflowDefinitionEditorBranch } from '@module/workflow-definition/types/WorkflowDefinitionEditorBranch';
import type { WorkflowDefinitionEditorDocument } from '@module/workflow-definition/types/WorkflowDefinitionEditorDocument';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionJsonField } from '@module/workflow-definition/types/WorkflowDefinitionJsonField';
import type { WorkflowDefinitionNodeConfig } from '@module/workflow-definition/types/WorkflowDefinitionNodeConfig';

export interface WorkflowDefinitionEditorState extends WorkflowDefinitionEditorDocument {
	loadedKey: string | null;
	scope: string | null;
	selectedId: string | null;
	dirty: boolean;
}

const initialState: WorkflowDefinitionEditorState = {
	...toEditorDocument(null, {}),
	loadedKey: null,
	scope: null,
	selectedId: null,
	dirty: false,
};

const removeNodes = (state: WorkflowDefinitionEditorState, ids: string[]) => {
	const removed = new Set(
		ids.filter((id) => state.nodes[id]).flatMap((id) => [id, ...descendantIds(state.nodes, id)]),
	);
	if (removed.size === 0) return;

	const removedStarts = new Set([...removed].map(startNodeId));
	for (const id of removed) {
		delete state.nodes[id];
		delete state.starts[id];
	}
	state.edges = state.edges.filter(
		(edge) => !removed.has(edge.source) && !removed.has(edge.target) && !removedStarts.has(edge.source),
	);
	if (state.selectedId && removed.has(state.selectedId)) state.selectedId = null;
	state.dirty = true;
};

export const workflowDefinitionEditorSlice = createSlice({
	name: 'workflowDefinitionEditor',
	initialState,
	reducers: {
		editorLoaded: (_state, action: PayloadAction<{ key: string; document: WorkflowDefinitionEditorDocument }>) => ({
			...action.payload.document,
			loadedKey: action.payload.key,
			scope: null,
			selectedId: null,
			dirty: false,
		}),
		editorReset: () => initialState,
		editorSaved: (state) => {
			state.dirty = false;
		},
		nameChanged: (state, action: PayloadAction<string>) => {
			state.name = action.payload;
			state.dirty = true;
		},
		contextModeChanged: (state, action: PayloadAction<WorkflowDefinitionEditorState['contextMode']>) => {
			state.contextMode = action.payload;
			state.dirty = true;
		},
		scopeEntered: (state, action: PayloadAction<string | null>) => {
			state.scope = action.payload;
			state.selectedId = null;
			state.starts[scopeKey(action.payload)] ??= { position: { x: 0, y: 0 } };
		},
		nodeSelected: (state, action: PayloadAction<string | null>) => {
			state.selectedId = action.payload;
		},
		nodeAdded: (state, action: PayloadAction<WorkflowDefinitionEditorNode>) => {
			state.nodes[action.payload.id] = action.payload;
			state.selectedId = action.payload.id;
			state.dirty = true;
		},
		nodesRemoved: (state, action: PayloadAction<string[]>) => {
			removeNodes(state, action.payload);
		},
		nodeConfigChanged: (
			state,
			action: PayloadAction<{ id: string; patch: Partial<WorkflowDefinitionNodeConfig> }>,
		) => {
			const node = state.nodes[action.payload.id];
			if (!node) return;
			for (const [key, value] of Object.entries(action.payload.patch)) {
				if (value === undefined) delete node.config[key as keyof WorkflowDefinitionNodeConfig];
				else Object.assign(node.config, { [key]: value });
			}
			state.dirty = true;
		},
		nodeRawChanged: (
			state,
			action: PayloadAction<{
				id: string;
				config: WorkflowDefinitionNodeConfig;
				branches?: WorkflowDefinitionEditorBranch[];
			}>,
		) => {
			const node = state.nodes[action.payload.id];
			if (!node) return;
			const editorMetadata = node.config.metadata?.[EDITOR_METADATA_KEY];
			node.config = action.payload.config;
			if (editorMetadata !== undefined) {
				node.config.metadata = { ...node.config.metadata, [EDITOR_METADATA_KEY]: editorMetadata };
			}
			node.jsonDrafts = {};

			const { branches } = action.payload;
			if (branches) {
				const kept = new Set(branches.map((branch) => branchHandle(branch.id)));
				state.edges = state.edges.filter(
					(edge) =>
						edge.source !== node.id ||
						!edge.sourceHandle.startsWith('branch:') ||
						kept.has(edge.sourceHandle),
				);
				node.branches = branches;
			}
			state.dirty = true;
		},
		jsonDraftChanged: (
			state,
			action: PayloadAction<{ id: string; field: WorkflowDefinitionJsonField; text: string | null }>,
		) => {
			const node = state.nodes[action.payload.id];
			if (!node) return;
			if (action.payload.text === null) delete node.jsonDrafts[action.payload.field];
			else node.jsonDrafts[action.payload.field] = action.payload.text;
			state.dirty = true;
		},
		failureOutputPropertyChanged: (state, action: PayloadAction<{ id: string; value: string }>) => {
			const node = state.nodes[action.payload.id];
			if (!node) return;
			node.failureOutputProperty = action.payload.value;
			state.dirty = true;
		},
		branchAdded: (state, action: PayloadAction<{ id: string; branch: WorkflowDefinitionEditorBranch }>) => {
			state.nodes[action.payload.id]?.branches.push(action.payload.branch);
			state.dirty = true;
		},
		branchChanged: (
			state,
			action: PayloadAction<{ id: string; branchId: string; patch: Partial<WorkflowDefinitionEditorBranch> }>,
		) => {
			const branch = state.nodes[action.payload.id]?.branches.find((item) => item.id === action.payload.branchId);
			if (!branch) return;
			Object.assign(branch, action.payload.patch);
			state.dirty = true;
		},
		branchRemoved: (state, action: PayloadAction<{ id: string; branchId: string }>) => {
			const node = state.nodes[action.payload.id];
			if (!node) return;
			node.branches = node.branches.filter((branch) => branch.id !== action.payload.branchId);
			state.edges = state.edges.filter(
				(edge) => !(edge.source === node.id && edge.sourceHandle === `branch:${action.payload.branchId}`),
			);
			state.dirty = true;
		},
		nodesChanged: (state, action: PayloadAction<NodeChange[]>) => {
			for (const change of action.payload) {
				if (change.type === 'remove') {
					if (!isStartNodeId(change.id)) removeNodes(state, [change.id]);
					continue;
				}
				if (change.type !== 'position' && change.type !== 'dimensions' && change.type !== 'select') continue;

				const target = isStartNodeId(change.id)
					? state.starts[scopeKey(scopeOfStartNode(change.id))]
					: state.nodes[change.id];
				if (!target) continue;

				if (change.type === 'position' && change.position) {
					target.position = change.position;
					state.dirty = true;
				} else if (change.type === 'dimensions' && change.dimensions) {
					target.measured = change.dimensions;
				} else if (change.type === 'select' && !isStartNodeId(change.id)) {
					if (change.selected) state.selectedId = change.id;
					else if (state.selectedId === change.id) state.selectedId = null;
				}
			}
		},
		edgesChanged: (state, action: PayloadAction<EdgeChange[]>) => {
			for (const change of action.payload) {
				if (change.type === 'remove') {
					state.edges = state.edges.filter((edge) => edge.id !== change.id);
					state.dirty = true;
				} else if (change.type === 'select') {
					const edge = state.edges.find((item) => item.id === change.id);
					if (edge) edge.selected = change.selected;
				}
			}
		},
		connected: (state, action: PayloadAction<Connection>) => {
			const { source, sourceHandle, target } = action.payload;
			if (!sourceHandle || source === target || isStartNodeId(target)) return;

			state.edges = state.edges.filter((edge) => !(edge.source === source && edge.sourceHandle === sourceHandle));
			state.edges.push({ id: `${source}:${sourceHandle}`, source, sourceHandle, target });
			state.dirty = true;
		},
	},
	selectors: {
		selectEditorLoadedKey: (state) => state.loadedKey,
		selectEditorScope: (state) => state.scope,
		selectEditorSelectedId: (state) => state.selectedId,
		selectEditorName: (state) => state.name,
		selectEditorContextMode: (state) => state.contextMode,
		selectEditorDirty: (state) => state.dirty,
		selectEditorSourceId: (state) => state.sourceId,
		selectEditorSourceVersion: (state) => state.sourceVersion,
		selectEditorNodes: (state) => state.nodes,
		selectEditorStarts: (state) => state.starts,
		selectEditorEdges: (state) => state.edges,
		selectEditorNode: (state, id: string | null) => (id ? state.nodes[id] : undefined),
	},
});

export const {
	branchAdded,
	branchChanged,
	branchRemoved,
	connected,
	contextModeChanged,
	edgesChanged,
	editorLoaded,
	editorReset,
	editorSaved,
	failureOutputPropertyChanged,
	jsonDraftChanged,
	nameChanged,
	nodeAdded,
	nodeConfigChanged,
	nodeRawChanged,
	nodeSelected,
	nodesChanged,
	nodesRemoved,
	scopeEntered,
} = workflowDefinitionEditorSlice.actions;

export const {
	selectEditorContextMode,
	selectEditorLoadedKey,
	selectEditorDirty,
	selectEditorEdges,
	selectEditorName,
	selectEditorNode,
	selectEditorNodes,
	selectEditorScope,
	selectEditorSelectedId,
	selectEditorSourceId,
	selectEditorSourceVersion,
	selectEditorStarts,
} = workflowDefinitionEditorSlice.selectors;

export const selectEditorIssues = createSelector([workflowDefinitionEditorSlice.selectSlice], validateEditorDocument);

export const selectEditorContent = createSelector(
	[workflowDefinitionEditorSlice.selectSlice],
	toWorkflowDefinitionContent,
);
