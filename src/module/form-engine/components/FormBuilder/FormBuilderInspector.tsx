import React, { useState } from 'react';

import {
	ActionIcon,
	Anchor,
	Button,
	Card,
	Group,
	ScrollArea,
	SegmentedControl,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { LuBraces, LuInfo, LuTrash2, LuX } from 'react-icons/lu';

import { FormUsageDrawer } from '@module/form-engine/components/FormUsageDrawer';
import { useGetFormUsageQuery } from '@module/form-engine/hooks';
import type { Form } from '@module/form-engine/types/Form';
import type { FormBuilderFieldTab, FormBuilderFormTab } from '@module/form-engine/types/FormBuilderInspectorTab';
import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';
import {
	draftFieldTabs,
	findDraftField,
	formWidgetLabel,
	removeDraftField,
	walkDraft,
} from '@module/form-engine/utils';

import {
	FORM_BUILDER_FIELD_TAB_LABELS,
	FORM_BUILDER_FORM_TABS,
	FORM_RAW_FIELD_META,
	FORM_WIDGET_META,
	draftFieldTitle,
} from './FormBuilder.constants';
import classes from './FormBuilder.module.scss';
import { FormBuilderFieldPanel } from './FormBuilderFieldPanel';
import { FormBuilderLayoutPanel } from './FormBuilderLayoutPanel';

/** "Used by N definitions": editing a form changes every live run that renders it. */
const FormUsage: React.FC<{ form: Form }> = ({ form }) => {
	const [opened, setOpened] = useState(false);
	const { data } = useGetFormUsageQuery({ id: form.id, page: 1, perPage: 1 }, { refetchOnMountOrArgChange: true });
	const count = data ? data.workflow_definitions.length + data.node_definitions.length : 0;
	if (!count) return null;

	return (
		<>
			<Group gap="xs" wrap="nowrap" align="flex-start" className={classes.usage}>
				<LuInfo size={16} className={classes.usageIcon} />
				<Text fz="xs">
					Used by {count} {count === 1 ? 'definition' : 'definitions'}; live runs pick up the change unless
					they were started with frozen forms.{' '}
					<Anchor component="button" type="button" fz="xs" onClick={() => setOpened(true)}>
						See where
					</Anchor>
				</Text>
			</Group>
			<FormUsageDrawer form={opened ? form : null} onClose={() => setOpened(false)} />
		</>
	);
};

interface FormBuilderInspectorProps {
	builder: FormBuilderState;
	readOnly: boolean;
	/** The saved form, for its usage; absent for a new form. */
	form?: Form;
}

/** The tab strip under the inspector header; hidden when there's only one tab. */
const InspectorTabs = <T extends string>({
	value,
	data,
	onChange,
}: {
	value: T;
	data: { value: T; label: string }[];
	onChange: (value: T) => void;
}) =>
	data.length > 1 && (
		<div className={classes.inspectorTabs}>
			<SegmentedControl
				fullWidth
				size="xs"
				value={value}
				onChange={(next) => onChange(next as T)}
				classNames={{ root: classes.segmented, indicator: classes.indicator, label: classes.segmentLabel }}
				data={data}
			/>
		</div>
	);

/** The right-hand panel: the selected field, or the whole form when nothing is selected, each split into tabs. */
export const FormBuilderInspector: React.FC<FormBuilderInspectorProps> = ({ builder, readOnly, form }) => {
	const { draft, selectedId } = builder;
	const selected = selectedId ? findDraftField(draft.fields, selectedId) : null;
	// Kept across selections, so going from field to field stays on the same kind of setting.
	const [fieldTab, setFieldTab] = useState<FormBuilderFieldTab>('general');
	const [formTab, setFormTab] = useState<FormBuilderFormTab>('general');

	if (selected) {
		const { field } = selected;
		const tabs = draftFieldTabs(draft, field);
		const tab = tabs.includes(fieldTab) ? fieldTab : 'general';
		const meta = field.kind === 'raw' ? FORM_RAW_FIELD_META : FORM_WIDGET_META[field.widget];
		return (
			<div className={classes.panelRoot}>
				<div className={classes.inspectorHeader}>
					<ThemeIcon size={36} variant="light" color={meta.color} radius="md">
						<meta.icon size={18} />
					</ThemeIcon>
					<div className={classes.inspectorTitle}>
						<Text fw={600} truncate>
							{draftFieldTitle(field)}
						</Text>
						<Text fz="xs" c="dimmed" truncate>
							{field.kind === 'raw' ? 'JSON' : formWidgetLabel(field.widget)} ·{' '}
							<Text span inherit ff="monospace">
								{selected.path}
							</Text>
						</Text>
					</div>
					<Tooltip label="Close">
						<ActionIcon aria-label="Close field settings" onClick={() => builder.select(null)}>
							<LuX size={16} />
						</ActionIcon>
					</Tooltip>
				</div>

				<InspectorTabs
					value={tab}
					onChange={setFieldTab}
					data={tabs.map((value) => ({ value, label: FORM_BUILDER_FIELD_TAB_LABELS[value] }))}
				/>

				<ScrollArea flex={1} type="hover">
					<div className={classes.inspectorBody}>
						<FormBuilderFieldPanel
							key={field.id}
							builder={builder}
							field={field}
							tab={tab}
							readOnly={readOnly}
						/>
					</div>
				</ScrollArea>

				{!readOnly && (
					<div className={classes.inspectorFooter}>
						<Button
							fullWidth
							variant="default"
							color="red"
							c="red.7"
							leftSection={<LuTrash2 size={16} />}
							onClick={() => {
								builder.update((current) => removeDraftField(current, field.id));
								builder.select(null);
							}}
						>
							Delete field
						</Button>
					</div>
				)}
			</div>
		);
	}

	const fields = walkDraft(draft.fields).map((item) => item.field);
	const required = fields.filter((field) => field.required).length;

	return (
		<div className={classes.panelRoot}>
			<div className={classes.inspectorHeader}>
				<div className={classes.inspectorTitle}>
					<Text fw={600}>Form settings</Text>
					<Text fz="xs" c="dimmed">
						Select a field to configure it
					</Text>
				</div>
			</div>

			<InspectorTabs value={formTab} onChange={setFormTab} data={FORM_BUILDER_FORM_TABS} />

			<ScrollArea flex={1} type="hover">
				<Stack gap="lg" className={classes.inspectorBody}>
					{formTab === 'general' && form && !readOnly && <FormUsage form={form} />}

					{formTab === 'summary' ? (
						<Card shadow="none" padding="sm">
							<Group grow>
								<div className={classes.metric}>
									<Text fw={600}>{fields.length}</Text>
									<Text fz="xs" c="dimmed">
										Fields
									</Text>
								</div>
								<div className={classes.metric}>
									<Text fw={600}>{required}</Text>
									<Text fz="xs" c="dimmed">
										Required
									</Text>
								</div>
								<div className={classes.metric}>
									<Text fw={600}>{draft.sections.length}</Text>
									<Text fz="xs" c="dimmed">
										Sections
									</Text>
								</div>
							</Group>
						</Card>
					) : (
						<FormBuilderLayoutPanel builder={builder} tab={formTab} readOnly={readOnly} />
					)}
				</Stack>
			</ScrollArea>

			<div className={classes.inspectorFooter}>
				<Button
					fullWidth
					variant="default"
					leftSection={<LuBraces size={16} />}
					onClick={() => builder.setTab('json')}
				>
					{readOnly ? 'View JSON' : 'Edit JSON'}
				</Button>
			</div>
		</div>
	);
};
