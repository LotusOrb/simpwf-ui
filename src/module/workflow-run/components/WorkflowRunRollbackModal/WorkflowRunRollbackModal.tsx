import React, { useState } from 'react';

import { Alert, Button, Group, Modal, Radio, ScrollArea, Stack, Text, TextInput } from '@mantine/core';
import dayjs from 'dayjs';
import { LuTriangleAlert } from 'react-icons/lu';

import { formatDuration, type WorkflowRunTimelineEntry } from '@module/workflow-run/data';

interface WorkflowRunRollbackModalProps {
	opened: boolean;
	targets: WorkflowRunTimelineEntry[];
	initialNodeId?: string | null;
	onClose: () => void;
	onConfirm: (nodeId: string, reason: string) => void;
}

export const WorkflowRunRollbackModal: React.FC<WorkflowRunRollbackModalProps> = ({
	opened,
	targets,
	initialNodeId,
	onClose,
	onConfirm,
}) => {
	const [picked, setPicked] = useState<string | null>(null);
	const [reason, setReason] = useState('');

	// Until the user picks explicitly, follow whatever the caller pointed at.
	const nodeId = picked ?? initialNodeId ?? targets.at(-1)?.nodeId ?? null;

	const close = () => {
		setPicked(null);
		setReason('');
		onClose();
	};

	return (
		<Modal opened={opened} onClose={close} title="Roll back this run" centered size="md">
			<Stack gap="md">
				<Alert color="yellow" icon={<LuTriangleAlert size={16} />} p="sm">
					<Text fz="xs">
						Every occurrence from the selected node onwards is marked rolled back and the context is
						restored to the snapshot taken before that node ran. The run is then left paused.
					</Text>
				</Alert>

				{targets.length === 0 ? (
					<Text fz="sm" c="dimmed">
						No occurrence can be rolled back to yet.
					</Text>
				) : (
					<Radio.Group value={nodeId} onChange={setPicked} label="Target occurrence">
						<ScrollArea.Autosize mah={240} type="auto" mt="xs">
							<Stack gap={6} pr="sm">
								{targets.map((entry) => (
									<Radio
										key={entry.occurrenceId}
										value={entry.nodeId}
										label={
											<Group gap={8} wrap="nowrap">
												<Text fz="sm">{entry.name}</Text>
												<Text fz="xs" c="dimmed">
													{dayjs(entry.startedAt).format('HH:mm:ss')} ·{' '}
													{formatDuration(entry.durationMs)}
												</Text>
											</Group>
										}
									/>
								))}
							</Stack>
						</ScrollArea.Autosize>
					</Radio.Group>
				)}

				<TextInput
					label="Audit reason"
					placeholder="Why is this run being rewound?"
					value={reason}
					onChange={(event) => setReason(event.currentTarget.value)}
				/>

				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={close}>
						Cancel
					</Button>
					<Button
						color="grape"
						disabled={!nodeId}
						onClick={() => {
							if (nodeId) onConfirm(nodeId, reason);
							close();
						}}
					>
						Roll back
					</Button>
				</Group>
			</Stack>
		</Modal>
	);
};
