import React, { useEffect, useState } from 'react';

import { Alert, Button, Group, Menu, Modal, Select, Stack, Switch, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { LuChevronDown, LuCircleAlert, LuTriangleAlert, LuWorkflow } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { ScheduleCronPreview } from '@module/schedule/components/ScheduleCronPreview';
import { analyzeCrontab, CRON_PRESETS, TIMEZONE_OPTIONS, type ScheduleErrorCopy } from '@module/schedule/data';
import { scheduleInitialValues, scheduleSchema, scheduleToDto, type ScheduleDto } from '@module/schedule/dto';
import { useScheduleDefinition } from '@module/schedule/hooks';
import type { Schedule } from '@module/schedule/types/Schedule';
import { useListWorkflowDefinitionsQuery } from '@module/workflow-definition/hooks';

export type ScheduleFormMode =
	| { type: 'create'; definitionId?: string }
	/** `removed`: a replace deleted the old schedule but couldn't create the new one, so saving creates it. */
	| { type: 'edit'; schedule: Schedule; removed?: boolean };

interface ScheduleFormModalProps {
	mode: ScheduleFormMode | null;
	loading: boolean;
	error: ScheduleErrorCopy | null;
	onClose: () => void;
	onSubmit: (values: ScheduleDto) => void;
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const modeKey = (mode: ScheduleFormMode | null) =>
	mode && (mode.type === 'edit' ? `edit:${mode.schedule.id}` : `create:${mode.definitionId ?? ''}`);

interface DefinitionPickerProps {
	value: string;
	error?: React.ReactNode;
	onChange: (value: string) => void;
}

const DefinitionPicker: React.FC<DefinitionPickerProps> = ({ value, error, onChange }) => {
	const [allVersions, setAllVersions] = useState(false);
	const selected = useScheduleDefinition(value || null);
	const { data, isFetching } = useListWorkflowDefinitionsQuery(
		{
			perPage: 200,
			order: { by: 'name', direction: 'asc' },
			filter: { latest_only: { op: '_eq', value: allVersions ? 'false' : 'true' } },
		},
		{ skip: !selected.canRead },
	);

	// Without definitions:read the list can't be loaded, so the id is typed in.
	if (!selected.canRead) {
		return (
			<TextInput
				label="Workflow definition id"
				description="Your role can't list definitions; paste the id of the version to run"
				placeholder="00000000-0000-0000-0000-000000000000"
				ff="monospace"
				value={value}
				error={error ?? (value && !UUID_PATTERN.test(value) ? 'Not a valid id' : undefined)}
				onChange={(event) => onChange(event.currentTarget.value.trim())}
			/>
		);
	}

	const options = (data?.items ?? []).map((definition) => ({
		value: definition.id,
		label: `${definition.name} · v${definition.version}`,
	}));
	// Keep a selection that the current filter doesn't list (an older version, or a deleted definition).
	if (value && !options.some((option) => option.value === value)) {
		options.unshift({ value, label: selected.label ?? (selected.deleted ? `Deleted definition ${value}` : value) });
	}

	return (
		<Stack gap={4}>
			<Select
				label="Workflow definition"
				description="Runs start from this exact version"
				placeholder={isFetching && !data ? 'Loading definitions…' : 'Pick a workflow'}
				searchable
				nothingFoundMessage="No workflow found"
				leftSection={<LuWorkflow size={14} />}
				data={options}
				value={value || null}
				error={error ?? (selected.deleted ? 'This definition no longer exists' : undefined)}
				onChange={(next) => onChange(next ?? '')}
			/>
			<Switch
				size="xs"
				label="Show older versions"
				checked={allVersions}
				onChange={(event) => setAllVersions(event.currentTarget.checked)}
			/>
		</Stack>
	);
};

export const ScheduleFormModal: React.FC<ScheduleFormModalProps> = ({ mode, loading, error, onClose, onSubmit }) => {
	const editing = mode?.type === 'edit' && !mode.removed;
	const removed = mode?.type === 'edit' && !!mode.removed;

	const form = useForm<ScheduleDto>({
		mode: 'controlled',
		initialValues: scheduleInitialValues,
		validate: (values) => {
			const result = scheduleSchema.safeParse(values);
			if (result.success) return {};

			return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
		},
	});

	// Reset on every open (keyed by target, so a failed replace keeps what was typed).
	const key = modeKey(mode);
	useEffect(() => {
		if (!mode) return;
		form.setValues(
			mode.type === 'edit'
				? scheduleToDto(mode.schedule)
				: { ...scheduleInitialValues, workflow_definition_id: mode.definitionId ?? '' },
		);
		form.resetDirty();
		form.clearErrors();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// A 422 that names a field is shown on that field.
	useEffect(() => {
		if (error?.field) form.setFieldError(error.field, error.message);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [error]);

	const { crontab, timezone } = form.values;
	const analysis = analyzeCrontab(crontab, timezone);
	const inlineZone = analysis.ok && analysis.inlineZone ? analysis.zone : null;

	return (
		<Modal
			opened={!!mode}
			onClose={onClose}
			title={editing ? 'Edit schedule' : 'New schedule'}
			size="lg"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<form onSubmit={form.onSubmit(onSubmit)} noValidate>
				<Stack gap="md">
					{editing && (
						<Alert color="yellow" variant="light" icon={<LuTriangleAlert size={16} />}>
							Schedules can't be changed in place: saving deletes this one and creates a new one with a
							new id.
						</Alert>
					)}

					<DefinitionPicker
						value={form.values.workflow_definition_id}
						error={form.errors.workflow_definition_id}
						onChange={(value) => form.setFieldValue('workflow_definition_id', value)}
					/>

					<TextInput
						label="Crontab"
						description="5 fields (minute hour day-of-month month day-of-week), @daily-style descriptors or @every 5m"
						placeholder="0 9 * * 1-5"
						autoComplete="off"
						spellCheck={false}
						styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
						rightSectionWidth={92}
						rightSection={
							<Menu position="bottom-end" shadow="md" withinPortal>
								<Menu.Target>
									<Button
										size="compact-xs"
										variant="subtle"
										color="gray"
										rightSection={<LuChevronDown size={12} />}
									>
										Presets
									</Button>
								</Menu.Target>
								<Menu.Dropdown>
									{CRON_PRESETS.map((preset) => (
										<Menu.Item
											key={preset.crontab}
											onClick={() => form.setFieldValue('crontab', preset.crontab)}
											rightSection={
												<Text fz="xs" c="dimmed" ff="monospace">
													{preset.crontab}
												</Text>
											}
										>
											{preset.label}
										</Menu.Item>
									))}
								</Menu.Dropdown>
							</Menu>
						}
						{...form.getInputProps('crontab')}
					/>

					<ScheduleCronPreview crontab={crontab} timezone={timezone} />

					<Select
						label="Timezone"
						description={
							inlineZone
								? `Ignored: the crontab's TZ= prefix wins, so ticks run in ${inlineZone}`
								: 'Ticks are evaluated in this zone'
						}
						searchable
						allowDeselect={false}
						data={TIMEZONE_OPTIONS}
						disabled={!!inlineZone}
						{...form.getInputProps('timezone')}
						onChange={(value) => form.setFieldValue('timezone', value ?? 'UTC')}
					/>

					<CodeEditor
						label="Context"
						description="JSON object each run starts with"
						language="json"
						height={120}
						value={form.values.context}
						onChange={(value) => form.setFieldValue('context', value)}
						error={form.errors.context}
					/>

					<Switch
						label="Enabled"
						description="Paused schedules keep their settings but start nothing"
						{...form.getInputProps('enabled', { type: 'checkbox' })}
					/>

					{error && (removed || !error.field) && (
						<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />}>
							{error.message}
						</Alert>
					)}

					<Group justify="flex-end" gap="xs">
						<Button variant="default" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							{editing ? 'Replace' : removed ? 'Create again' : 'Create'}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};
