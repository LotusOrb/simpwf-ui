import React from 'react';

import { Group, Progress, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';

import { nodeTypeMeta } from '@module/workflow-definition/data';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { formatDuration, type WorkflowRunProgress } from '@module/workflow-run/data';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';

import classes from './WorkflowRunSummary.module.scss';

interface WorkflowRunSummaryProps {
	detail: WorkflowRunDetail;
	progress: WorkflowRunProgress;
	currentNode: WorkflowDefinitionNode | null;
	elapsedMs: number;
}

export const WorkflowRunSummary: React.FC<WorkflowRunSummaryProps> = ({ detail, progress, currentNode, elapsedMs }) => {
	const currentTypeMeta = currentNode ? nodeTypeMeta[currentNode.type] : null;

	const stats: { label: string; value: React.ReactNode; title?: string }[] = [
		{ label: 'Elapsed', value: formatDuration(elapsedMs) },
		{
			label: 'Current node',
			value: currentNode ? (
				<Group gap={5} wrap="nowrap">
					{currentTypeMeta && <currentTypeMeta.icon size={12} aria-hidden />}
					<span className={classes.truncate}>{currentNode.name}</span>
				</Group>
			) : (
				'—'
			),
			title: currentNode?.name,
		},
		{ label: 'Attempt', value: `#${detail.attempt}` },
		{ label: 'Context mode', value: detail.context_mode },
		{
			label: 'Started',
			value: detail.started_at ? dayjs(detail.started_at).format('DD MMM HH:mm:ss') : '—',
		},
		{
			label: 'Finished',
			value: detail.finished_at ? dayjs(detail.finished_at).format('DD MMM HH:mm:ss') : '—',
		},
	];

	return (
		<div className={classes.root}>
			<div className={classes.progress}>
				<Group justify="space-between" gap="xs" mb={6}>
					<Text fz={10} c="dimmed" tt="uppercase" fw={600} lts={0.4}>
						Progress
					</Text>
					<Text fz="xs" fw={600} className={classes.numeric}>
						{progress.settled}/{progress.total} nodes
					</Text>
				</Group>
				<Tooltip label={`${progress.percent}% of nodes settled`}>
					<Progress.Root size="lg" radius="sm">
						<Progress.Section
							value={progress.percent}
							color={progress.failed > 0 ? 'red' : 'teal'}
							animated={detail.status === 'running'}
						/>
					</Progress.Root>
				</Tooltip>
			</div>

			<div className={classes.stats}>
				{stats.map((stat) => (
					<div key={stat.label} className={classes.stat}>
						<Text fz={10} c="dimmed" tt="uppercase" fw={600} lts={0.4}>
							{stat.label}
						</Text>
						<Text component="div" fz="sm" fw={500} className={classes.value} title={stat.title}>
							{stat.value}
						</Text>
					</div>
				))}
			</div>
		</div>
	);
};
