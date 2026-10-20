import React from 'react';

import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	TagsInput,
	Text,
	TextInput,
} from '@mantine/core';
import { LuPlus, LuX } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { FORM_CONDITION_OP_LABELS } from '@module/form-engine/constant';
import type { FormCondition } from '@module/form-engine/types/FormCondition';
import type { FormConditionOp } from '@module/form-engine/types/FormConditionOp';
import type { FormDraftInputField } from '@module/form-engine/types/FormDraftField';
import type { FormDraftLocation } from '@module/form-engine/utils';

type Leaf = Extract<FormCondition, { field: string }>;

const VALUELESS: ReadonlySet<FormConditionOp> = new Set(['empty', 'notEmpty']);
const LISTED: ReadonlySet<FormConditionOp> = new Set(['in', 'notIn']);

/** The rows of a flat condition and how they combine; null when it nests `all`/`any` and needs JSON. */
const flatten = (condition: FormCondition | undefined): { mode: 'all' | 'any'; rows: Leaf[] } | null => {
	if (!condition) return { mode: 'all', rows: [] };
	if ('field' in condition) return { mode: 'all', rows: [condition] };
	const mode = 'all' in condition ? 'all' : 'any';
	const list = 'all' in condition ? condition.all : condition.any;
	return list.every((item) => 'field' in item) ? { mode, rows: list as Leaf[] } : null;
};

const combine = (mode: 'all' | 'any', rows: Leaf[]): FormCondition | undefined => {
	if (rows.length === 0) return undefined;
	if (rows.length === 1) return rows[0];
	return mode === 'all' ? { all: rows } : { any: rows };
};

const ValueInput: React.FC<{ row: Leaf; target?: FormDraftInputField; onChange: (value: unknown) => void }> = ({
	row,
	target,
	onChange,
}) => {
	if (VALUELESS.has(row.op)) return null;
	const options = (target?.enumValues ?? []).map(String);
	const numeric = target?.valueType === 'number' || target?.valueType === 'integer';
	const cast = (value: string) =>
		numeric && value.trim() !== '' && !Number.isNaN(Number(value)) ? Number(value) : value;

	if (LISTED.has(row.op)) {
		const list = Array.isArray(row.value) ? row.value.map(String) : [];
		return (
			<TagsInput
				size="xs"
				placeholder="Values"
				data={options}
				value={list}
				onChange={(next) => onChange(next.map(cast))}
			/>
		);
	}
	if (target?.valueType === 'boolean') {
		return (
			<Select
				size="xs"
				data={['true', 'false']}
				value={row.value === undefined ? null : String(row.value)}
				onChange={(next) => onChange(next === null ? undefined : next === 'true')}
			/>
		);
	}
	if (options.length) {
		return (
			<Select
				size="xs"
				data={options}
				value={row.value === undefined ? null : String(row.value)}
				onChange={(next) => onChange(next === null ? undefined : cast(next))}
			/>
		);
	}
	if (numeric || row.op === 'gt' || row.op === 'lt') {
		return (
			<NumberInput
				size="xs"
				value={typeof row.value === 'number' ? row.value : ''}
				onChange={(next) => onChange(typeof next === 'number' ? next : undefined)}
			/>
		);
	}
	return (
		<TextInput
			size="xs"
			placeholder="Value"
			value={row.value === undefined ? '' : String(row.value)}
			onChange={(event) => onChange(event.currentTarget.value)}
		/>
	);
};

interface FormBuilderConditionEditorProps {
	value: FormCondition | undefined;
	/** Fields the condition can test, by path. */
	targets: FormDraftLocation[];
	disabled?: boolean;
	onChange: (value: FormCondition | undefined) => void;
}

/** "Show this field only when…": rows of field · operator · value, combined by all or any. */
export const FormBuilderConditionEditor: React.FC<FormBuilderConditionEditorProps> = ({
	value,
	targets,
	disabled,
	onChange,
}) => {
	const flat = flatten(value);

	if (!flat) {
		return (
			<CodeEditor
				label="Shown when"
				description="This condition nests all/any, so it's edited as JSON"
				language="json"
				height={140}
				readOnly={disabled}
				value={JSON.stringify(value, null, 2)}
				onChange={(text) => {
					try {
						onChange(JSON.parse(text) as FormCondition);
					} catch {
						// Keep the last valid condition until the JSON parses.
					}
				}}
			/>
		);
	}

	const { mode, rows } = flat;
	const byPath = new Map(targets.map((target) => [target.path, target.field as FormDraftInputField]));
	const fieldOptions = targets.map((target) => ({
		value: target.path,
		label: `${(target.field as FormDraftInputField).label || target.field.key} · ${target.path}`,
	}));
	const setRow = (index: number, patch: Partial<Leaf>) =>
		onChange(
			combine(
				mode,
				rows.map((row, at) => (at === index ? { ...row, ...patch } : row)),
			),
		);

	return (
		<Stack gap={6}>
			<Group justify="space-between" gap="xs">
				<Text fz="sm" fw={500}>
					Shown when
				</Text>
				{rows.length > 1 && (
					<SegmentedControl
						size="xs"
						disabled={disabled}
						data={[
							{ value: 'all', label: 'all match' },
							{ value: 'any', label: 'any matches' },
						]}
						value={mode}
						onChange={(next) => onChange(combine(next as 'all' | 'any', rows))}
					/>
				)}
			</Group>
			{rows.length === 0 && (
				<Text fz="xs" c="dimmed">
					Always shown
				</Text>
			)}
			{rows.map((row, index) => (
				<Stack key={index} gap={4} p={6} bg="gray.0" style={{ borderRadius: 4 }}>
					<Group gap={4} wrap="nowrap">
						<Select
							size="xs"
							flex={1}
							searchable
							disabled={disabled}
							placeholder="Field"
							data={
								fieldOptions.some((option) => option.value === row.field)
									? fieldOptions
									: [...fieldOptions, { value: row.field, label: `${row.field} (missing)` }]
							}
							value={row.field || null}
							onChange={(next) => setRow(index, { field: next ?? '', value: undefined })}
						/>
						<ActionIcon
							variant="subtle"
							color="gray"
							size="sm"
							disabled={disabled}
							aria-label="Remove condition"
							onClick={() =>
								onChange(
									combine(
										mode,
										rows.filter((_, at) => at !== index),
									),
								)
							}
						>
							<LuX size={14} />
						</ActionIcon>
					</Group>
					<Group gap={4} grow wrap="nowrap">
						<Select
							size="xs"
							disabled={disabled}
							allowDeselect={false}
							data={Object.entries(FORM_CONDITION_OP_LABELS).map(([op, label]) => ({ value: op, label }))}
							value={row.op}
							onChange={(next) => {
								const op = next as FormConditionOp;
								const value = VALUELESS.has(op)
									? undefined
									: LISTED.has(op) !== LISTED.has(row.op)
										? undefined
										: row.value;
								setRow(index, { op, value });
							}}
						/>
						<ValueInput
							row={row}
							target={byPath.get(row.field)}
							onChange={(next) => setRow(index, { value: next })}
						/>
					</Group>
				</Stack>
			))}
			{!disabled && (
				<Group>
					<Button
						size="compact-xs"
						variant="subtle"
						leftSection={<LuPlus size={12} />}
						disabled={targets.length === 0}
						onClick={() => onChange(combine(mode, [...rows, { field: targets[0]?.path ?? '', op: 'eq' }]))}
					>
						Add condition
					</Button>
				</Group>
			)}
		</Stack>
	);
};
