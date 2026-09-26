import React, { useState } from 'react';

import { Alert, Button, Group, Stack, Text, Textarea, TextInput } from '@mantine/core';
import { LuPencil, LuTriangleAlert } from 'react-icons/lu';

import { formatJson } from '@module/workflow-run/data';

import { WorkflowRunJsonView } from '../WorkflowRunJsonView';

interface WorkflowRunContextPanelProps {
	context: Record<string, unknown>;
	editable: boolean;
	onReplace: (context: Record<string, unknown>, reason: string) => void;
}

export const WorkflowRunContextPanel: React.FC<WorkflowRunContextPanelProps> = ({ context, editable, onReplace }) => {
	const [draft, setDraft] = useState<string | null>(null);
	const [reason, setReason] = useState('');
	const [error, setError] = useState<string | null>(null);

	const save = () => {
		try {
			const parsed = JSON.parse(draft ?? '');
			if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
				setError('Context must be a JSON object');
				return;
			}
			onReplace(parsed as Record<string, unknown>, reason);
			setDraft(null);
			setReason('');
			setError(null);
		} catch {
			setError('Context must be valid JSON');
		}
	};

	if (draft !== null) {
		return (
			<Stack gap="sm" p="md">
				<Alert color="yellow" icon={<LuTriangleAlert size={16} />} p="sm">
					<Text fz="xs">
						This replaces the whole context, exactly like <code>PUT /v1/workflow/instance/:id/context</code>
						. The reason is recorded in the audit trail.
					</Text>
				</Alert>
				<Textarea
					autosize
					minRows={12}
					maxRows={22}
					value={draft}
					styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
					onChange={(event) => setDraft(event.currentTarget.value)}
				/>
				<TextInput
					label="Audit reason"
					placeholder="X-Context-Update-Reason"
					value={reason}
					onChange={(event) => setReason(event.currentTarget.value)}
				/>
				{error && (
					<Text fz="xs" c="red.7">
						{error}
					</Text>
				)}
				<Group justify="flex-end" gap="xs">
					<Button variant="default" size="xs" onClick={() => setDraft(null)}>
						Cancel
					</Button>
					<Button size="xs" onClick={save}>
						Replace context
					</Button>
				</Group>
			</Stack>
		);
	}

	return (
		<Stack gap="sm" p="md">
			<Group justify="space-between">
				<Text fz="xs" c="dimmed">
					Live workflow context, as the engine would return it.
				</Text>
				{editable && (
					<Button
						size="xs"
						variant="light"
						leftSection={<LuPencil size={13} />}
						onClick={() => setDraft(formatJson(context) || '{}')}
					>
						Edit
					</Button>
				)}
			</Group>
			<WorkflowRunJsonView value={context} maxHeight="none" emptyLabel="Context is still empty" />
		</Stack>
	);
};
