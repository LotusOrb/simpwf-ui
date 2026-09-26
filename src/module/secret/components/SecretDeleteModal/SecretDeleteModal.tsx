import React from 'react';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import { secretReference } from '@module/secret/data';
import type { Secret } from '@module/secret/types/Secret';

interface SecretDeleteModalProps {
	secret: Secret | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
	onConfirm: (secret: Secret) => void;
}

export const SecretDeleteModal: React.FC<SecretDeleteModalProps> = ({ secret, loading, error, onClose, onConfirm }) => {
	return (
		<Modal
			opened={!!secret}
			onClose={onClose}
			title="Delete secret"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<Stack gap="md">
				<Text fz="sm">
					Delete{' '}
					<Text span fw={600} ff="monospace">
						{secret?.key}
					</Text>
					? Workflows that reference{' '}
					<Text span ff="monospace" fz="xs">
						{secret && secretReference(secret.key)}
					</Text>{' '}
					will no longer resolve it. This cannot be undone.
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
					<Button color="red" loading={loading} onClick={() => secret && onConfirm(secret)}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
