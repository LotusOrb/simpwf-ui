import React, { useMemo } from 'react';

import '@xyflow/react/dist/style.css';

import { Text, ThemeIcon, Tooltip } from '@mantine/core';
import {
	Background,
	BackgroundVariant,
	Controls,
	Handle,
	MarkerType,
	Position,
	ReactFlow,
	ReactFlowProvider,
	type Edge,
	type Node,
	type NodeProps,
	type NodeTypes,
} from '@xyflow/react';
import { LuBoxes } from 'react-icons/lu';

import { nodeDefinitionTypeMeta } from '@module/node-definition/data';
import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { buildRunGraph, GRAPH_NODE_HEIGHT, GRAPH_NODE_WIDTH } from '@module/workflow-run/data';

import classes from './WorkflowRunMigrateModal.module.scss';

// Shorter than the run canvas nodes: the picker has no status footer.
const PICK_NODE_HEIGHT = 56;

interface PickNodeData extends Record<string, unknown> {
	node: WorkflowDefinitionNode;
	disabled: boolean;
	picked: boolean;
	/** Where the source run stopped; usually the node to resume from. */
	source: boolean;
}

interface PickGroupData extends Record<string, unknown> {
	name: string;
}

type PickFlowNode = Node<PickNodeData, 'pick'> | Node<PickGroupData, 'pickGroup'>;

const PickNode: React.FC<NodeProps<Node<PickNodeData, 'pick'>>> = ({ data }) => {
	const meta = nodeDefinitionTypeMeta(data.node.type);
	const body = (
		<div
			className={classes.node}
			data-disabled={data.disabled || undefined}
			data-picked={data.picked || undefined}
			data-source={data.source || undefined}
		>
			<Handle type="target" position={Position.Left} />
			<ThemeIcon size={28} radius="sm" variant="light" color={meta.color}>
				<meta.icon size={14} />
			</ThemeIcon>
			<div className={classes.nodeTitle}>
				<Text fz="sm" fw={600} truncate title={data.node.name}>
					{data.node.name}
				</Text>
				<Text fz={11} c="dimmed" truncate>
					{data.source ? `${meta.label} · source position` : meta.label}
				</Text>
			</div>
			<Handle type="source" position={Position.Right} />
		</div>
	);

	return data.disabled ? <Tooltip label="Inside a parallel region; can't start here">{body}</Tooltip> : body;
};

const PickGroup: React.FC<NodeProps<Node<PickGroupData, 'pickGroup'>>> = ({ data }) => (
	<div className={classes.group}>
		<div className={classes.groupLabel}>
			<LuBoxes size={12} aria-hidden />
			<Text fz={11} fw={600} span>
				{data.name}
			</Text>
		</div>
	</div>
);

const nodeTypes: NodeTypes = { pick: PickNode, pickGroup: PickGroup };

interface WorkflowRunMigrateGraphProps {
	content: WorkflowDefinitionContent;
	disabled: Set<string>;
	value: string | null;
	sourceNodeId: string | null;
	onChange: (nodeId: string) => void;
}

/** Read-only target graph where clicking a node picks it as the migration start. */
export const WorkflowRunMigrateGraph: React.FC<WorkflowRunMigrateGraphProps> = ({
	content,
	disabled,
	value,
	sourceNodeId,
	onChange,
}) => {
	const graph = useMemo(() => buildRunGraph(content), [content]);
	// The run layout spaces rows for taller nodes; the picker keeps those positions and centres its shorter ones.
	const rowOffset = (GRAPH_NODE_HEIGHT - PICK_NODE_HEIGHT) / 2;

	const nodes: PickFlowNode[] = [
		...graph.groups.map((group) => ({
			id: `group:${group.node.id}`,
			type: 'pickGroup' as const,
			position: { x: group.x, y: group.y },
			width: group.width,
			height: group.height,
			draggable: false,
			selectable: false,
			zIndex: 0,
			data: { name: group.node.name },
		})),
		...graph.nodes.map((item) => ({
			id: item.node.id,
			type: 'pick' as const,
			position: { x: item.x, y: item.y + rowOffset },
			width: GRAPH_NODE_WIDTH,
			height: PICK_NODE_HEIGHT,
			draggable: false,
			zIndex: 1,
			data: {
				node: item.node,
				disabled: disabled.has(item.node.id),
				picked: item.node.id === value,
				source: item.node.id === sourceNodeId,
			},
		})),
	];

	const edges: Edge[] = graph.edges.map((edge) => ({
		id: edge.id,
		source: edge.source,
		target: edge.target,
		type: 'smoothstep',
		label: edge.label,
		className: classes.edge,
		labelBgPadding: [6, 3] as [number, number],
		labelBgBorderRadius: 4,
		labelStyle: { fontSize: 10, fontWeight: 500 },
		markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14 },
		zIndex: 2,
	}));

	return (
		<div className={classes.graph}>
			{/* Its own store, so it never shares one with a run canvas the modal opens over. */}
			<ReactFlowProvider>
				<ReactFlow<PickFlowNode>
					nodes={nodes}
					edges={edges}
					nodeTypes={nodeTypes}
					onNodeClick={(_event, node) => {
						if (node.type === 'pick' && !disabled.has(node.id)) onChange(node.id);
					}}
					nodesConnectable={false}
					nodesDraggable={false}
					edgesFocusable={false}
					fitView
					fitViewOptions={{ padding: 0.15, maxZoom: 1 }}
					minZoom={0.2}
					maxZoom={1.6}
					proOptions={{ hideAttribution: true }}
				>
					<Background
						variant={BackgroundVariant.Dots}
						gap={16}
						size={1.2}
						color="var(--mantine-color-gray-4)"
					/>
					<Controls showInteractive={false} position="bottom-left" />
				</ReactFlow>
			</ReactFlowProvider>
		</div>
	);
};
