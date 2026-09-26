import React from 'react';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import { LuCircleAlert } from 'react-icons/lu';

import type { WorkflowDefinitionErrorCopy } from '@module/workflow-definition/data';
import { useListWorkflowDefinitionVersionsQuery } from '@module/workflow-definition/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

interface WorkflowDefinitionDeleteModalProps {
	definition: WorkflowDefinition | null;
	loading: boolean;
	error: WorkflowDefinitionErrorCopy | null;
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
	const versions = useListWorkflowDefinitionVersionsQuery(definition?.lineage_id ?? skipToken);
	const siblings = versions.currentData?.items.filter((item) => item.id !== definition?.id).length ?? 0;

	return (
		<Modal
			opened={!!definition}
			onClose={onClose}
			title="Delete workflow definition version"
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
					v{definition?.version}? Only this version is removed. This cannot be undone.
				</Text>
				{siblings > 0 && (
					<Text fz="sm" c="dimmed">
						{siblings} other {siblings === 1 ? 'version' : 'versions'} of this workflow will remain.
					</Text>
				)}

				{error && (
					<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />} title={error.title}>
						{error.detail}
					</Alert>
				)}

				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={onClose} disabled={loading}>
						Cancel
					</Button>
					<Button color="red" loading={loading} onClick={() => definition && onConfirm(definition)}>
						Delete version
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
