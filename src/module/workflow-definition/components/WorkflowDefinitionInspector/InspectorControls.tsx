import React, { useState } from 'react';

import { ActionIcon, Button, Group, Stack, Text, TextInput, type TextInputProps } from '@mantine/core';
import { LuPlus, LuX } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { formatJson, isDuration, parseJsonDraft, readJsonField } from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionJsonField } from '@module/workflow-definition/types/WorkflowDefinitionJsonField';

export const SectionLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
	<Text fz="sm" fw={600} c="dark.6">
		{children}
		{required && (
			<Text component="span" c="red.6" inherit>
				*
			</Text>
		)}
	</Text>
);

interface DurationInputProps extends Omit<TextInputProps, 'value' | 'onChange'> {
	value: string | null | undefined;
	onChange: (value: string | undefined) => void;
}

export const DurationInput: React.FC<DurationInputProps> = ({ value, onChange, ...props }) => (
	<TextInput
		{...props}
		value={value ?? ''}
		onChange={(event) => onChange(event.currentTarget.value.trim() || undefined)}
		error={value && !isDuration(value) ? 'Use a duration like 30s or 5m' : undefined}
	/>
);

interface JsonFieldProps {
	node: WorkflowDefinitionEditorNode;
	field: WorkflowDefinitionJsonField;
	label: React.ReactNode;
	description?: React.ReactNode;
	required?: boolean;
	height?: number;
	placeholder?: string;
}

export const JsonField: React.FC<JsonFieldProps> = ({
	node,
	field,
	label,
	description,
	required,
	height,
	placeholder,
}) => {
	const { setJsonDraft } = useWorkflowDefinitionEditorNodeActions(node.id);
	const draft = node.jsonDrafts[field];
	const value = draft ?? formatJson(readJsonField(node.config, field));
	const invalid = draft !== undefined && !parseJsonDraft(draft).ok;

	return (
		<CodeEditor
			language="json"
			label={label}
			description={description}
			required={required}
			height={height ?? 110}
			placeholder={placeholder}
			value={value}
			onChange={(text) => setJsonDraft(field, text)}
			error={invalid ? 'Not valid JSON' : undefined}
		/>
	);
};

interface HeadersFieldProps {
	value: Record<string, string> | undefined;
	onChange: (value: Record<string, string> | undefined) => void;
}

export const HeadersField: React.FC<HeadersFieldProps> = ({ value, onChange }) => {
	const [rows, setRows] = useState(() =>
		Object.entries(value ?? {}).map(([key, headerValue]) => ({ key, value: headerValue })),
	);

	const commit = (next: typeof rows) => {
		setRows(next);
		const entries = next.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]);
		onChange(entries.length > 0 ? Object.fromEntries(entries) : undefined);
	};

	return (
		<Stack gap={6}>
			<SectionLabel>Headers</SectionLabel>
			{rows.map((row, index) => (
				<Group key={index} gap={6} wrap="nowrap">
					<TextInput
						size="xs"
						flex={1}
						placeholder="Name"
						aria-label="Header name"
						value={row.key}
						onChange={(event) =>
							commit(
								rows.map((item, i) =>
									i === index ? { ...item, key: event.currentTarget.value } : item,
								),
							)
						}
					/>
					<TextInput
						size="xs"
						flex={1.4}
						placeholder="Value or {{ path }}"
						aria-label="Header value"
						value={row.value}
						onChange={(event) =>
							commit(
								rows.map((item, i) =>
									i === index ? { ...item, value: event.currentTarget.value } : item,
								),
							)
						}
					/>
					<ActionIcon
						size="sm"
						aria-label="Remove header"
						onClick={() => commit(rows.filter((_, i) => i !== index))}
					>
						<LuX size={14} />
					</ActionIcon>
				</Group>
			))}
			<Button
				variant="default"
				size="compact-xs"
				leftSection={<LuPlus size={12} />}
				w="fit-content"
				onClick={() => setRows([...rows, { key: '', value: '' }])}
			>
				Add header
			</Button>
		</Stack>
	);
};
