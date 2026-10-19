import React from 'react';

import {
	ActionIcon,
	Button,
	Card,
	Fieldset,
	Group,
	SegmentedControl,
	Select,
	Stack,
	Switch,
	Text,
	TextInput,
} from '@mantine/core';
import { LuPlus, LuTrash2 } from 'react-icons/lu';

import { FORM_SECTION_STYLE_LABELS } from '@module/form-engine/constant';
import type { FormBuilderFormTab } from '@module/form-engine/types/FormBuilderInspectorTab';
import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';
import type { FormDraft } from '@module/form-engine/types/FormDraft';
import type { FormSectionStyle } from '@module/form-engine/types/FormSectionStyle';
import { draftFieldId } from '@module/form-engine/utils';

import { SectionLabel } from './FormBuilderSectionLabel';

interface FormBuilderLayoutPanelProps {
	builder: FormBuilderState;
	tab: Exclude<FormBuilderFormTab, 'summary'>;
	readOnly: boolean;
}

/** Form-wide settings on `tab`, shown in the inspector when no field is selected. */
export const FormBuilderLayoutPanel: React.FC<FormBuilderLayoutPanelProps> = ({ builder, tab, readOnly }) => {
	const { draft } = builder;
	const setSections = (sections: FormDraft['sections']) => builder.update((current) => ({ ...current, sections }));

	return (
		<Fieldset variant="unstyled" p={0} disabled={readOnly}>
			<Stack gap="lg">
				{tab === 'general' && (
					<>
						<TextInput
							label={<SectionLabel required>Name</SectionLabel>}
							placeholder="Customer onboarding"
							value={draft.name}
							onChange={(event) => {
								const name = event.currentTarget.value;
								builder.update((current) => ({ ...current, name }));
							}}
						/>
						<Switch
							label={<SectionLabel>Reject unknown keys</SectionLabel>}
							description="Payloads may only carry the form's own fields"
							checked={draft.strict}
							onChange={(event) => {
								const strict = event.currentTarget.checked;
								builder.update((current) => ({ ...current, strict }));
							}}
						/>
					</>
				)}

				{tab === 'layout' && (
					<Stack gap={4}>
						<SectionLabel>Columns</SectionLabel>
						<SegmentedControl
							size="xs"
							fullWidth
							data={['1', '2', '3', '4']}
							value={String(draft.columns)}
							onChange={(next) =>
								builder.update((current) => ({
									...current,
									columns: Number(next) as FormDraft['columns'],
								}))
							}
						/>
					</Stack>
				)}

				{tab === 'sections' && (
					<Stack gap={6}>
						<Group justify="space-between">
							<SectionLabel>Sections</SectionLabel>
							{!readOnly && (
								<Button
									size="compact-xs"
									variant="subtle"
									leftSection={<LuPlus size={12} />}
									onClick={() =>
										setSections([
											...draft.sections,
											{
												id: draftFieldId(),
												title: `Section ${draft.sections.length + 1}`,
												fields: [],
											},
										])
									}
								>
									Add section
								</Button>
							)}
						</Group>
						{draft.sections.length === 0 ? (
							<Text fz="xs" c="dimmed">
								No sections; all fields render together.
							</Text>
						) : (
							<Select
								size="xs"
								label="Section style"
								description="Every field has to be in a section"
								allowDeselect={false}
								data={[
									{ value: 'long', label: FORM_SECTION_STYLE_LABELS.long },
									{
										value: 'stepper',
										label: `${FORM_SECTION_STYLE_LABELS.stepper} (validates each step)`,
									},
									{ value: 'accordion', label: FORM_SECTION_STYLE_LABELS.accordion },
								]}
								value={draft.sectionStyle}
								onChange={(next) =>
									next &&
									builder.update((current) => ({
										...current,
										sectionStyle: next as FormSectionStyle,
									}))
								}
							/>
						)}
						{draft.sections.map((section, index) => (
							<Card key={section.id} withBorder padding="xs">
								<Stack gap={4}>
									<Group gap={4} wrap="nowrap">
										<TextInput
											size="xs"
											flex={1}
											placeholder="Title"
											value={section.title}
											onChange={(event) => {
												const title = event.currentTarget.value;
												setSections(
													draft.sections.map((item, at) =>
														at === index ? { ...item, title } : item,
													),
												);
											}}
										/>
										<ActionIcon
											variant="subtle"
											color="red"
											size="sm"
											aria-label="Remove section"
											onClick={() => setSections(draft.sections.filter((_, at) => at !== index))}
										>
											<LuTrash2 size={14} />
										</ActionIcon>
									</Group>
									<TextInput
										size="xs"
										placeholder="Description (optional)"
										value={section.description ?? ''}
										onChange={(event) => {
											const description = event.currentTarget.value || undefined;
											setSections(
												draft.sections.map((item, at) =>
													at === index ? { ...item, description } : item,
												),
											);
										}}
									/>
									<Text fz={11} c="dimmed">
										{section.fields.length} {section.fields.length === 1 ? 'field' : 'fields'};
										removing the section leaves them ungrouped, to move into another
									</Text>
								</Stack>
							</Card>
						))}
					</Stack>
				)}
			</Stack>
		</Fieldset>
	);
};
