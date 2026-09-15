import React from 'react';

import { Badge, Tooltip } from '@mantine/core';

import { runStatusMeta, type WorkflowRun } from '../../data';
import classes from './WorkflowRunStatusBadge.module.scss';

interface WorkflowRunStatusBadgeProps {
	run: WorkflowRun;
}

export const WorkflowRunStatusBadge: React.FC<WorkflowRunStatusBadgeProps> = ({ run }) => {
	const meta = runStatusMeta[run.status];
	const transition = run.termination_pending ? 'Stopping…' : run.pause_requested ? 'Pausing…' : null;

	const badge = (
		<Badge
			color={transition ? 'gray' : meta.color}
			leftSection={<meta.icon size={12} className={classes.icon} />}
			className={classes.root}
			data-status={run.status}
			data-transition={transition ? true : undefined}
		>
			{transition ?? meta.label}
		</Badge>
	);

	return transition ? (
		<Tooltip
			label={
				run.termination_pending
					? 'Stop requested, cancelling the active node'
					: 'Pause requested, parks after the current node'
			}
		>
			{badge}
		</Tooltip>
	) : (
		badge
	);
};
