import React from 'react';

import { Badge, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuRefreshCw } from 'react-icons/lu';

import { nodeTypeMeta } from '@module/workflow-definition/data';
import { formatDuration, nodeRunStatusMeta } from '@module/workflow-run/data';

import classes from './WorkflowRunGraph.module.scss';
import type { WorkflowRunStepFlowNode } from './WorkflowRunGraph.types';

export const WorkflowRunGraphNode: React.FC<NodeProps<WorkflowRunStepFlowNode>> = ({ data, selected }) => {
	const { node, occurrence, debug, current } = data;
	const typeMeta = nodeTypeMeta[node.type];
	const status = occurrence?.status ?? 'pending';
	const statusMeta = nodeRunStatusMeta[status];
	const retried = (debug?.attempt_count ?? 1) > 1;

	return (
		<div
			className={classes.node}
			data-status={status}
			data-current={current || undefined}
			data-selected={selected || undefined}
		>
			<Handle type="target" position={Position.Left} className={classes.handle} />

			<div className={classes.nodeHead}>
				<ThemeIcon size={30} radius="sm" variant="light" color={typeMeta.color}>
					<typeMeta.icon size={15} />
				</ThemeIcon>
				<div className={classes.nodeTitle}>
					<Text fz="sm" fw={600} truncate title={node.name}>
						{node.name}
					</Text>
					<Text fz={11} c="dimmed" truncate>
						{typeMeta.label}
					</Text>
				</div>
				<Tooltip label={statusMeta.label}>
					<span className={classes.statusDot} data-spin={status === 'running' || undefined}>
						<statusMeta.icon size={13} />
					</span>
				</Tooltip>
			</div>

			<div className={classes.nodeFoot}>
				<Badge size="xs" variant="light" color={statusMeta.color} className={classes.statusBadge}>
					{statusMeta.label}
				</Badge>
				{retried && (
					<Tooltip label={`${debug?.attempt_count} attempts`}>
						<span className={classes.attempts}>
							<LuRefreshCw size={10} aria-hidden />
							{debug?.attempt_count}
						</span>
					</Tooltip>
				)}
				<Text fz={11} c="dimmed" className={classes.duration}>
					{formatDuration(debug?.duration_ms ?? null)}
				</Text>
			</div>

			<Handle type="source" position={Position.Right} className={classes.handle} />
		</div>
	);
};
