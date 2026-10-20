import React, { useState } from 'react';

import { Button, Group, Stack, Text, Textarea } from '@mantine/core';

import { parseRawPayload } from './WorkflowRunInputModal.utils';

interface WorkflowRunInputRawBodyProps {
	onCancel: () => void;
	/** Resolves once the engine accepted the payload; a rejection's message is shown. */
	onSubmit: (payload: unknown) => Promise<void>;
}

export const WorkflowRunInputPayloadField: React.FC<{
	value: string;
	onChange: (value: string) => void;
}> = ({ value, onChange }) => (
	<Textarea
		label="Payload"
		description="Raw JSON body, exactly as the input channel would receive it"
		placeholder='{ "approved": true }'
		autosize
		minRows={6}
		maxRows={18}
		value={value}
		styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
		onChange={(event) => onChange(event.currentTarget.value)}
	/>
);

/** Today's raw JSON delivery, for an input without a form or whose form can't be loaded. */
export const WorkflowRunInputRawBody: React.FC<WorkflowRunInputRawBodyProps> = ({ onCancel, onSubmit }) => {
	const [raw, setRaw] = useState('');
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const submit = async () => {
		const parsed = parseRawPayload(raw);
		if (!parsed) {
			setError('Payload must be valid JSON');
			return;
		}

		setError(null);
		setSubmitting(true);
		try {
			await onSubmit(parsed.payload);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to deliver input');
		} finally {
			setSubmitting(false);
		}
	};

	return (
		<Stack gap="md">
			<WorkflowRunInputPayloadField value={raw} onChange={setRaw} />

			{error && (
				<Text fz="xs" c="red.7">
					{error}
				</Text>
			)}

			<Group justify="flex-end" gap="xs">
				<Button variant="default" onClick={onCancel} disabled={submitting}>
					Cancel
				</Button>
				<Button onClick={submit} loading={submitting}>
					Submit input
				</Button>
			</Group>
		</Stack>
	);
};
