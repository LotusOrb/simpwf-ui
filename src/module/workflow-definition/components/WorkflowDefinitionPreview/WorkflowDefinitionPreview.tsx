import React from 'react';

import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';

import { layoutGraph, nodeTypeMeta } from '../../data';
import classes from './WorkflowDefinitionPreview.module.scss';

const NODE_WIDTH = 46;
const NODE_HEIGHT = 16;
const COLUMN_GAP = 22;
const ROW_GAP = 12;
const PADDING = 14;

interface WorkflowDefinitionPreviewProps {
	content: WorkflowDefinitionContent;
}

export const WorkflowDefinitionPreview: React.FC<WorkflowDefinitionPreviewProps> = ({ content }) => {
	const layout = layoutGraph(content);

	const columnRows = new Map<number, number>();
	for (const node of layout.nodes) columnRows.set(node.column, (columnRows.get(node.column) ?? 0) + 1);

	const positions = new Map(
		layout.nodes.map((node) => {
			const offset = (layout.rows - (columnRows.get(node.column) ?? 1)) / 2;
			return [
				node.id,
				{
					x: PADDING + node.column * (NODE_WIDTH + COLUMN_GAP),
					y: PADDING + (node.row + offset) * (NODE_HEIGHT + ROW_GAP),
				},
			];
		}),
	);

	const width = PADDING * 2 + layout.columns * NODE_WIDTH + Math.max(0, layout.columns - 1) * COLUMN_GAP;
	const height = PADDING * 2 + layout.rows * NODE_HEIGHT + (layout.rows - 1) * ROW_GAP;

	return (
		<svg viewBox={`0 0 ${width} ${height}`} className={classes.root} role="img" aria-label="Workflow graph preview">
			{layout.edges.map((edge) => {
				const from = positions.get(edge.from)!;
				const to = positions.get(edge.to)!;
				const startX = from.x + NODE_WIDTH;
				const startY = from.y + NODE_HEIGHT / 2;
				const endY = to.y + NODE_HEIGHT / 2;
				const midX = startX + COLUMN_GAP / 2;
				const d =
					to.x > from.x
						? `M${startX},${startY} H${midX} V${endY} H${to.x}`
						: `M${startX},${startY} h6 V${endY + NODE_HEIGHT} H${to.x - 6} V${endY} H${to.x}`;
				return <path key={`${edge.from}-${edge.to}`} d={d} className={classes.edge} />;
			})}

			{layout.nodes.map((node) => {
				const { x, y } = positions.get(node.id)!;
				return (
					<g key={node.id} transform={`translate(${x} ${y})`}>
						<rect width={NODE_WIDTH} height={NODE_HEIGHT} rx={4} className={classes.node} />
						<circle
							cx={8}
							cy={NODE_HEIGHT / 2}
							r={3}
							fill={`var(--mantine-color-${nodeTypeMeta[node.type]?.color ?? 'gray'}-6)`}
						/>
						<rect x={15} y={NODE_HEIGHT / 2 - 1.5} width={24} height={3} rx={1.5} className={classes.bar} />
					</g>
				);
			})}
		</svg>
	);
};
