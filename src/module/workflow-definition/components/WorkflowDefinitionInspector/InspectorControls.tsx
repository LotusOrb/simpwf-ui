import React, { useState } from 'react';

import {
	ActionIcon,
	Autocomplete,
	type AutocompleteProps,
	Button,
	type ComboboxItem,
	Group,
	Stack,
	Text,
	TextInput,
	type TextInputProps,
} from '@mantine/core';
import { LuPlus, LuX } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { formatJson, isDuration, parseJsonDraft, readJsonField } from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionJsonField } from '@module/workflow-definition/types/WorkflowDefinitionJsonField';

import { useContextPaths } from './InspectorContextTypes.context';

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

export const DurationInput: React.FC<DurationInputProps> = ({ value, onChange, error, ...props }) => (
	<TextInput
		{...props}
		value={value ?? ''}
		onChange={(event) => onChange(event.currentTarget.value.trim() || undefined)}
		error={value && !isDuration(value) ? 'Use a duration like 30s or 5m' : error}
	/>
);

// An unclosed `{{ partial.path` at the end of a template value.
const OPEN_TEMPLATE = /\{\{\s*([\w.[\]]*)$/;
const CONTEXT_OPTION_LIMIT = 50;

interface ContextInputProps extends Omit<AutocompleteProps, 'data' | 'value' | 'onChange' | 'filter' | 'renderOption'> {
	value: string;
	onChange: (value: string) => void;
	/** The value is free text with `{{ path }}` templates rather than a bare context path. */
	template?: boolean;
}

/**
 * Text input completing context paths from the loaded debug run (see `ContextTypesProvider`). A path field suggests
 * the flattened paths; a template field suggests them after an unclosed `{{` at the end and closes the template.
 */
export const ContextInput: React.FC<ContextInputProps> = ({ value, onChange, template, ...props }) => {
	const paths = useContextPaths();

	if (!template) {
		return <Autocomplete {...props} data={paths} limit={CONTEXT_OPTION_LIMIT} value={value} onChange={onChange} />;
	}

	// Autocomplete writes the submitted option's label into the input, so each label is the whole completed value.
	const open = OPEN_TEMPLATE.exec(value);
	const search = open?.[1].toLowerCase() ?? '';
	const data: ComboboxItem[] = open
		? paths
				.filter((path) => path.toLowerCase().includes(search))
				.slice(0, CONTEXT_OPTION_LIMIT)
				.map((path) => ({ value: path, label: `${value.slice(0, open.index)}{{ ${path} }}` }))
		: [];

	return (
		<Autocomplete
			{...props}
			data={data}
			filter={({ options }) => options}
			renderOption={({ option }) => option.value}
			value={value}
			onChange={onChange}
		/>
	);
};

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
	label?: React.ReactNode;
	description?: React.ReactNode;
	value: Record<string, string> | undefined;
	onChange: (value: Record<string, string> | undefined) => void;
}

/** Name/value rows whose values take `{{ path }}` templates, like HTTP headers. */
export const HeadersField: React.FC<HeadersFieldProps> = ({ label = 'Headers', description, value, onChange }) => {
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
			<div>
				<SectionLabel>{label}</SectionLabel>
				{description && (
					<Text fz="xs" c="dimmed">
						{description}
					</Text>
				)}
			</div>
			{rows.map((row, index) => (
				<Group key={index} gap={6} wrap="nowrap">
					<TextInput
						size="xs"
						flex={1}
						placeholder="Name"
						aria-label="Name"
						value={row.key}
						onChange={(event) =>
							commit(
								rows.map((item, i) =>
									i === index ? { ...item, key: event.currentTarget.value } : item,
								),
							)
						}
					/>
					<ContextInput
						template
						size="xs"
						flex={1.4}
						placeholder="Value or {{ path }}"
						aria-label="Value"
						value={row.value}
						onChange={(headerValue) =>
							commit(rows.map((item, i) => (i === index ? { ...item, value: headerValue } : item)))
						}
					/>
					<ActionIcon
						size="sm"
						aria-label="Remove row"
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
				Add row
			</Button>
		</Stack>
	);
};
