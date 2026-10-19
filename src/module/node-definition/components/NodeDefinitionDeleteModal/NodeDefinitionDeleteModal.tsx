import React from 'react';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { NodeDefinitionErrorCopy } from '@module/node-definition/utils';

interface NodeDefinitionDeleteModalProps {
	definition: NodeDefinition | null;
	loading: boolean;
	error: NodeDefinitionErrorCopy | null;
	onClose: () => void;
	onConfirm: (definition: NodeDefinition) => void;
}

export const NodeDefinitionDeleteModal: React.FC<NodeDefinitionDeleteModalProps> = ({
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
			title="Delete node definition version"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<Stack gap="md">
				<Text fz="sm">
					Delete{' '}
					<Text span fw={600}>
						{definition?.name} v{definition?.version}
					</Text>
					? Other versions stay. The engine refuses while a workflow definition or run still uses it. This
					cannot be undone.
				</Text>

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
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
