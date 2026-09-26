import React from 'react';

import { ActionIcon, Alert, Badge, Button, Group, Switch, Text, Title, Tooltip } from '@mantine/core';
import {
	LuArrowLeft,
	LuHourglass,
	LuPanelLeft,
	LuPanelRight,
	LuPause,
	LuPlay,
	LuSquare,
	LuTriangleAlert,
	LuUndo2,
} from 'react-icons/lu';
import { Link } from 'react-router';

import { useAppLayoutPanel } from '@module/app/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { formatWaitingReason, getAllowedActions } from '@module/workflow-run/data';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';

import { WorkflowRunIdText } from '../WorkflowRunIdText';
import { WorkflowRunStatusBadge } from '../WorkflowRunStatusBadge';
import classes from './WorkflowRunDetailHeader.module.scss';

interface WorkflowRunDetailHeaderProps {
	definition: Pick<WorkflowDefinition, 'name' | 'version'>;
	detail: WorkflowRunDetail;
	/** The node a run parked on input is waiting at. */
	pendingNode: WorkflowDefinitionNode | null;
	backTo: string;
	live: boolean;
	onLiveChange: (live: boolean) => void;
	/** Rendered between the title row and the alerts. */
	summary: React.ReactNode;
	pending: { pause: boolean; resume: boolean; stop: boolean; rollback: boolean };
	canRollback: boolean;
	actionError: string | null;
	onDismissActionError: () => void;
	onProvideInput: () => void;
	onPause: () => void;
	onResume: () => void;
	onRollback: () => void;
	onStop: () => void;
}

export const WorkflowRunDetailHeader: React.FC<WorkflowRunDetailHeaderProps> = ({
	definition,
	detail,
	pendingNode,
	backTo,
	live,
	onLiveChange,
	summary,
	pending,
	canRollback,
	actionError,
	onDismissActionError,
	onProvideInput,
	onPause,
	onResume,
	onRollback,
	onStop,
}) => {
	const panel = useAppLayoutPanel();
	const actions = getAllowedActions(detail);
	const busy = pending.pause || pending.resume || pending.stop || pending.rollback;

	return (
		<div className={classes.root}>
			<Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
				<Group gap="sm" wrap="nowrap" className={classes.headerTitle}>
					<Tooltip label="Back to runs">
						<ActionIcon
							component={Link}
							to={backTo}
							variant="subtle"
							color="gray"
							size={34}
							aria-label="Back to runs"
						>
							<LuArrowLeft size={18} />
						</ActionIcon>
					</Tooltip>
					<div className={classes.titleBlock}>
						<Group gap={8} wrap="nowrap">
							<Title order={2} fz={20} className={classes.title} title={definition.name}>
								{definition.name}
							</Title>
							<Badge size="sm" color="gray">
								v{definition.version}
							</Badge>
							<WorkflowRunStatusBadge run={detail} />
						</Group>
						<Group gap="sm" wrap="nowrap">
							<WorkflowRunIdText id={detail.id} />
							<Text fz="xs" c="dimmed">
								started by {detail.created_by}
							</Text>
						</Group>
					</div>
				</Group>

				<Group gap="xs" wrap="nowrap">
					<Switch
						label="Live"
						size="sm"
						checked={live}
						onChange={(event) => onLiveChange(event.currentTarget.checked)}
					/>

					{detail.pending_input && (
						<Button size="sm" leftSection={<LuHourglass size={15} />} onClick={onProvideInput}>
							Provide input
						</Button>
					)}
					{actions.includes('pause') && (
						<Button
							size="sm"
							variant="default"
							leftSection={<LuPause size={15} />}
							loading={pending.pause}
							disabled={busy}
							onClick={onPause}
						>
							Pause
						</Button>
					)}
					{actions.includes('resume') && (
						<Button
							size="sm"
							variant="default"
							leftSection={<LuPlay size={15} />}
							loading={pending.resume}
							disabled={busy}
							onClick={onResume}
						>
							Resume
						</Button>
					)}
					{canRollback && (
						<Button
							size="sm"
							variant="default"
							color="grape"
							leftSection={<LuUndo2 size={15} />}
							loading={pending.rollback}
							disabled={busy}
							onClick={onRollback}
						>
							Roll back
						</Button>
					)}
					{actions.includes('stop') && (
						<Button
							size="sm"
							variant="light"
							color="red"
							leftSection={<LuSquare size={14} />}
							loading={pending.stop}
							disabled={busy}
							onClick={onStop}
						>
							Stop
						</Button>
					)}

					<Tooltip label={panel.opened.left ? 'Hide context' : 'Show context'}>
						<ActionIcon
							variant="default"
							size={30}
							aria-label="Toggle context panel"
							aria-pressed={panel.opened.left}
							onClick={() => panel.toggle('left')}
						>
							<LuPanelLeft size={16} />
						</ActionIcon>
					</Tooltip>
					<Tooltip label={panel.opened.right ? 'Hide node details' : 'Show node details'}>
						<ActionIcon
							variant="default"
							size={30}
							aria-label="Toggle node details panel"
							aria-pressed={panel.opened.right}
							onClick={() => panel.toggle('right')}
						>
							<LuPanelRight size={16} />
						</ActionIcon>
					</Tooltip>
				</Group>
			</Group>

			{summary}

			{actionError && (
				<Alert
					color="red"
					icon={<LuTriangleAlert size={16} />}
					p="sm"
					withCloseButton
					onClose={onDismissActionError}
				>
					<Text fz="xs">{actionError}</Text>
				</Alert>
			)}

			{detail.error && (
				<Alert color="red" icon={<LuTriangleAlert size={16} />} title="Run failed" p="sm">
					<Text fz="xs" className={classes.mono}>
						{detail.error}
					</Text>
				</Alert>
			)}
			{!detail.error && detail.waiting_reason && (
				<Alert color="yellow" icon={<LuHourglass size={16} />} p="sm">
					{detail.pending_input ? (
						<Text fz="xs">
							Waiting for input on <strong>{pendingNode?.name ?? detail.pending_input.node_id}</strong>
							<Text span fz="xs" c="dimmed">
								{' · '}
								{detail.pending_input.channel} →{' '}
								{detail.pending_input.output_property || detail.pending_input.node_id}
							</Text>
						</Text>
					) : (
						<Text fz="xs">{formatWaitingReason(detail.waiting_reason)}</Text>
					)}
				</Alert>
			)}
		</div>
	);
};
