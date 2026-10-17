import React, { useState } from 'react';

import { Anchor, Button, Collapse, Group, Loader, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuChevronUp, LuExternalLink, LuGripVertical, LuLibrary, LuSearch } from 'react-icons/lu';
import { Link } from 'react-router';

import { useCoreSelector } from '@core/store';

import { NODE_LIBRARY_QUERY, nodeDefinitionLink } from '@module/node-definition/data';
import { useListNodeDefinitionsQuery } from '@module/node-definition/hooks';
import { nodeTypeMetaOf, selectNodeTypeCatalog } from '@module/node-type/data';
import { scopeTrail } from '@module/workflow-definition/data';
import {
	PALETTE_DRAG_TYPE,
	useWorkflowDefinitionEditorAddNode,
	type WorkflowDefinitionPaletteItem,
} from '@module/workflow-definition/hooks';
import { selectEditorNodeDefinition, selectEditorNodes, selectEditorScope } from '@module/workflow-definition/store';

import classes from './WorkflowDefinitionPalette.module.scss';

type SectionId = 'builtin' | 'custom' | 'library';

// A join only arrives together with its parallel_start, so the palette never offers it alone.
const PAIRED_ONLY_TYPES = new Set(['parallel_end']);

interface PaletteEntryProps {
	item: WorkflowDefinitionPaletteItem;
	/** A type from the engine's catalog, or the type of a node library entry. */
	type: string;
	title: string;
	description: string;
	/** Node library entries link to their definition page. */
	libraryId?: string;
	onAdd: (item: WorkflowDefinitionPaletteItem) => void;
}

const PaletteEntry: React.FC<PaletteEntryProps> = ({ item, type, title, description, libraryId, onAdd }) => {
	const meta = nodeTypeMetaOf(type);

	const entry = (
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

	if (!libraryId) return entry;

	// A sibling of the button, not inside it: a link can't nest in a button. A new tab keeps the editor as it is.
	return (
		<div className={classes.entry}>
			{entry}
			<Anchor
				component={Link}
				to={nodeDefinitionLink(libraryId)}
				target="_blank"
				rel="noopener"
				fz="xs"
				className={classes.libraryLink}
			>
				<LuExternalLink size={12} />
				Open in library
			</Anchor>
		</div>
	);
};

export const WorkflowDefinitionPalette: React.FC = () => {
	const [query, setQuery] = useState('');
	const [openSections, setOpenSections] = useState<SectionId[]>(['builtin', 'custom', 'library']);
	const addNode = useWorkflowDefinitionEditorAddNode();

	const nodes = useCoreSelector(selectEditorNodes);
	const scope = useCoreSelector(selectEditorScope);
	const scopeLabel = scopeTrail(nodes, scope).at(-1)?.config.name ?? 'Workflow';
	// The engine resolves library references one level deep, so a node definition's own nodes must be inline.
	const withLibrary = !useCoreSelector(selectEditorNodeDefinition);

	const library = useListNodeDefinitionsQuery(NODE_LIBRARY_QUERY, { skip: !withLibrary });
	const catalog = useCoreSelector(selectNodeTypeCatalog);

	const term = query.trim().toLowerCase();
	const matches = (...values: string[]) => !term || values.some((value) => value.toLowerCase().includes(term));

	// Whatever the engine lists, in its order: a type added to the engine shows up here without a UI release.
	const types = catalog.items
		.filter((item) => !PAIRED_ONLY_TYPES.has(item.type))
		.map((item) => ({ item, meta: nodeTypeMetaOf(item.type, item) }))
		.filter(({ meta }) => matches(meta.label, meta.description));
	const builtins = types.filter(({ item }) => item.builtin);
	const customs = types.filter(({ item }) => !item.builtin);
	const definitions = (library.data?.items ?? []).filter((definition) =>
		matches(definition.name, nodeTypeMetaOf(definition.type, catalog.byType[definition.type]).label),
	);

	const renderTypes = (entries: typeof types) =>
		entries.map(({ item, meta }) => (
			<PaletteEntry
				key={item.type}
				item={{ type: item.type }}
				type={item.type}
				title={meta.label}
				description={meta.description}
				onAdd={addNode}
			/>
		));

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
				description={`v${definition.version} · ${nodeTypeMetaOf(definition.type, catalog.byType[definition.type]).label}`}
				libraryId={definition.id}
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
						renderTypes(builtins)
					),
				)}
				{customs.length > 0 && renderSection('custom', 'Custom types', customs.length, renderTypes(customs))}
				{withLibrary &&
					renderSection('library', 'Node library', library.data ? definitions.length : null, renderLibrary())}
			</ScrollArea>
		</div>
	);
};
