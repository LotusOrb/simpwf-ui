import React from 'react';

import { useDroppable } from '@dnd-kit/core';
import { SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ActionIcon, Badge, Group, Stack, Text, Tooltip } from '@mantine/core';
import { LuEyeOff, LuGripVertical, LuLock, LuTrash2 } from 'react-icons/lu';

import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';
import type { FormDraftField } from '@module/form-engine/types/FormDraftField';
import {
	type FormBuilderContainer,
	containerFields,
	containerId,
	formWidgetLabel,
	hasChildren,
	removeDraftField,
} from '@module/form-engine/utils';

import { FORM_RAW_FIELD_META, FORM_WIDGET_META, draftFieldTitle } from './FormBuilder.constants';
import classes from './FormBuilder.module.scss';
import { useFormBuilderDropTarget } from './FormBuilderDnd.context';

interface TreeContext {
	builder: FormBuilderState;
	readOnly: boolean;
	overId: string | null;
}

const TreeItem: React.FC<{ field: FormDraftField; container: FormBuilderContainer; ctx: TreeContext }> = ({
	field,
	container,
	ctx,
}) => {
	const { builder, readOnly, overId } = ctx;
	const { attributes, listeners, setNodeRef, setActivatorNodeRef, transform, transition, isDragging } = useSortable({
		id: field.id,
		data: { container },
		disabled: readOnly,
	});
	const selected = builder.selectedId === field.id;
	const meta = field.kind === 'raw' ? FORM_RAW_FIELD_META : FORM_WIDGET_META[field.widget];

	return (
		<div
			ref={setNodeRef}
			style={{ transform: CSS.Translate.toString(transform), transition }}
			className={classes.treeItem}
			data-selected={selected || undefined}
			data-dragging={isDragging || undefined}
			data-over={overId === field.id || undefined}
		>
			<Group
				gap={6}
				wrap="nowrap"
				className={classes.treeRow}
				onClick={(event) => {
					event.stopPropagation();
					builder.select(field.id);
				}}
			>
				{!readOnly && (
					<ActionIcon
						ref={setActivatorNodeRef}
						variant="subtle"
						color="gray"
						size="sm"
						className={classes.handle}
						aria-label={`Drag ${field.key}`}
						{...attributes}
						{...listeners}
					>
						<LuGripVertical size={14} />
					</ActionIcon>
				)}
				<div className={classes.treeIcon}>
					<meta.icon size={16} color={`var(--mantine-color-${meta.color}-6)`} />
				</div>
				<div className={classes.treeLabel}>
					<Text fz="sm" fw={500} truncate>
						{draftFieldTitle(field)}
					</Text>
					<Text fz={11} c="dimmed" ff="monospace" truncate>
						{field.key}
					</Text>
				</div>
				{field.kind === 'raw' ? (
					<Tooltip label={`Edit in the JSON tab: ${field.reason}`}>
						<Badge size="xs" variant="light" color="gray" leftSection={<LuLock size={10} />}>
							JSON
						</Badge>
					</Tooltip>
				) : (
					<Badge size="xs" variant="light" color={meta.color}>
						{formWidgetLabel(field.widget)}
					</Badge>
				)}
				{field.required && (
					<Badge size="xs" variant="light" color="red">
						req
					</Badge>
				)}
				{field.kind === 'input' && field.visibleWhen && (
					<Tooltip label="Shown only when its condition holds">
						<span className={classes.inlineIcon}>
							<LuEyeOff size={12} />
						</span>
					</Tooltip>
				)}
				{!readOnly && (
					<ActionIcon
						variant="subtle"
						color="red"
						size="sm"
						aria-label={`Remove ${field.key}`}
						onClick={(event) => {
							event.stopPropagation();
							builder.update((draft) => removeDraftField(draft, field.id));
							if (selected) builder.select(null);
						}}
					>
						<LuTrash2 size={14} />
					</ActionIcon>
				)}
			</Group>
			{hasChildren(field) && (
				<div className={classes.treeChildren}>
					<TreeContainer container={{ type: 'children', id: field.id }} ctx={ctx} empty="Drop fields here" />
				</div>
			)}
		</div>
	);
};

const TreeContainer: React.FC<{ container: FormBuilderContainer; ctx: TreeContext; empty: string }> = ({
	container,
	ctx,
	empty,
}) => {
	const id = containerId(container);
	const { setNodeRef } = useDroppable({ id, data: { container }, disabled: ctx.readOnly });
	const fields = containerFields(ctx.builder.draft, container);

	return (
		<SortableContext id={id} items={fields.map((field) => field.id)} strategy={verticalListSortingStrategy}>
			<Stack
				ref={setNodeRef}
				gap={4}
				className={classes.treeContainer}
				data-over={ctx.overId === id || undefined}
			>
				{fields.map((field) => (
					<TreeItem key={field.id} field={field} container={container} ctx={ctx} />
				))}
				{fields.length === 0 && (
					<Text fz="xs" c="dimmed" ta="center" py={6}>
						{empty}
					</Text>
				)}
			</Stack>
		</SortableContext>
	);
};

interface FormBuilderTreeProps {
	builder: FormBuilderState;
	readOnly: boolean;
}

/** The field tree: drag to reorder, into groups and repeaters, or between sections. Needs a `FormBuilderDnd` above. */
export const FormBuilderTree: React.FC<FormBuilderTreeProps> = ({ builder, readOnly }) => {
	const overId = useFormBuilderDropTarget();
	const { draft } = builder;
	const sectioned = draft.sections.length > 0;

	return (
		<Stack gap="md">
			<Stack gap={6}>
				{sectioned && (
					<Text fz={11} fw={600} tt="uppercase" c="dimmed" lts={0.4}>
						Not in a section
					</Text>
				)}
				<TreeContainer
					container={{ type: 'ungrouped' }}
					ctx={{ builder, readOnly, overId }}
					empty={draft.fields.length ? 'Drop fields here' : 'Drag or click a field in the palette'}
				/>
			</Stack>
			{draft.sections.map((section) => (
				<Stack key={section.id} gap={6}>
					<Text fz={11} fw={600} tt="uppercase" c="dimmed" lts={0.4}>
						Section · {section.title || 'Untitled'}
					</Text>
					<TreeContainer
						container={{ type: 'section', id: section.id }}
						ctx={{ builder, readOnly, overId }}
						empty="Drop fields here"
					/>
				</Stack>
			))}
		</Stack>
	);
};
