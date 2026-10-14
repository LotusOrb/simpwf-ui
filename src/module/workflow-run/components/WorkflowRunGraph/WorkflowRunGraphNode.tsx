import React from 'react';

import { Badge, Text, ThemeIcon, Tooltip } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuBug, LuGitMerge, LuRefreshCw, LuTimer } from 'react-icons/lu';

import { nodeDefinitionTypeMeta } from '@module/node-definition/data';
import { nodeSubtitle, shownStartDelay } from '@module/workflow-definition/data';
import { formatDuration, nodeRunStatusMeta } from '@module/workflow-run/data';

import classes from './WorkflowRunGraph.module.scss';
import type { WorkflowRunStepFlowNode } from './WorkflowRunGraph.types';

export const WorkflowRunGraphNode: React.FC<NodeProps<WorkflowRunStepFlowNode>> = ({ data, selected }) => {
	const { node, occurrence, debug, current, debugCursor, join } = data;
	// Custom types registered with the engine have no editor meta; they get the library's generic look.
	const typeMeta = nodeDefinitionTypeMeta(node.type);
	const status = occurrence?.status ?? 'pending';
	const statusMeta = nodeRunStatusMeta[status];
	const retried = (debug?.attempt_count ?? 1) > 1;
	const startDelay = shownStartDelay(node);

	return (
		<div
			className={classes.node}
			data-status={status}
			data-current={current || undefined}
			data-debug-cursor={debugCursor || undefined}
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
						{nodeSubtitle(node, typeMeta.label)}
					</Text>
				</div>
				{startDelay && (
					<Tooltip label={`Waits ${startDelay} on arrival`}>
						<span className={classes.startDelay}>
							<LuTimer size={10} aria-hidden />
							{startDelay}
						</span>
					</Tooltip>
				)}
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
				{join && (
					<Tooltip label="Branches finished of the latest fork">
						<Badge size="xs" variant="light" color="indigo" leftSection={<LuGitMerge size={9} />}>
							{join.completed}/{join.total} branches
						</Badge>
					</Tooltip>
				)}
				{debugCursor && (
					<Badge size="xs" variant="light" color="grape" leftSection={<LuBug size={9} />}>
						Paused here
					</Badge>
				)}
				<Text fz={11} c="dimmed" className={classes.duration}>
					{formatDuration(debug?.duration_ms ?? null)}
				</Text>
			</div>

			<Handle type="source" position={Position.Right} className={classes.handle} />
		</div>
	);
};
