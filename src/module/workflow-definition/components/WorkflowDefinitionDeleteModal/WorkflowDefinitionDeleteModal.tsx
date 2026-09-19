import React from 'react';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

interface WorkflowDefinitionDeleteModalProps {
	definition: WorkflowDefinition | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
	onConfirm: (definition: WorkflowDefinition) => void;
}

export const WorkflowDefinitionDeleteModal: React.FC<WorkflowDefinitionDeleteModalProps> = ({
	definition,
	loading,
	error,
	onClose,
	onConfirm,
}) => {
	return (
		<Modal
			opened={!!definition}
			onClose={onClose}
			title="Delete workflow definition"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<Stack gap="md">
				<Text fz="sm">
					Delete{' '}
					<Text span fw={600}>
						{definition?.name}
					</Text>{' '}
					v{definition?.version}? This cannot be undone.
				</Text>

				{error && (
					<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />}>
						{error}
					</Alert>
				)}

				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button color="red" loading={loading} onClick={() => definition && onConfirm(definition)}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
