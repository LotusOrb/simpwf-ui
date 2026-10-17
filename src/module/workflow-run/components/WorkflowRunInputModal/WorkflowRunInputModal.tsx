import React, { useState } from 'react';

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	CopyButton,
	Group,
	Modal,
	Select,
	Stack,
	Text,
	Textarea,
	TextInput,
} from '@mantine/core';
import { LuCheck, LuCopy, LuInfo } from 'react-icons/lu';

import type { WorkflowRunPendingInput } from '@module/workflow-run/types/WorkflowRunPendingInput';
import type { WorkflowRunBranchInput } from '@module/workflow-run/utils';

interface WorkflowRunInputModalProps {
	opened: boolean;
	/** The run's own parked input; takes precedence over branches. */
	pending: WorkflowRunPendingInput | null;
	/** Parallel branches parked on an http input while the run waits on their join. */
	branches?: WorkflowRunBranchInput[];
	/** Preselects a branch; defaults to the first parked one. */
	branchId?: string | null;
	onClose: () => void;
	/** Resolves once the engine accepted the payload; a rejection keeps the modal open. */
	onSubmit: (payload: unknown, branchId?: string) => Promise<void>;
}

export const WorkflowRunInputModal: React.FC<WorkflowRunInputModalProps> = ({
	opened,
	pending,
	branches = [],
	branchId,
	onClose,
	onSubmit,
}) => {
	const [raw, setRaw] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);
	const [picked, setPicked] = useState<string | null>(null);

	// The run's own input wins; otherwise the requested branch, and only while it is still parked.
	const requested = picked ?? branchId ?? null;
	const branch = pending
		? null
		: requested
			? (branches.find((item) => item.branch.id === requested) ?? null)
			: (branches[0] ?? null);
	const target = pending ?? branch?.pending ?? null;

	const close = () => {
		setRaw('');
		setError(null);
		setPicked(null);
		onClose();
	};

	const submit = async () => {
		if (!target) return;

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
			await onSubmit(payload, branch?.branch.id);
			close();
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to deliver input');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Modal opened={opened} onClose={close} title="Provide workflow input" centered size="md">
			{target && (
				<Stack gap="md">
					{branches.length > 1 && !pending && (
						<Select
							label="Branch"
							description="Parallel branches parked on an input node"
							data={branches.map((item) => ({
								value: item.branch.id,
								label: `${item.branch.name} · ${item.node.name}`,
							}))}
							value={branch?.branch.id ?? null}
							allowDeselect={false}
							onChange={(value) => {
								setPicked(value);
								setError(null);
							}}
						/>
					)}

					<Alert color="blue" icon={<LuInfo size={16} />} p="sm">
						{branch ? (
							<Text fz="xs">
								Branch <strong>{branch.branch.name}</strong> is parked on{' '}
								<strong>{branch.node.name}</strong>. The payload is written to context key{' '}
								<strong>{target.output_property}</strong> of that branch; the join decides what reaches
								the run.
							</Text>
						) : (
							<Text fz="xs">
								The run is parked on <strong>{target.node_id}</strong>. The payload is written to
								context key <strong>{target.output_property || target.node_id}</strong>.
							</Text>
						)}
						<Badge size="xs" variant="light" mt={6}>
							channel {target.channel}
						</Badge>
					</Alert>

					{target.form_id && (
						<TextInput
							label="Form"
							description="The forms-library form this input expects. Send a payload matching it below."
							inputWrapperOrder={['label', 'input', 'description']}
							value={target.form_id}
							readOnly
							styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
							rightSection={
								<CopyButton value={target.form_id} timeout={1500}>
									{({ copied, copy }) => (
										<ActionIcon
											aria-label={copied ? 'Form ID copied' : 'Copy form ID'}
											onClick={copy}
										>
											{copied ? <LuCheck size={14} /> : <LuCopy size={14} />}
										</ActionIcon>
									)}
								</CopyButton>
							}
						/>
					)}

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
			{!target && (
				<Stack gap="md">
					<Text fz="sm">
						Nothing is waiting for input any more. The run may have moved on since you opened this.
					</Text>
					<Group justify="flex-end">
						<Button variant="default" onClick={close}>
							Close
						</Button>
					</Group>
				</Stack>
			)}
		</Modal>
	);
};
