import React, { useState } from 'react';

import { Button, Group, SimpleGrid, Stack, Text, TextInput, ThemeIcon, Title, UnstyledButton } from '@mantine/core';
import { LuPuzzle } from 'react-icons/lu';

import { useAppLayoutInsets } from '@module/app/hooks';
import { nodeDefinitionTypeMeta } from '@module/node-definition/data';
import { useNodeDefinitionLibrary } from '@module/node-definition/hooks';
import { nodeTypeOrder } from '@module/workflow-definition/data';

import classes from './NodeDefinitionTypePicker.module.scss';

// A lone parallel half carries graph ids of the workflow around it, so it can't be authored on its own.
const BUILTIN_TYPES = nodeTypeOrder.filter((type) => type !== 'parallel_start' && type !== 'parallel_end');

// Custom types are registered as lowercase identifiers (e.g. s3fetch).
const TYPE_PATTERN = /^[a-z][a-z0-9_]*$/;

interface NodeDefinitionTypePickerProps {
	onPick: (type: string) => void;
}

/** First step of a new node definition: its type is fixed for the lineage and decides what the editor shows. */
export const NodeDefinitionTypePicker: React.FC<NodeDefinitionTypePickerProps> = ({ onPick }) => {
	const { customTypes } = useNodeDefinitionLibrary();
	// The layout's panels float over the page; the picker starts below the header.
	const insets = useAppLayoutInsets();
	const [customType, setCustomType] = useState('');
	const customValid = TYPE_PATTERN.test(customType);

	const renderOption = (type: string) => {
		const meta = nodeDefinitionTypeMeta(type);
		return (
			<UnstyledButton key={type} className={classes.option} onClick={() => onPick(type)}>
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
					{BUILTIN_TYPES.map(renderOption)}
				</SimpleGrid>

				<Stack gap="sm">
					<div>
						<Text fw={600} fz="sm">
							Custom type
						</Text>
						<Text fz="xs" c="dimmed">
							A type registered with the engine. It's edited as JSON and checked by the engine on save.
						</Text>
					</div>
					{customTypes.length > 0 && (
						<SimpleGrid cols={{ base: 1, xs: 2, md: 3 }} spacing="sm">
							{customTypes.map(renderOption)}
						</SimpleGrid>
					)}
					<form
						onSubmit={(event) => {
							event.preventDefault();
							if (customValid) onPick(customType);
						}}
					>
						<Group gap="xs" align="flex-start">
							<TextInput
								w={260}
								placeholder="s3fetch"
								aria-label="Custom node type"
								leftSection={<LuPuzzle size={14} />}
								value={customType}
								onChange={(event) => setCustomType(event.currentTarget.value.trim())}
								error={
									customType && !customValid ? 'Use a lowercase identifier, like s3fetch' : undefined
								}
							/>
							<Button type="submit" variant="default" disabled={!customValid}>
								Use this type
							</Button>
						</Group>
					</form>
				</Stack>
			</Stack>
		</div>
	);
};
