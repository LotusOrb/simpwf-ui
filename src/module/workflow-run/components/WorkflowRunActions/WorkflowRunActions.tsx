import React from 'react';

import { ActionIcon, Loader, Menu } from '@mantine/core';
import { LuEllipsisVertical, LuEye, LuPause, LuPlay, LuSquare } from 'react-icons/lu';
import { Link } from 'react-router';

import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunAction } from '@module/workflow-run/types/WorkflowRunAction';

import { getAllowedActions } from '../../data';

interface WorkflowRunActionsProps {
	run: WorkflowRun;
	busy?: boolean;
	/** Hidden where the surrounding row or card already navigates to the detail page. */
	withDetailLink?: boolean;
	onAction: (run: WorkflowRun, action: WorkflowRunAction) => void;
}

export const WorkflowRunActions: React.FC<WorkflowRunActionsProps> = ({
	run,
	busy,
	withDetailLink = true,
	onAction,
}) => {
	const allowed = getAllowedActions(run);

	if (busy) {
		return (
			<ActionIcon size="sm" disabled aria-label="Updating run">
				<Loader size={12} />
			</ActionIcon>
		);
	}

	if (!withDetailLink && allowed.length === 0) return null;

	return (
		<Menu position="bottom-end" withinPortal shadow="sm">
			<Menu.Target>
				<ActionIcon size="sm" aria-label="Run actions">
					<LuEllipsisVertical size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown miw={170}>
				{withDetailLink && (
					<Menu.Item component={Link} to={`/app/workflow-run/${run.id}`} leftSection={<LuEye size={14} />}>
						View detail
					</Menu.Item>
				)}
				{withDetailLink && allowed.length > 0 && <Menu.Divider />}
				{allowed.includes('pause') && (
					<Menu.Item leftSection={<LuPause size={14} />} onClick={() => onAction(run, 'pause')}>
						Pause
					</Menu.Item>
				)}
				{allowed.includes('resume') && (
					<Menu.Item leftSection={<LuPlay size={14} />} onClick={() => onAction(run, 'resume')}>
						Resume
					</Menu.Item>
				)}
				{allowed.includes('stop') && (
					<Menu.Item color="red" leftSection={<LuSquare size={14} />} onClick={() => onAction(run, 'stop')}>
						Stop
					</Menu.Item>
				)}
			</Menu.Dropdown>
		</Menu>
	);
};
