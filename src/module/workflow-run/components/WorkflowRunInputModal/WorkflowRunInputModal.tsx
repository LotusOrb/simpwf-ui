import React, { useState } from 'react';

import { Alert, Badge, Button, Group, Modal, Stack, Text, Textarea } from '@mantine/core';
import { LuInfo } from 'react-icons/lu';

import type { WorkflowRunPendingInput } from '@module/workflow-run/types/WorkflowRunPendingInput';

interface WorkflowRunInputModalProps {
	pending: WorkflowRunPendingInput | null;
	onClose: () => void;
	/** Resolves once the engine accepted the payload; a rejection keeps the modal open. */
	onSubmit: (payload: unknown) => Promise<void>;
}

export const WorkflowRunInputModal: React.FC<WorkflowRunInputModalProps> = ({ pending, onClose, onSubmit }) => {
	const [raw, setRaw] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const close = () => {
		setRaw('');
		setError(null);
		onClose();
	};

	const submit = async () => {
		if (!pending) return;

		let payload: unknown;
		try {
			payload = raw.trim() ? JSON.parse(raw) : {};
		} catch {
			setError('Payload must be valid JSON');
			return;
		}

		setError(null);
		setSubmitting(true);
		try {
			await onSubmit(payload);
			close();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to deliver input');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal opened={!!pending} onClose={close} title="Provide workflow input" centered size="md">
			{pending && (
				<Stack gap="md">
					<Alert color="blue" icon={<LuInfo size={16} />} p="sm">
						<Text fz="xs">
							The run is parked on <strong>{pending.node_id}</strong>. The payload is written to context
							path <strong>{pending.context_path || '(root)'}</strong>.
						</Text>
						<Badge size="xs" variant="light" mt={6}>
							channel {pending.channel}
						</Badge>
					</Alert>

					<Textarea
						label="Payload"
						description="Raw JSON body, exactly as the input channel would receive it"
						placeholder='{ "approved": true }'
						autosize
						minRows={6}
						maxRows={18}
						value={raw}
						styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
						onChange={(event) => setRaw(event.currentTarget.value)}
					/>

					{error && (
						<Text fz="xs" c="red.7">
							{error}
						</Text>
					)}

					<Group justify="flex-end" gap="xs">
						<Button variant="default" onClick={close} disabled={submitting}>
							Cancel
						</Button>
						<Button onClick={submit} loading={submitting}>
							Submit input
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
};
