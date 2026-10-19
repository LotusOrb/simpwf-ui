import React from 'react';

import { SimpleGrid, Stack, Text, ThemeIcon, Title, UnstyledButton } from '@mantine/core';

import { useAppLayoutInsets } from '@module/app/hooks';
import { useNodeTypeCatalog } from '@module/node-type/hooks';
import type { NodeTypeCatalogItem } from '@module/node-type/types/NodeTypeCatalogItem';
import { nodeTypeMetaOf } from '@module/node-type/utils';

import classes from './NodeDefinitionTypePicker.module.scss';

// A lone parallel half carries graph ids of the workflow around it, so it can't be authored on its own.
const PAIRED_ONLY_TYPES = new Set(['parallel_start', 'parallel_end']);

interface NodeDefinitionTypePickerProps {
	onPick: (type: string) => void;
}

/**
 * First step of a new node definition: its type is fixed for the lineage and decides what the editor shows. The
 * choices are the types the engine's catalog lists, builtin and registered custom alike.
 */
export const NodeDefinitionTypePicker: React.FC<NodeDefinitionTypePickerProps> = ({ onPick }) => {
	const { catalog } = useNodeTypeCatalog();
	// The layout's panels float over the page; the picker starts below the header.
	const insets = useAppLayoutInsets();
	const authorable = catalog.items.filter((item) => !PAIRED_ONLY_TYPES.has(item.type));
	const builtins = authorable.filter((item) => item.builtin);
	const customs = authorable.filter((item) => !item.builtin);

	const renderOption = (item: NodeTypeCatalogItem) => {
		const meta = nodeTypeMetaOf(item.type, item);
		return (
			<UnstyledButton key={item.type} className={classes.option} onClick={() => onPick(item.type)}>
				<ThemeIcon size={36} variant="light" color={meta.color} radius="md">
					<meta.icon size={18} />
				</ThemeIcon>
				<div>
					<Text fz="sm" fw={600}>
						{meta.label}
					</Text>
					<Text fz="xs" c="dimmed">
						{meta.description}
					</Text>
				</div>
			</UnstyledButton>
		);
	};

	return (
		<div className={classes.root} style={{ paddingTop: insets.top }}>
			<Stack gap="xl" p={{ base: 'md', md: 'xl' }} maw={920} mx="auto">
				<div>
					<Title order={3} fz="lg">
						What kind of node is it?
					</Title>
					<Text fz="sm" c="dimmed">
						The type is fixed for every version of the definition. You'll configure the node next.
					</Text>
				</div>

				<SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm">
					{builtins.map(renderOption)}
				</SimpleGrid>

				<Stack gap="sm">
					<div>
						<Text fw={600} fz="sm">
							Custom types
						</Text>
						<Text fz="xs" c="dimmed">
							{customs.length > 0
								? 'Types registered with the engine. Their fields come from the schema they were registered with.'
								: 'No custom types are registered with this engine.'}
						</Text>
					</div>
					{customs.length > 0 && (
						<SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm">
							{customs.map(renderOption)}
						</SimpleGrid>
					)}
				</Stack>
			</Stack>
		</div>
	);
};
