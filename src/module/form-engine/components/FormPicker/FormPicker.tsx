import React, { useState } from 'react';

import {
	ActionIcon,
	Anchor,
	Button,
	Group,
	Popover,
	ScrollArea,
	Select,
	Stack,
	Text,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { LuExternalLink, LuEye, LuPlus } from 'react-icons/lu';

import { Permission, useCan } from '@core/auth/authorization';

import type { JsonSchema } from '@common/types/JsonSchema';

import { FormQuickCreateDrawer } from '@module/form-engine/components/FormQuickCreateDrawer';
import { FormRenderer } from '@module/form-engine/components/FormRenderer';
import { useFormEngine, useGetFormQuery, useListFormsQuery } from '@module/form-engine/hooks';
import type { Form } from '@module/form-engine/types/Form';
import { formErrorCode, formFieldCount, formLibraryPath } from '@module/form-engine/utils';

/** The engine's page size cap; the picker lists this many and accepts a pasted id for the rest. */
const PICKER_PAGE_SIZE = 200;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const MiniPreview: React.FC<{ schema: JsonSchema; ui: unknown }> = ({ schema, ui }) => {
	const engine = useFormEngine({ schema, ui });
	return <FormRenderer engine={engine} />;
};

/** A preview popover and a link to the form in the library. */
const FormActions: React.FC<{ form: Form | undefined; formId: string }> = ({ form, formId }) => (
	<Group gap={2} wrap="nowrap">
		{form && (
			<Popover width={420} position="left-start" shadow="md" withArrow>
				<Popover.Target>
					<Tooltip label="Preview">
						<ActionIcon variant="subtle" color="gray" aria-label={`Preview ${form.name}`}>
							<LuEye size={16} />
						</ActionIcon>
					</Tooltip>
				</Popover.Target>
				<Popover.Dropdown>
					<Stack gap="xs">
						<Text fz="sm" fw={600}>
							{form.name}
						</Text>
						<ScrollArea.Autosize mah={420}>
							<MiniPreview key={form.updated_at} schema={form.schema} ui={form.ui} />
						</ScrollArea.Autosize>
					</Stack>
				</Popover.Dropdown>
			</Popover>
		)}
		<Tooltip label="Open in the forms library">
			<ActionIcon
				variant="subtle"
				color="gray"
				component="a"
				href={formLibraryPath(formId)}
				target="_blank"
				rel="noreferrer"
				aria-label="Open in the forms library"
			>
				<LuExternalLink size={16} />
			</ActionIcon>
		</Tooltip>
	</Group>
);

interface FormPickerProps {
	value: string | undefined;
	onChange?: (id: string | undefined) => void;
	label: React.ReactNode;
	description?: React.ReactNode;
	error?: React.ReactNode;
	readOnly?: boolean;
}

/**
 * Picks a forms-library form for an input node: searchable by name, with a preview, a link to the library and a
 * quick "new form". Without forms:read it falls back to typing the id.
 */
export const FormPicker: React.FC<FormPickerProps> = ({ value, onChange, label, description, error, readOnly }) => {
	const canRead = useCan(Permission.FormsRead);
	const canWrite = useCan(Permission.FormsWrite);
	const [search, setSearch] = useState('');
	const [creating, setCreating] = useState(false);

	const list = useListFormsQuery({ page: 1, perPage: PICKER_PAGE_SIZE }, { skip: !canRead || readOnly });
	const listed = value ? list.data?.items.find((form) => form.id === value) : undefined;
	const single = useGetFormQuery(value ?? '', { skip: !canRead || !value || !!listed });
	const form = listed ?? (single.data?.id === value ? single.data : undefined);
	const missing = !!value && formErrorCode(single.error) === 404;

	if (!canRead) {
		return (
			<TextInput
				label={label}
				description={description}
				inputWrapperOrder={['label', 'input', 'description', 'error']}
				placeholder="Form id (UUID)"
				ff="monospace"
				readOnly={readOnly}
				value={value ?? ''}
				error={error}
				onChange={(event) => onChange?.(event.currentTarget.value.trim() || undefined)}
			/>
		);
	}

	if (readOnly) {
		if (!value) return null;
		return (
			<Stack gap={2}>
				<Text fz="sm" fw={500}>
					{label}
				</Text>
				<Group gap="xs" justify="space-between" wrap="nowrap">
					<div style={{ minWidth: 0 }}>
						<Text fz="sm" truncate>
							{form?.name ?? (missing ? 'Form not found' : '…')}
						</Text>
						<Text fz={11} c="dimmed" ff="monospace" truncate>
							{value}
						</Text>
					</div>
					<FormActions form={form} formId={value} />
				</Group>
			</Stack>
		);
	}

	const data = (list.data?.items ?? []).map((item) => ({
		value: item.id,
		label: `${item.name} · ${formFieldCount(item)} ${formFieldCount(item) === 1 ? 'field' : 'fields'}`,
	}));
	if (value && !listed) data.push({ value, label: form?.name ?? value });
	if (UUID.test(search.trim()) && !data.some((item) => item.value === search.trim())) {
		data.push({ value: search.trim(), label: `Use id ${search.trim()}` });
	}
	const truncated = (list.data?.total ?? 0) > PICKER_PAGE_SIZE;

	return (
		<Stack gap={4}>
			<Group gap={4} align="flex-end" wrap="nowrap">
				<Select
					flex={1}
					label={label}
					description={description}
					inputWrapperOrder={['label', 'input', 'description', 'error']}
					placeholder={list.isLoading ? 'Loading forms…' : 'No form'}
					data={data}
					searchable
					clearable
					searchValue={search}
					onSearchChange={setSearch}
					nothingFoundMessage={truncated ? 'Not in the first 200 forms; paste its id' : 'No form found'}
					value={value ?? null}
					onChange={(next) => onChange?.(next ?? undefined)}
					error={
						error ??
						(missing ? "This form doesn't exist; the engine will reject the definition" : undefined)
					}
				/>
				{value && <FormActions form={form} formId={value} />}
			</Group>
			{canWrite && (
				<Group>
					<Button
						size="compact-xs"
						variant="subtle"
						leftSection={<LuPlus size={12} />}
						onClick={() => setCreating(true)}
					>
						New form
					</Button>
					{form && (
						<Anchor href={formLibraryPath(form.id)} target="_blank" rel="noreferrer" fz="xs">
							Edit {form.name}
						</Anchor>
					)}
				</Group>
			)}
			<FormQuickCreateDrawer
				opened={creating}
				onClose={() => setCreating(false)}
				onCreated={(created) => {
					setCreating(false);
					onChange?.(created.id);
				}}
			/>
		</Stack>
	);
};
