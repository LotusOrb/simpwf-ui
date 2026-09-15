import React from 'react';

import { ActionIcon, CopyButton, Group, Text, Tooltip } from '@mantine/core';
import { LuCheck, LuCopy } from 'react-icons/lu';

import { shortRunId } from '../../data';

interface WorkflowRunIdTextProps {
	id: string;
}

export const WorkflowRunIdText: React.FC<WorkflowRunIdTextProps> = ({ id }) => {
	return (
		<Group gap={2} wrap="nowrap">
			<Tooltip label={id}>
				<Text fz="xs" c="dimmed" ff="monospace">
					#{shortRunId(id)}
				</Text>
			</Tooltip>
			<CopyButton value={id} timeout={1500}>
				{({ copied, copy }) => (
					<ActionIcon
						size="xs"
						color={copied ? 'teal' : 'gray'}
						onClick={copy}
						aria-label={copied ? 'Run ID copied' : 'Copy run ID'}
					>
						{copied ? <LuCheck size={11} /> : <LuCopy size={11} />}
					</ActionIcon>
				)}
			</CopyButton>
		</Group>
	);
};
