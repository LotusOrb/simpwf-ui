import React, { useState } from 'react';

import { Button, Collapse, Group, Loader, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuChevronUp, LuGripVertical, LuLibrary, LuSearch } from 'react-icons/lu';

import { useCoreSelector } from '@core/store';

import { useListNodeDefinitionsQuery } from '@module/node-definition/hooks';
import { nodeTypeMeta, nodeTypeOrder, scopeTrail } from '@module/workflow-definition/data';
import {
	PALETTE_DRAG_TYPE,
	useWorkflowDefinitionEditorAddNode,
	type WorkflowDefinitionPaletteItem,
} from '@module/workflow-definition/hooks';
import { selectEditorNodes, selectEditorScope } from '@module/workflow-definition/store';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import classes from './WorkflowDefinitionPalette.module.scss';

type SectionId = 'builtin' | 'library';

interface PaletteEntryProps {
	item: WorkflowDefinitionPaletteItem;
	type: WorkflowDefinitionNodeType;
	title: string;
	description: string;
	onAdd: (item: WorkflowDefinitionPaletteItem) => void;
}

const PaletteEntry: React.FC<PaletteEntryProps> = ({ item, type, title, description, onAdd }) => {
	const meta = nodeTypeMeta[type];

	return (
		<UnstyledButton
			className={classes.item}
			draggable
			onDragStart={(event) => {
				event.dataTransfer.setData(PALETTE_DRAG_TYPE, JSON.stringify(item));
				event.dataTransfer.effectAllowed = 'move';
			}}
			onClick={() => onAdd(item)}
			aria-label={`Add ${title}`}
		>
			<div className={classes.itemIcon}>
				<meta.icon size={18} color={`var(--mantine-color-${meta.color}-6)`} />
			</div>
			<div className={classes.itemBody}>
				<Text fz="sm" fw={600} truncate>
					{title}
				</Text>
				<Text fz="xs" c="dimmed" truncate>
					{description}
				</Text>
			</div>
			<LuGripVertical size={14} className={classes.grip} aria-hidden />
		</UnstyledButton>
	);
};

export const WorkflowDefinitionPalette: React.FC = () => {
	const [query, setQuery] = useState('');
	const [openSections, setOpenSections] = useState<SectionId[]>(['builtin', 'library']);
	const addNode = useWorkflowDefinitionEditorAddNode();

	const nodes = useCoreSelector(selectEditorNodes);
	const scope = useCoreSelector(selectEditorScope);
	const scopeLabel = scopeTrail(nodes, scope).at(-1)?.config.name ?? 'Workflow';

	const library = useListNodeDefinitionsQuery({
		perPage: 200,
		order: { by: 'name', direction: 'asc' },
		filter: { latest_only: { op: '_eq', value: 'true' } },
	});

	const term = query.trim().toLowerCase();
	const matches = (...values: string[]) => !term || values.some((value) => value.toLowerCase().includes(term));

	const builtins = nodeTypeOrder.filter((type) => matches(nodeTypeMeta[type].label, nodeTypeMeta[type].description));
	const definitions = (library.data?.items ?? []).filter((definition) =>
		matches(definition.name, nodeTypeMeta[definition.type].label),
	);

	const toggleSection = (id: SectionId) =>
		setOpenSections((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));

	const renderSection = (id: SectionId, label: string, count: number | null, children: React.ReactNode) => {
		const opened = openSections.includes(id);
		return (
			<div className={classes.section}>
				<UnstyledButton
					className={classes.sectionHeader}
					onClick={() => toggleSection(id)}
					aria-expanded={opened}
				>
					<Group gap={6}>
						<Text fz="sm" fw={500}>
							{label}
						</Text>
						{count !== null && (
							<Text fz="xs" c="dimmed">
								{count}
							</Text>
						)}
					</Group>
					{opened ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
				</UnstyledButton>
				<Collapse expanded={opened}>
					<div className={classes.items}>{children}</div>
				</Collapse>
			</div>
		);
	};

	const renderLibrary = () => {
		if (library.isLoading) {
			return (
				<Group justify="center" py="sm">
					<Loader size="xs" color="gray" />
				</Group>
			);
		}
		if (library.isError) {
			return (
				<Group justify="space-between" px={4} pb="xs">
					<Text fz="xs" c="dimmed">
						Couldn't load the node library
					</Text>
					<Button variant="default" size="compact-xs" onClick={library.refetch}>
						Retry
					</Button>
				</Group>
			);
		}
		if (definitions.length === 0) {
			return (
				<Text fz="xs" c="dimmed" px={4} pb="xs">
					{term ? 'No matching node definitions' : 'No node definitions registered yet'}
				</Text>
			);
		}
		return definitions.map((definition) => (
			<PaletteEntry
				key={definition.id}
				item={{ definition }}
				type={definition.type}
				title={definition.name}
				description={`v${definition.version} · ${nodeTypeMeta[definition.type].label}`}
				onAdd={addNode}
			/>
		));
	};

	return (
		<div className={classes.root}>
			<div className={classes.header}>
				<Group gap="xs" wrap="nowrap">
					<LuLibrary size={16} />
					<Text fz="sm" fw={600} truncate>
						Add to {scopeLabel}
					</Text>
				</Group>
				<Text fz="xs" c="dimmed">
					Drag onto the canvas or click to add
				</Text>
			</div>

			<div className={classes.search}>
				<TextInput
					size="sm"
					placeholder="Find"
					leftSection={<LuSearch size={14} />}
					value={query}
					onChange={(event) => setQuery(event.currentTarget.value)}
				/>
			</div>

			<ScrollArea flex={1} type="hover">
				{renderSection(
					'builtin',
					'Built-in',
					null,
					builtins.length === 0 ? (
						<Text fz="xs" c="dimmed" px={4} pb="xs">
							No matching node types
						</Text>
					) : (
						builtins.map((type) => (
							<PaletteEntry
								key={type}
								item={{ type }}
								type={type}
								title={nodeTypeMeta[type].label}
								description={nodeTypeMeta[type].description}
								onAdd={addNode}
							/>
						))
					),
				)}
				{renderSection('library', 'Node library', library.data ? definitions.length : null, renderLibrary())}
			</ScrollArea>
		</div>
	);
};
