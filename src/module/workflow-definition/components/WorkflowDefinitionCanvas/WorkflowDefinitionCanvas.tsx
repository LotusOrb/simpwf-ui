import React, { useEffect } from 'react';

import '@xyflow/react/dist/style.css';

import { Anchor, Breadcrumbs, Paper, Stack, Text, ThemeIcon } from '@mantine/core';
import {
	Background,
	BackgroundVariant,
	Controls,
	MarkerType,
	MiniMap,
	Panel,
	ReactFlow,
	useReactFlow,
	type Edge,
	type NodeTypes,
} from '@xyflow/react';
import { LuMousePointerClick } from 'react-icons/lu';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import {
	HANDLE_FAILURE,
	HANDLE_NEXT,
	isInlineGroup,
	nodeTypeMeta,
	outgoingTarget,
	scopeKey,
	scopeTrail,
	startNodeId,
} from '@module/workflow-definition/data';
import {
	PALETTE_DRAG_TYPE,
	useWorkflowDefinitionEditorAddNode,
	type WorkflowDefinitionPaletteItem,
} from '@module/workflow-definition/hooks';
import {
	connected,
	edgesChanged,
	nodeSelected,
	nodesChanged,
	scopeEntered,
	selectEditorEdges,
	selectEditorIssues,
	selectEditorNodes,
	selectEditorScope,
	selectEditorSelectedId,
	selectEditorStarts,
} from '@module/workflow-definition/store';

import classes from './WorkflowDefinitionCanvas.module.scss';
import type { WorkflowDefinitionFlowNode, WorkflowDefinitionStepFlowNode } from './WorkflowDefinitionCanvas.types';
import { WorkflowDefinitionStartNode } from './WorkflowDefinitionStartNode';
import { WorkflowDefinitionStepNode } from './WorkflowDefinitionStepNode';

const nodeTypes: NodeTypes = { step: WorkflowDefinitionStepNode, start: WorkflowDefinitionStartNode };

const FIT_VIEW_OPTIONS = { padding: 0.25, maxZoom: 1 };

export const WorkflowDefinitionCanvas: React.FC = () => {
	const dispatch = useCoreDispatch();
	const flow = useReactFlow();
	const addNode = useWorkflowDefinitionEditorAddNode();

	const nodes = useCoreSelector(selectEditorNodes);
	const starts = useCoreSelector(selectEditorStarts);
	const edges = useCoreSelector(selectEditorEdges);
	const scope = useCoreSelector(selectEditorScope);
	const selectedId = useCoreSelector(selectEditorSelectedId);
	const issues = useCoreSelector(selectEditorIssues);

	useEffect(() => {
		const frame = requestAnimationFrame(() => flow.fitView({ ...FIT_VIEW_OPTIONS, duration: 200 }));
		return () => cancelAnimationFrame(frame);
	}, [scope, flow]);

	const issueCounts = new Map<string, number>();
	for (const issue of issues) {
		if (issue.nodeId) issueCounts.set(issue.nodeId, (issueCounts.get(issue.nodeId) ?? 0) + 1);
	}

	const allNodes = Object.values(nodes);
	const visibleNodes = allNodes.filter((node) => node.parentId === scope);
	const startId = startNodeId(scope);
	const start = starts[scopeKey(scope)] ?? { position: { x: 0, y: 0 } };

	const flowNodes: WorkflowDefinitionFlowNode[] = [
		{
			id: startId,
			type: 'start',
			position: start.position,
			measured: start.measured,
			deletable: false,
			selectable: false,
			data: { connected: !!outgoingTarget(edges, startId, HANDLE_NEXT) },
		},
		...visibleNodes.map((node) => ({
			id: node.id,
			type: 'step' as const,
			position: node.position,
			measured: node.measured,
			selected: node.id === selectedId,
			data: {
				node,
				issueCount: issueCounts.get(node.id) ?? 0,
				childCount: allNodes.filter((child) => child.parentId === node.id).length,
				branchTargets: Object.fromEntries(
					node.branches.map((branch) => [branch.id, !!outgoingTarget(edges, node.id, `branch:${branch.id}`)]),
				),
			},
		})),
	];

	const visibleIds = new Set(flowNodes.map((node) => node.id));
	const flowEdges: Edge[] = edges
		.filter((edge) => visibleIds.has(edge.source) && visibleIds.has(edge.target))
		.map((edge) => {
			const failure = edge.sourceHandle === HANDLE_FAILURE;
			const branch = edge.sourceHandle.startsWith('branch:')
				? nodes[edge.source]?.branches.find((item) => `branch:${item.id}` === edge.sourceHandle)
				: undefined;
			return {
				id: edge.id,
				source: edge.source,
				sourceHandle: edge.sourceHandle,
				target: edge.target,
				selected: edge.selected,
				type: 'smoothstep',
				label: failure ? 'on failure' : branch?.key || undefined,
				className: failure ? classes.failureEdge : undefined,
				labelBgPadding: [6, 3] as [number, number],
				labelBgBorderRadius: 4,
				labelStyle: { fontSize: 11, fontWeight: 500 },
				markerEnd: { type: MarkerType.ArrowClosed, width: 16, height: 16 },
			};
		});

	const trail = scopeTrail(nodes, scope);

	const onDrop = (event: React.DragEvent) => {
		const raw = event.dataTransfer.getData(PALETTE_DRAG_TYPE);
		if (!raw) return;
		event.preventDefault();
		addNode(JSON.parse(raw) as WorkflowDefinitionPaletteItem, { x: event.clientX, y: event.clientY });
	};

	return (
		<div className={classes.root}>
			<ReactFlow<WorkflowDefinitionFlowNode>
				nodes={flowNodes}
				edges={flowEdges}
				nodeTypes={nodeTypes}
				onNodesChange={(changes) => dispatch(nodesChanged(changes))}
				onEdgesChange={(changes) => dispatch(edgesChanged(changes))}
				onConnect={(connection) => dispatch(connected(connection))}
				isValidConnection={(connection) => connection.source !== connection.target}
				onNodeDoubleClick={(_event, node) => {
					if (node.type === 'step' && isInlineGroup(node.data.node)) dispatch(scopeEntered(node.id));
				}}
				onPaneClick={() => dispatch(nodeSelected(null))}
				onDragOver={(event) => {
					if (!event.dataTransfer.types.includes(PALETTE_DRAG_TYPE)) return;
					event.preventDefault();
					event.dataTransfer.dropEffect = 'move';
				}}
				onDrop={onDrop}
				deleteKeyCode={['Backspace', 'Delete']}
				fitView
				fitViewOptions={FIT_VIEW_OPTIONS}
				minZoom={0.2}
				snapToGrid
				snapGrid={[8, 8]}
				proOptions={{ hideAttribution: true }}
			>
				<Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="var(--mantine-color-gray-4)" />
				<Controls showInteractive={false} position="bottom-left" />
				<MiniMap
					position="bottom-right"
					pannable
					zoomable
					className={classes.minimap}
					nodeColor={(node) => {
						if (node.type !== 'step') return 'var(--mantine-color-gray-5)';
						const { type } = (node as WorkflowDefinitionStepFlowNode).data.node.config;
						return `var(--mantine-color-${nodeTypeMeta[type].color}-4)`;
					}}
				/>

				{scope && (
					<Panel position="top-left">
						<Paper className={classes.trail} px="sm" py={6}>
							<Breadcrumbs separator="›" separatorMargin={6}>
								<Anchor
									component="button"
									type="button"
									fz="sm"
									onClick={() => dispatch(scopeEntered(null))}
								>
									Workflow
								</Anchor>
								{trail.map((group, index) =>
									index === trail.length - 1 ? (
										<Text key={group.id} fz="sm" fw={600}>
											{group.config.name}
										</Text>
									) : (
										<Anchor
											key={group.id}
											component="button"
											type="button"
											fz="sm"
											onClick={() => dispatch(scopeEntered(group.id))}
										>
											{group.config.name}
										</Anchor>
									),
								)}
							</Breadcrumbs>
						</Paper>
					</Panel>
				)}

				{visibleNodes.length === 0 && (
					<Panel position="top-center" className={classes.emptyPanel}>
						<Stack align="center" gap={6} className={classes.empty}>
							<ThemeIcon size={40} radius="xl" variant="light" color="gray">
								<LuMousePointerClick size={18} />
							</ThemeIcon>
							<Text fw={600} fz="sm">
								{scope ? 'This group is empty' : 'Start building your workflow'}
							</Text>
							<Text fz="xs" c="dimmed" ta="center" maw={280}>
								Drag a node from the left panel, then connect Start to it. Connect a node's right handle
								to the next step.
							</Text>
						</Stack>
					</Panel>
				)}
			</ReactFlow>
		</div>
	);
};
