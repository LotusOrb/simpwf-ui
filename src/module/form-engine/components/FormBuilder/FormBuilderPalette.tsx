import React, { useState } from 'react';

import { useDraggable } from '@dnd-kit/core';
import { Collapse, Group, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuChevronUp, LuGripVertical, LuLibrary, LuSearch } from 'react-icons/lu';

import { FORM_WIDGET_LABELS } from '@module/form-engine/constant';
import type { FormWidget } from '@module/form-engine/types/FormWidget';

import { FORM_WIDGET_GROUPS, FORM_WIDGET_META } from './FormBuilder.constants';
import classes from './FormBuilder.module.scss';
import { PALETTE_DRAG_PREFIX } from './FormBuilderDnd.context';

const PaletteItem: React.FC<{ widget: FormWidget; onAdd: (widget: FormWidget) => void }> = ({ widget, onAdd }) => {
	const meta = FORM_WIDGET_META[widget];
	const { setNodeRef, listeners, isDragging } = useDraggable({
		id: `${PALETTE_DRAG_PREFIX}${widget}`,
		data: { widget },
	});

	return (
		<UnstyledButton
			ref={setNodeRef}
			className={classes.paletteItem}
			data-dragging={isDragging || undefined}
			// Pointer drags only: Enter and Space keep adding by click.
			onPointerDown={listeners?.onPointerDown as React.PointerEventHandler | undefined}
			onClick={() => onAdd(widget)}
			aria-label={`Add ${FORM_WIDGET_LABELS[widget]}`}
		>
			<div className={classes.paletteIcon}>
				<meta.icon size={18} color={`var(--mantine-color-${meta.color}-6)`} />
			</div>
			<div className={classes.paletteBody}>
				<Text fz="sm" fw={600} truncate>
					{FORM_WIDGET_LABELS[widget]}
				</Text>
				<Text fz="xs" c="dimmed" truncate>
					{meta.description}
				</Text>
			</div>
			<LuGripVertical size={14} className={classes.paletteGrip} aria-hidden />
		</UnstyledButton>
	);
};

interface FormBuilderPaletteProps {
	/** Where a click adds (a drag adds where it's dropped): into the selected group or repeater, else after the selected field. */
	target: string;
	onAdd: (widget: FormWidget) => void;
}

export const FormBuilderPalette: React.FC<FormBuilderPaletteProps> = ({ target, onAdd }) => {
	const [query, setQuery] = useState('');
	const [closed, setClosed] = useState<string[]>([]);

	const term = query.trim().toLowerCase();
	const groups = FORM_WIDGET_GROUPS.map((group) => ({
		...group,
		widgets: group.widgets.filter(
			(widget) =>
				!term ||
				FORM_WIDGET_LABELS[widget].toLowerCase().includes(term) ||
				FORM_WIDGET_META[widget].description.toLowerCase().includes(term),
		),
	})).filter((group) => group.widgets.length > 0);

	const toggle = (id: string) =>
		setClosed((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));

	return (
		<div className={classes.panelRoot}>
			<div className={classes.paletteHeader}>
				<Group gap="xs" wrap="nowrap">
					<LuLibrary size={16} />
					<Text fz="sm" fw={600} truncate>
						Add field
					</Text>
				</Group>
				<Text fz="xs" c="dimmed" truncate>
					Drag onto the form, or click to add {target}
				</Text>
			</div>

			<div className={classes.paletteSearch}>
				<TextInput
					size="sm"
					placeholder="Find"
					leftSection={<LuSearch size={14} />}
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
				/>
			</div>

			<ScrollArea flex={1} type="hover">
				{groups.length === 0 && (
					<Text fz="xs" c="dimmed" p="md">
						No matching fields
					</Text>
				)}
				{groups.map((group) => {
					const opened = !!term || !closed.includes(group.id);
					return (
						<div key={group.id} className={classes.paletteSection}>
							<UnstyledButton
								className={classes.paletteSectionHeader}
								onClick={() => toggle(group.id)}
								aria-expanded={opened}
							>
								<Group gap={6}>
									<Text fz="sm" fw={500}>
										{group.title}
									</Text>
									<Text fz="xs" c="dimmed">
										{group.widgets.length}
									</Text>
								</Group>
								{opened ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
							</UnstyledButton>
							<Collapse expanded={opened}>
								<div className={classes.paletteItems}>
									{group.widgets.map((widget) => (
										<PaletteItem key={widget} widget={widget} onAdd={onAdd} />
									))}
								</div>
							</Collapse>
						</div>
					);
				})}
			</ScrollArea>
		</div>
	);
};
