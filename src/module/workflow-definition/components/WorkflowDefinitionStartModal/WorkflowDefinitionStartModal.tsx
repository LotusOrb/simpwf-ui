import React, { useState } from 'react';

import { Button, Group, Modal, Stack, Switch, Text } from '@mantine/core';
import { LuPlay } from 'react-icons/lu';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

interface WorkflowDefinitionStartModalProps {
	/** The version to start; null keeps the modal closed. */
	definition: Pick<WorkflowDefinition, 'name' | 'version'> | null;
	starting: boolean;
	onClose: () => void;
	onStart: (debug: boolean) => void;
}

export const WorkflowDefinitionStartModal: React.FC<WorkflowDefinitionStartModalProps> = ({
	definition,
	starting,
	onClose,
	onStart,
}) => {
	const [debug, setDebug] = useState(false);

	const close = () => {
		setDebug(false);
		onClose();
	};

	return (
		<Modal opened={!!definition} onClose={close} title="Start a run" centered>
			<Stack gap="md">
				<Text fz="sm">
					Start a new run of{' '}
					<strong>
						{definition?.name} v{definition?.version}
					</strong>
					.
				</Text>
				<Switch
					label="Debug (step-through)"
					description="Starts paused and pauses again after every node; each Step runs one node. Debug runs feed context types to the script editors."
					checked={debug}
					onChange={(event) => setDebug(event.currentTarget.checked)}
				/>
				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={close}>
						Cancel
					</Button>
					<Button leftSection={<LuPlay size={14} />} loading={starting} onClick={() => onStart(debug)}>
						Start run
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
