import React from 'react';

import { useDroppable } from '@dnd-kit/core';
import { Alert, Group, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon } from '@mantine/core';
import { LuCircleAlert, LuListPlus } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { FormPreviewPanel } from '@module/form-engine/components/FormPreviewPanel';
import type { FormBuilderState, FormBuilderTab } from '@module/form-engine/types/FormBuilderState';
import { containerId, walkDraft } from '@module/form-engine/utils';

import classes from './FormBuilder.module.scss';
import { useFormBuilderDropTarget } from './FormBuilderDnd.context';
import { FormBuilderTree } from './FormBuilderTree';

const TABS: { label: string; value: FormBuilderTab }[] = [
	{ label: 'Build', value: 'build' },
	{ label: 'JSON', value: 'json' },
	{ label: 'Preview', value: 'preview' },
];

/** Build | JSON | Preview; an invalid JSON edit has to be fixed before leaving the JSON tab. */
export const FormBuilderModeSwitch: React.FC<{ builder: FormBuilderState }> = ({ builder }) => (
	<SegmentedControl
		size="xs"
		value={builder.tab}
		onChange={(value) => builder.setTab(value as FormBuilderTab)}
		data={TABS.map((tab) => ({
			...tab,
			disabled: !!builder.jsonError && builder.tab === 'json' && tab.value !== 'json',
		}))}
		classNames={{ root: classes.segmented, indicator: classes.indicator, label: classes.segmentLabel }}
	/>
);

const UNGROUPED_ID = containerId({ type: 'ungrouped' });

/** A form without fields: the whole prompt takes drops from the palette. */
const EmptyDrop: React.FC = () => {
	const { setNodeRef } = useDroppable({ id: UNGROUPED_ID, data: { container: { type: 'ungrouped' } } });
	const over = useFormBuilderDropTarget() === UNGROUPED_ID;

	return (
		<Stack ref={setNodeRef} align="center" gap={6} className={classes.empty} data-over={over || undefined}>
			<ThemeIcon size={36} radius="xl" variant="light" color="gray">
				<LuListPlus size={18} />
			</ThemeIcon>
			<Text fz="sm" fw={600}>
				Start building your form
			</Text>
			<Text fz="xs" c="dimmed" ta="center" maw={280}>
				Drag a field here from the left panel, or click one to add it. Drag the handles to reorder, or into
				groups and repeaters.
			</Text>
		</Stack>
	);
};

interface FormBuilderCanvasProps {
	builder: FormBuilderState;
	readOnly: boolean;
}

/** The middle of the builder: the field tree on a sheet, the JSON editors, or the test-fill preview. */
export const FormBuilderCanvas: React.FC<FormBuilderCanvasProps> = ({ builder, readOnly }) => {
	const { draft } = builder;
	// Top-level, as the library counts them; nested fields are noted on the side.
	const count = draft.fields.length;
	const nested = walkDraft(draft.fields).length - count;
	const building = builder.tab === 'build';

	return (
		// A click anywhere off a field, sheet or dotted surface, goes back to the form settings.
		<div className={classes.canvas} onClick={building ? () => builder.select(null) : undefined}>
			{building && (
				<div className={classes.sheet} data-width="narrow">
					<Group justify="space-between" gap="xs" wrap="nowrap" className={classes.sheetHeader}>
						<Text fw={600} truncate>
							{draft.name.trim() || 'Untitled form'}
						</Text>
						<Text fz="xs" c="dimmed" style={{ flexShrink: 0 }}>
							{count} {count === 1 ? 'field' : 'fields'}
							{nested > 0 && ` · ${nested} nested`}
							{draft.columns > 1 && ` · ${draft.columns} columns`}
						</Text>
					</Group>
					{draft.fields.length === 0 && draft.sections.length === 0 && !readOnly ? (
						<EmptyDrop />
					) : (
						<div className={classes.sheetBody}>
							<FormBuilderTree builder={builder} readOnly={readOnly} />
						</div>
					)}
				</div>
			)}

			{builder.tab === 'json' && (
				<div className={classes.sheet}>
					<Stack gap="sm" className={classes.sheetBody}>
						{builder.jsonError && (
							<Alert color="red" variant="light" p="xs" icon={<LuCircleAlert size={16} />}>
								<Text fz="xs" fw={600}>
									Fix this to leave the JSON tab
								</Text>
								<Text fz="xs">{builder.jsonError}</Text>
							</Alert>
						)}
						<SimpleGrid cols={{ base: 1, lg: 2 }}>
							<CodeEditor
								label="Schema"
								description="JSON Schema (draft 2020-12) of the payload"
								language="json"
								height={520}
								readOnly={readOnly}
								value={builder.json.schema}
								onChange={(text) => builder.setJson('schema', text)}
							/>
							<CodeEditor
								label="UI"
								description="Layout, widgets and conditions (ui contract v1); blank for none"
								language="json"
								height={520}
								readOnly={readOnly}
								value={builder.json.ui}
								onChange={(text) => builder.setJson('ui', text)}
							/>
						</SimpleGrid>
					</Stack>
				</div>
			)}

			{builder.tab === 'preview' && (
				<div className={classes.sheet}>
					<div className={classes.sheetBody}>
						<FormPreviewPanel schema={builder.output.schema} ui={builder.output.ui} />
					</div>
				</div>
			)}
		</div>
	);
};
