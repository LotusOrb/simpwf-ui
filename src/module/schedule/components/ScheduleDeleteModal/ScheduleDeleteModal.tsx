import React from 'react';

import { Alert, Button, Group, Modal, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import type { Schedule } from '@module/schedule/types/Schedule';

interface ScheduleDeleteModalProps {
	schedule: Schedule | null;
	/** The workflow it starts, when known. */
	workflowLabel?: string | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
	onConfirm: (schedule: Schedule) => void;
}

export const ScheduleDeleteModal: React.FC<ScheduleDeleteModalProps> = ({
	schedule,
	workflowLabel,
	loading,
	error,
	onClose,
	onConfirm,
}) => {
	return (
		<Modal
			opened={!!schedule}
			onClose={onClose}
			title="Delete schedule"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<Stack gap="md">
				<Text fz="sm">
					Stop{' '}
					<Text span fw={600} ff="monospace">
						{schedule?.crontab}
					</Text>{' '}
					from starting {workflowLabel ? <b>{workflowLabel}</b> : 'its workflow'}? Runs it already started
					keep going. This cannot be undone.
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
					<Button color="red" loading={loading} onClick={() => schedule && onConfirm(schedule)}>
						Delete
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
