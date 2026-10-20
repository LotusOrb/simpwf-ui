import React, { useState } from 'react';

import { Alert, Button, Group, List, Stack, Tabs, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import type { JsonSchema } from '@common/types/JsonSchema';

import { FormRenderer } from '@module/form-engine/components/FormRenderer';
import { useFormEngine } from '@module/form-engine/hooks';
import { validateFormPayload } from '@module/form-engine/utils';

import { parseRawPayload } from './WorkflowRunInputModal.utils';
import { WorkflowRunInputPayloadField } from './WorkflowRunInputRawBody';

type InputTab = 'form' | 'raw';

interface WorkflowRunInputFormBodyProps {
	schema: JsonSchema;
	ui: unknown;
	context?: Record<string, unknown>;
	onCancel: () => void;
	/** Resolves once the engine accepted the payload; a rejection's message is shown. */
	onSubmit: (payload: unknown) => Promise<void>;
}

/**
 * Delivery through the input's form, with raw JSON as a second tab. Both are checked against the form, since the
 * engine no longer does; raw JSON can still be sent past a failed check on purpose.
 */
export const WorkflowRunInputFormBody: React.FC<WorkflowRunInputFormBodyProps> = ({
	schema,
	ui,
	context,
	onCancel,
	onSubmit,
}) => {
	const engine = useFormEngine({ schema, ui, context });
	const [tab, setTab] = useState<InputTab>('form');
	const [raw, setRaw] = useState('');
	const [rawIssues, setRawIssues] = useState<string[]>([]);
	const [error, setError] = useState<string | null>(null);
	const [submitting, setSubmitting] = useState(false);

	const deliver = async (payload: unknown) => {
		setError(null);
		setSubmitting(true);
		try {
			await onSubmit(payload);
		} catch (err) {
			setError(err instanceof Error ? err.message : 'Failed to deliver input');
		} finally {
			setSubmitting(false);
		}
	};

	const switchTab = (next: InputTab) => {
		// Carry what's been filled in over to raw JSON, unless raw already has its own edits.
		if (next === 'raw' && !raw.trim()) setRaw(JSON.stringify(engine.payload, null, 2));
		setRawIssues([]);
		setError(null);
		setTab(next);
	};

	const submit = async (force = false) => {
		if (tab === 'form') {
			const payload = engine.submit();
			if (payload) await deliver(payload);
			return;
		}

		const parsed = parseRawPayload(raw);
		if (!parsed) {
			setError('Payload must be valid JSON');
			return;
		}
		if (!force) {
			const result = validateFormPayload(engine.model, parsed.payload);
			if (!result.success) {
				setRawIssues(
					Object.entries(result.errors).map(([path, message]) => (path ? `${path}: ${message}` : message)),
				);
				return;
			}
		}
		setRawIssues([]);
		await deliver(parsed.payload);
	};

	return (
		<Stack gap="md">
			<Tabs value={tab} onChange={(value) => value && switchTab(value as InputTab)}>
				<Tabs.List>
					<Tabs.Tab value="form">Form</Tabs.Tab>
					<Tabs.Tab value="raw">Raw JSON</Tabs.Tab>
				</Tabs.List>
			</Tabs>

			{tab === 'form' ? (
				<FormRenderer engine={engine} disabled={submitting} />
			) : (
				<WorkflowRunInputPayloadField
					value={raw}
					onChange={(value) => {
						setRaw(value);
						setRawIssues([]);
					}}
				/>
			)}

			{rawIssues.length > 0 && (
				<Alert color="yellow" variant="light" icon={<LuCircleAlert size={16} />} p="sm">
					<Stack gap={6}>
						<Text fz="xs" fw={600}>
							This payload doesn't match the form
						</Text>
						<List size="xs" spacing={2}>
							{rawIssues.map((issue) => (
								<List.Item key={issue}>{issue}</List.Item>
							))}
						</List>
						<Text fz="xs" c="dimmed">
							Only the node's validation script checks payloads on the engine, so it may still accept it.
						</Text>
					</Stack>
				</Alert>
			)}

			{error && (
				<Text fz="xs" c="red.7">
					{error}
				</Text>
			)}

			<Group justify="flex-end" gap="xs">
				<Button variant="default" onClick={onCancel} disabled={submitting}>
					Cancel
				</Button>
				{rawIssues.length > 0 && (
					<Button variant="light" color="yellow" onClick={() => submit(true)} loading={submitting}>
						Send anyway
					</Button>
				)}
				{/* A stepper form submits from its last step; earlier steps move on with its own Next. */}
				{(tab === 'raw' || engine.step.isLast) && (
					<Button onClick={() => submit()} loading={submitting}>
						Submit input
					</Button>
				)}
			</Group>
		</Stack>
	);
};
