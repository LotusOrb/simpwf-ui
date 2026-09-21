import React from 'react';

import { Badge, Card, Group, Skeleton, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuClock, LuHourglass, LuTimer, LuTriangleAlert } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunAction } from '@module/workflow-run/types/WorkflowRunAction';

import { formatRunDuration } from '../../data';
import { WorkflowRunActions } from '../WorkflowRunActions';
import { WorkflowRunIdText } from '../WorkflowRunIdText';
import { WorkflowRunStatusBadge } from '../WorkflowRunStatusBadge';
import classes from './WorkflowRunCard.module.scss';

dayjs.extend(relativeTime);

export interface WorkflowRunDefinitionInfo {
	name: string;
	version: number;
}

interface WorkflowRunCardProps {
	run: WorkflowRun;
	definition?: WorkflowRunDefinitionInfo;
	busy?: boolean;
	onAction: (run: WorkflowRun, action: WorkflowRunAction) => void;
}

export const WorkflowRunCard: React.FC<WorkflowRunCardProps> = ({ run, definition, busy, onAction }) => {
	const navigate = useNavigate();
	const startedAt = run.started_at ?? run.created_at;
	const detailPath = `/app/workflow-run/${run.id}`;

	// Clicks on nested controls (copy id, actions menu — including its portalled dropdown) stay local.
	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		if ((event.target as HTMLElement).closest('button, a, [role="menu"]')) return;
		navigate(detailPath);
	};

	const handleKeyDown = (event: React.KeyboardEvent<HTMLElement>) => {
		if (event.target !== event.currentTarget || event.key !== 'Enter') return;
		navigate(detailPath);
	};

	return (
		<Card
			className={classes.root}
			data-status={run.status}
			role="link"
			tabIndex={0}
			aria-label={`Open run ${definition?.name ?? run.id}`}
			onClick={handleClick}
			onKeyDown={handleKeyDown}
		>
			<Group justify="space-between" wrap="nowrap">
				<WorkflowRunStatusBadge run={run} />
				<WorkflowRunActions run={run} busy={busy} withDetailLink={false} onAction={onAction} />
			</Group>

			<Group gap={6} mt="sm" wrap="nowrap">
				<Text fz="sm" fw={600} truncate title={definition?.name}>
					{definition?.name ?? 'Unknown definition'}
				</Text>
				{definition && (
					<Badge size="xs" color="gray" className={classes.version}>
						v{definition.version}
					</Badge>
				)}
			</Group>
			<WorkflowRunIdText id={run.id} />

			<div className={classes.detail}>
				{run.error ? (
					<Group gap={6} wrap="nowrap" align="flex-start" c="red.7">
						<LuTriangleAlert size={13} className={classes.detailIcon} aria-hidden />
						<Text fz="xs" lineClamp={2} inherit title={run.error}>
							{run.error}
						</Text>
					</Group>
				) : run.waiting_reason ? (
					<Group gap={6} wrap="nowrap" align="flex-start" c="yellow.8">
						<LuHourglass size={13} className={classes.detailIcon} aria-hidden />
						<Text fz="xs" lineClamp={2} inherit>
							{run.waiting_reason}
						</Text>
					</Group>
				) : (
					<Text fz="xs" c="dimmed">
						No issues reported
					</Text>
				)}
			</div>

			<Group gap="md" c="dimmed" className={classes.footer}>
				<Tooltip label={dayjs(startedAt).format('DD MMM YYYY HH:mm:ss')}>
					<Group gap={4} wrap="nowrap">
						<LuClock size={12} aria-hidden />
						<Text fz="xs">{dayjs(startedAt).fromNow()}</Text>
					</Group>
				</Tooltip>
				<Group gap={4} wrap="nowrap">
					<LuTimer size={12} aria-hidden />
					<Text fz="xs" className={classes.numeric}>
						{formatRunDuration(run)}
					</Text>
				</Group>
			</Group>
		</Card>
	);
};

export const WorkflowRunCardSkeleton: React.FC = () => (
	<Card className={classes.root}>
		<Group justify="space-between">
			<Skeleton height={18} width={80} radius="sm" />
			<Skeleton height={18} width={18} radius="sm" />
		</Group>
		<Skeleton height={12} width="65%" mt="sm" />
		<Skeleton height={8} width="35%" mt={8} />
		<Skeleton height={34} mt="sm" radius="sm" />
		<Skeleton height={8} width="55%" mt="md" />
	</Card>
);
