import React, { useEffect, useMemo } from 'react';

import '@xyflow/react/dist/style.css';

import { Group, Paper, Text } from '@mantine/core';
import {
	Background,
	BackgroundVariant,
	Controls,
	MarkerType,
	Panel,
	ReactFlow,
	useReactFlow,
	type Edge,
	type NodeTypes,
} from '@xyflow/react';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import {
	buildRunGraph,
	GRAPH_NODE_HEIGHT,
	GRAPH_NODE_WIDTH,
	isNodeReached,
	nodeRunStatusMeta,
	flattenDefinitionNodes,
} from '@module/workflow-run/data';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';

import classes from './WorkflowRunGraph.module.scss';
import type { WorkflowRunGraphFlowNode } from './WorkflowRunGraph.types';
import { WorkflowRunGraphGroup } from './WorkflowRunGraphGroup';
import { WorkflowRunGraphNode } from './WorkflowRunGraphNode';

const nodeTypes: NodeTypes = { run: WorkflowRunGraphNode, runGroup: WorkflowRunGraphGroup };

const FIT_VIEW_OPTIONS = { padding: 0.18, maxZoom: 1 };

const LEGEND = ['succeeded', 'running', 'failed', 'pending'] as const;

interface WorkflowRunGraphProps {
	definition: Pick<WorkflowDefinition, 'content'>;
	detail: WorkflowRunDetail;
	debug: Record<string, WorkflowRunNodeDebug>;
	selectedNodeId: string | null;
	onSelect: (nodeId: string | null) => void;
}

export const WorkflowRunGraph: React.FC<WorkflowRunGraphProps> = ({
	definition,
	detail,
	debug,
	selectedNodeId,
	onSelect,
}) => {
	const flow = useReactFlow();
	const graph = useMemo(() => buildRunGraph(definition.content), [definition.content]);

	// Recentre when the definition changes, not on every engine tick.
	useEffect(() => {
		const frame = requestAnimationFrame(() => flow.fitView({ ...FIT_VIEW_OPTIONS, duration: 250 }));
		return () => cancelAnimationFrame(frame);
	}, [flow, graph]);

	const nodes: WorkflowRunGraphFlowNode[] = [
		...graph.groups.map((group) => ({
			id: `group:${group.node.id}`,
			type: 'runGroup' as const,
			position: { x: group.x, y: group.y },
			width: group.width,
			height: group.height,
			draggable: false,
			selectable: false,
			zIndex: 0,
			data: {
				name: group.node.name,
				reached: flattenDefinitionNodes(group.node.nodes ?? []).some((child) =>
					isNodeReached(detail.nodes[child.id]?.status ?? 'pending'),
				),
			},
		})),
		...graph.nodes.map((item) => {
			const occurrence = detail.nodes[item.node.id] ?? null;
			return {
				id: item.node.id,
				type: 'run' as const,
				position: { x: item.x, y: item.y },
				width: GRAPH_NODE_WIDTH,
				height: GRAPH_NODE_HEIGHT,
				draggable: false,
				selected: item.node.id === selectedNodeId,
				zIndex: 1,
				data: {
					node: item.node,
					occurrence,
					debug: occurrence ? (debug[occurrence.occurrence_id] ?? null) : null,
					current: detail.current_node_id === item.node.id,
				},
			};
		}),
	];

	const edges: Edge[] = graph.edges.map((edge) => {
		const sourceStatus = detail.nodes[edge.source]?.status ?? 'pending';
		const targetStatus = detail.nodes[edge.target]?.status ?? 'pending';
		const traversed = isNodeReached(sourceStatus) && isNodeReached(targetStatus);

		return {
			id: edge.id,
			source: edge.source,
			target: edge.target,
			type: 'smoothstep',
			animated: traversed && targetStatus === 'running',
			label: edge.label,
			className: traversed ? classes.edgeActive : classes.edgeIdle,
			data: { kind: edge.kind },
			labelBgPadding: [6, 3] as [number, number],
			labelBgBorderRadius: 4,
			labelStyle: { fontSize: 10, fontWeight: 500 },
			markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
			zIndex: 2,
		};
	});

	return (
		<div className={classes.root}>
			<ReactFlow<WorkflowRunGraphFlowNode>
				nodes={nodes}
				edges={edges}
				nodeTypes={nodeTypes}
				onNodeClick={(_event, node) => onSelect(node.type === 'run' ? node.id : null)}
				onPaneClick={() => onSelect(null)}
				nodesConnectable={false}
				edgesFocusable={false}
				fitView
				fitViewOptions={FIT_VIEW_OPTIONS}
				minZoom={0.25}
				maxZoom={1.6}
				proOptions={{ hideAttribution: true }}
			>
				<Background variant={BackgroundVariant.Dots} gap={16} size={1.2} color="var(--mantine-color-gray-4)" />
				<Controls showInteractive={false} position="bottom-left" />

				<Panel position="top-right">
					<Paper className={classes.legend} px="sm" py={6} withBorder>
						<Group gap="md">
							{LEGEND.map((status) => (
								<Group key={status} gap={5} wrap="nowrap">
									<span className={classes.legendDot} data-status={status} />
									<Text fz={11} c="dimmed">
										{nodeRunStatusMeta[status].label}
									</Text>
								</Group>
							))}
						</Group>
					</Paper>
				</Panel>
			</ReactFlow>
		</div>
	);
};
