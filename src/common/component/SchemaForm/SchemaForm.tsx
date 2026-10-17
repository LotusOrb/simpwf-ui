import React, { createContext, useContext, useState } from 'react';

import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	Switch,
	TagsInput,
	Text,
	TextInput,
} from '@mantine/core';
import { LuChevronsUpDown, LuPlus, LuTrash2, LuX } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';
import type { JsonSchema } from '@common/types/JsonSchema';

import type { SchemaFieldContext, SchemaFieldOverride, SchemaFieldRenderer } from './SchemaForm.types';
import {
	applyPatch,
	fieldKind,
	humanizeKey,
	isRecord,
	joinPath,
	resolveSchema,
	seedValue,
	variantKeys,
} from './SchemaForm.utils';

interface SchemaFormShared {
	root: JsonSchema;
	errors: Record<string, string>;
	readOnly: boolean;
	override?: (path: string) => SchemaFieldOverride | undefined;
	renderField?: SchemaFieldRenderer;
}

const SchemaFormContext = createContext<SchemaFormShared>({ root: {}, errors: {}, readOnly: false });

const selectIcon = <LuChevronsUpDown size={14} />;

export const FieldLabel: React.FC<{ children: React.ReactNode; required?: boolean }> = ({ children, required }) => (
	<Text fz="sm" fw={600} c="dark.6">
		{children}
		{required && (
			<Text component="span" c="red.6" inherit>
				*
			</Text>
		)}
	</Text>
);

interface SchemaFormProps {
	/** An object schema; its properties are the fields. */
	schema: JsonSchema;
	/** Holds the `$defs` local references point into. Defaults to `schema`. */
	root?: JsonSchema;
	value: Record<string, unknown>;
	/** Changed top-level properties; undefined removes one. */
	onChange: (patch: Record<string, unknown>) => void;
	/** Top-level properties to show, in order. Defaults to every property. */
	keys?: string[];
	/** Messages by dotted path, shown under their field. */
	errors?: Record<string, string>;
	readOnly?: boolean;
	override?: (path: string) => SchemaFieldOverride | undefined;
	/** Replaces the widget of a field; return undefined to keep the default one. */
	renderField?: SchemaFieldRenderer;
}

/**
 * A form generated from a JSON Schema: strings, enums, booleans, numbers, lists, string maps, nested and optional
 * objects, and exactly-one-of variants. Anything else is edited as JSON.
 */
export const SchemaForm: React.FC<SchemaFormProps> = ({
	schema,
	root = schema,
	value,
	onChange,
	keys,
	errors = {},
	readOnly = false,
	override,
	renderField,
}) => (
	<SchemaFormContext.Provider value={{ root, errors, readOnly, override, renderField }}>
		<ObjectFields schema={schema} value={value} onPatch={onChange} keys={keys} prefix="" />
	</SchemaFormContext.Provider>
);

interface ObjectFieldsProps {
	schema: JsonSchema;
	value: unknown;
	onPatch: (patch: Record<string, unknown>) => void;
	keys?: string[];
	prefix: string;
}

const ObjectFields: React.FC<ObjectFieldsProps> = ({ schema, value, onPatch, keys, prefix }) => {
	const object = isRecord(value) ? value : {};
	const properties = schema.properties ?? {};
	const required = new Set(schema.required ?? []);
	const variants = variantKeys(schema);
	// Served schemas list properties alphabetically, so required ones go first to keep what must be filled on top.
	const listed = (keys ?? Object.keys(properties)).filter((key) => properties[key]);
	const shown = [...listed.filter((key) => required.has(key)), ...listed.filter((key) => !required.has(key))];
	// The variant switch sits where the first of its keys would.
	const firstVariant = variants && shown.find((key) => variants.includes(key));

	return (
		<>
			{shown.map((key) => {
				if (variants?.includes(key)) {
					if (key !== firstVariant) return null;
					return (
						<VariantFields
							key={`variant:${key}`}
							schema={schema}
							variants={variants}
							value={object}
							onPatch={onPatch}
							prefix={prefix}
						/>
					);
				}
				return (
					<SchemaField
						key={key}
						fieldKey={key}
						schema={properties[key]}
						required={required.has(key)}
						value={object[key]}
						onChange={(next) => onPatch({ [key]: next })}
						path={joinPath(prefix, key)}
					/>
				);
			})}
		</>
	);
};

const VariantFields: React.FC<{
	schema: JsonSchema;
	variants: string[];
	value: Record<string, unknown>;
	onPatch: (patch: Record<string, unknown>) => void;
	prefix: string;
}> = ({ schema, variants, value, onPatch, prefix }) => {
	const { root, readOnly, override } = useContext(SchemaFormContext);
	const current = variants.find((key) => value[key] !== undefined) ?? null;
	const labelOf = (key: string) => override?.(joinPath(prefix, key))?.label ?? humanizeKey(key);

	const choose = (key: string) => {
		if (key === current) return;
		onPatch(
			Object.fromEntries(
				variants.map((variant) => [
					variant,
					variant === key
						? (value[variant] ?? seedValue(schema.properties![variant], root) ?? {})
						: undefined,
				]),
			),
		);
	};

	const chosen = current && resolveSchema(schema.properties![current], root);

	return (
		<>
			<SegmentedControl
				value={current ?? ''}
				onChange={choose}
				disabled={readOnly}
				data={variants.map((key) => ({ value: key, label: labelOf(key) }))}
			/>
			{current && chosen && (
				<>
					{chosen.description && (
						<Text fz="xs" c="dimmed" mt={-8}>
							{chosen.description}
						</Text>
					)}
					<ObjectFields
						schema={chosen}
						value={value[current]}
						onPatch={(patch) => onPatch({ [current]: applyPatch(value[current], patch) })}
						prefix={joinPath(prefix, current)}
					/>
				</>
			)}
		</>
	);
};

interface SchemaFieldProps {
	fieldKey: string;
	schema: JsonSchema;
	required: boolean;
	value: unknown;
	onChange: (value: unknown) => void;
	path: string;
}

const SchemaField: React.FC<SchemaFieldProps> = ({ fieldKey, schema: raw, required, value, onChange, path }) => {
	const { root, errors, readOnly, override, renderField } = useContext(SchemaFormContext);
	const adjusted = override?.(path);
	const kind = adjusted?.kind ?? fieldKind(fieldKey, raw, root, required);
	if (kind === 'hidden') return null;

	const schema = resolveSchema(raw, root);
	const field: SchemaFieldContext = {
		path,
		key: fieldKey,
		schema,
		kind,
		label: adjusted?.label ?? schema.title ?? humanizeKey(fieldKey),
		description: adjusted?.description ?? schema.description,
		placeholder: adjusted?.placeholder ?? (schema.default !== undefined ? String(schema.default) : undefined),
		required,
		value,
		onChange,
		error: errors[path],
		readOnly,
	};
	return <>{renderField?.(field) ?? <DefaultField field={field} />}</>;
};

const wrapperOrder: ('label' | 'input' | 'description' | 'error')[] = ['label', 'input', 'description', 'error'];

const DefaultField: React.FC<{ field: SchemaFieldContext }> = ({ field }) => {
	const { root } = useContext(SchemaFormContext);
	const { kind, schema, label, description, placeholder, required, value, onChange, error, readOnly, path } = field;
	const labelNode = <FieldLabel required={required}>{label}</FieldLabel>;
	const text = typeof value === 'string' ? value : '';

	switch (kind) {
		case 'enum':
			return (
				<Select
					label={labelNode}
					description={description}
					inputWrapperOrder={wrapperOrder}
					data={(schema.enum ?? []).map((option) => ({
						value: String(option),
						label: humanizeKey(String(option)),
					}))}
					value={value === undefined ? null : String(value)}
					onChange={(next) => onChange(next ?? undefined)}
					allowDeselect={!required}
					clearable={!required}
					rightSection={selectIcon}
					readOnly={readOnly}
					error={error}
				/>
			);
		case 'boolean': {
			const fallback = typeof schema.default === 'boolean' ? schema.default : false;
			return (
				<Group justify="space-between" wrap="nowrap" align="flex-start">
					<div>
						{labelNode}
						{description && (
							<Text fz="xs" c="dimmed">
								{description}
							</Text>
						)}
					</div>
					<Switch
						aria-label={label}
						checked={typeof value === 'boolean' ? value : fallback}
						disabled={readOnly}
						onChange={(event) => onChange(event.currentTarget.checked)}
					/>
				</Group>
			);
		}
		case 'number':
			return (
				<NumberInput
					label={labelNode}
					description={description}
					inputWrapperOrder={wrapperOrder}
					placeholder={placeholder}
					min={schema.minimum}
					max={schema.maximum}
					allowDecimal={!(schema.type === 'integer' || schema.type?.includes('integer'))}
					value={typeof value === 'number' ? value : ''}
					onChange={(next) => onChange(typeof next === 'number' ? next : undefined)}
					readOnly={readOnly}
					error={error}
				/>
			);
		case 'stringList':
			return (
				<TagsInput
					label={labelNode}
					description={description ?? 'Press Enter after each value'}
					inputWrapperOrder={wrapperOrder}
					placeholder={placeholder ?? 'Add value'}
					value={Array.isArray(value) ? value.map(String) : []}
					onChange={(next) => onChange(next.length > 0 || required ? next : undefined)}
					acceptValueOnBlur
					splitChars={[]}
					readOnly={readOnly}
					error={error}
				/>
			);
		case 'script':
			return (
				<CodeEditor
					label={labelNode}
					description={description}
					height={120}
					placeholder={placeholder}
					readOnly={readOnly}
					value={text}
					onChange={(next) => onChange(next)}
					error={error}
				/>
			);
		case 'stringMap':
			return <KeyValueField field={field} />;
		case 'json':
			return <JsonValueField field={field} />;
		case 'object':
			return (
				<Stack gap="sm" p="xs" bd="1px solid gray.2" bdrs="md">
					<div>
						{labelNode}
						{description && (
							<Text fz="xs" c="dimmed">
								{description}
							</Text>
						)}
					</div>
					<ObjectFields
						schema={schema}
						value={value}
						onPatch={(patch) => onChange(applyPatch(value, patch))}
						prefix={path}
					/>
				</Stack>
			);
		case 'toggleObject':
			return (
				<Stack gap="xs">
					<Group justify="space-between" wrap="nowrap" align="flex-start">
						<div>
							{labelNode}
							{description && (
								<Text fz="xs" c="dimmed">
									{description}
								</Text>
							)}
						</div>
						<Switch
							aria-label={label}
							checked={isRecord(value)}
							disabled={readOnly}
							onChange={(event) =>
								onChange(event.currentTarget.checked ? (seedValue(schema, root) ?? {}) : undefined)
							}
						/>
					</Group>
					{isRecord(value) && (
						<Stack gap="sm" pl="sm" bd="0 solid gray.2" style={{ borderLeftWidth: 2 }}>
							<ObjectFields
								schema={schema}
								value={value}
								onPatch={(patch) => onChange(applyPatch(value, patch))}
								prefix={path}
							/>
						</Stack>
					)}
				</Stack>
			);
		case 'objectList':
			return <ObjectListField field={field} />;
		default:
			return (
				<TextInput
					label={labelNode}
					description={description}
					inputWrapperOrder={wrapperOrder}
					placeholder={placeholder}
					value={text}
					onChange={(event) => onChange(event.currentTarget.value || (required ? '' : undefined))}
					readOnly={readOnly}
					error={error}
				/>
			);
	}
};

/** A string-to-string map edited as rows; rows without a name aren't stored. */
export const KeyValueField: React.FC<{ field: SchemaFieldContext }> = ({ field }) => {
	const { label, description, required, value, onChange, readOnly } = field;
	const [rows, setRows] = useState(() =>
		Object.entries(isRecord(value) ? value : {}).map(([key, item]) => ({ key, value: String(item) })),
	);

	const commit = (next: typeof rows) => {
		setRows(next);
		const entries = next.filter((row) => row.key.trim()).map((row) => [row.key.trim(), row.value]);
		onChange(entries.length > 0 ? Object.fromEntries(entries) : undefined);
	};

	return (
		<Stack gap={6}>
			<div>
				<FieldLabel required={required}>{label}</FieldLabel>
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
						aria-label={`${label} name`}
						value={row.key}
						readOnly={readOnly}
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
						placeholder="Value"
						aria-label={`${label} value`}
						value={row.value}
						readOnly={readOnly}
						onChange={(event) =>
							commit(
								rows.map((item, i) =>
									i === index ? { ...item, value: event.currentTarget.value } : item,
								),
							)
						}
					/>
					{!readOnly && (
						<ActionIcon
							size="sm"
							aria-label={`Remove ${label.toLowerCase()} row`}
							onClick={() => commit(rows.filter((_, i) => i !== index))}
						>
							<LuX size={14} />
						</ActionIcon>
					)}
				</Group>
			))}
			{!readOnly && (
				<Button
					variant="default"
					size="compact-xs"
					leftSection={<LuPlus size={12} />}
					w="fit-content"
					onClick={() => setRows([...rows, { key: '', value: '' }])}
				>
					Add row
				</Button>
			)}
		</Stack>
	);
};

const formatJson = (value: unknown) => (value === undefined ? '' : JSON.stringify(value, null, 2));

/** Any JSON value. Text that doesn't parse stays in the editor and isn't passed on. */
const JsonValueField: React.FC<{ field: SchemaFieldContext }> = ({ field }) => {
	const { label, description, required, value, onChange, readOnly, error } = field;
	const [text, setText] = useState(() => formatJson(value));
	const [invalid, setInvalid] = useState(false);

	const change = (next: string) => {
		setText(next);
		if (next.trim() === '') {
			setInvalid(false);
			onChange(undefined);
			return;
		}
		try {
			onChange(JSON.parse(next));
			setInvalid(false);
		} catch {
			setInvalid(true);
		}
	};

	return (
		<CodeEditor
			language="json"
			label={<FieldLabel required={required}>{label}</FieldLabel>}
			description={description}
			height={110}
			readOnly={readOnly}
			value={text}
			onChange={change}
			error={invalid ? 'Not valid JSON' : error}
		/>
	);
};

const ObjectListField: React.FC<{ field: SchemaFieldContext }> = ({ field }) => {
	const { root } = useContext(SchemaFormContext);
	const { schema, label, description, required, value, onChange, readOnly, path } = field;
	const items = Array.isArray(value) ? value : [];
	const itemSchema = resolveSchema(schema.items, root);
	const min = schema.minItems ?? 0;

	const set = (next: unknown[]) => onChange(next.length > 0 || required ? next : undefined);

	return (
		<Stack gap="sm">
			<div>
				<FieldLabel required={required}>{label}</FieldLabel>
				{description && (
					<Text fz="xs" c="dimmed">
						{description}
					</Text>
				)}
			</div>
			{items.map((item, index) => (
				<Stack key={index} gap="sm" p="xs" bd="1px solid gray.2" bdrs="md">
					<Group justify="space-between" wrap="nowrap">
						<Text fz="xs" fw={600} c="dimmed">
							{label} {index + 1}
						</Text>
						{!readOnly && (
							<ActionIcon
								size="sm"
								color="red"
								aria-label={`Remove ${label.toLowerCase()} ${index + 1}`}
								disabled={items.length <= min}
								onClick={() => set(items.filter((_, i) => i !== index))}
							>
								<LuTrash2 size={14} />
							</ActionIcon>
						)}
					</Group>
					<ObjectFields
						schema={itemSchema}
						value={item}
						onPatch={(patch) =>
							set(items.map((current, i) => (i === index ? applyPatch(current, patch) : current)))
						}
						prefix={joinPath(path, index)}
					/>
				</Stack>
			))}
			{!readOnly && (
				<Button
					variant="default"
					size="xs"
					leftSection={<LuPlus size={14} />}
					w="fit-content"
					onClick={() => set([...items, seedValue(itemSchema, root) ?? {}])}
				>
					Add {label.toLowerCase()}
				</Button>
			)}
		</Stack>
	);
};
