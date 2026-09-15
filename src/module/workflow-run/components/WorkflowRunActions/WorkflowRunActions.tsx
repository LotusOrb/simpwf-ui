import React from 'react';

import { ActionIcon, Loader, Menu } from '@mantine/core';
import { LuEllipsisVertical, LuEye, LuPause, LuPlay, LuSquare } from 'react-icons/lu';

import { getAllowedActions, type WorkflowRun, type WorkflowRunAction } from '../../data';

interface WorkflowRunActionsProps {
	run: WorkflowRun;
	busy?: boolean;
	onAction: (run: WorkflowRun, action: WorkflowRunAction) => void;
}

export const WorkflowRunActions: React.FC<WorkflowRunActionsProps> = ({ run, busy, onAction }) => {
	const allowed = getAllowedActions(run);

	if (busy) {
		return (
			<ActionIcon size="sm" disabled aria-label="Updating run">
				<Loader size={12} />
			</ActionIcon>
		);
	}

	return (
		<Menu position="bottom-end" withinPortal shadow="sm">
			<Menu.Target>
				<ActionIcon size="sm" aria-label="Run actions">
					<LuEllipsisVertical size={16} />
				</ActionIcon>
			</Menu.Target>
			<Menu.Dropdown miw={170}>
				<Menu.Item leftSection={<LuEye size={14} />}>View detail</Menu.Item>
				{allowed.length > 0 && <Menu.Divider />}
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
