import React from 'react';

import { ActionIcon, CloseButton, Text, TextInput, Title } from '@mantine/core';
import { LuSearch } from 'react-icons/lu';

import classes from './WorkflowDefinitionHero.module.scss';

interface WorkflowDefinitionHeroProps {
	search: string;
	onSearchChange: (value: string) => void;
}

export const WorkflowDefinitionHero: React.FC<WorkflowDefinitionHeroProps> = ({ search, onSearchChange }) => {
	return (
		<div className={classes.root}>
			<span className={classes.shapeStart} aria-hidden />
			<span className={classes.shapeEnd} aria-hidden />

			<div className={classes.content}>
				<Title order={3} className={classes.title}>
					Build Automations Faster with
					<br />
					<span className={classes.highlight}>Versioned</span> Workflow Definitions
				</Title>
				<Text fz="sm" c="dimmed" ta="center">
					Immutable definitions — every change ships as a new version.
				</Text>

				<TextInput
					className={classes.search}
					radius="xl"
					size="md"
					placeholder="Search workflow definitions by name..."
					aria-label="Search workflow definitions"
					value={search}
					onChange={(event) => onSearchChange(event.currentTarget.value)}
					rightSectionWidth={search ? 68 : 44}
					rightSection={
						<>
							{search && (
								<CloseButton size="sm" aria-label="Clear search" onClick={() => onSearchChange('')} />
							)}
							<ActionIcon variant="filled" color="brand" radius="xl" size={30} aria-label="Search">
								<LuSearch size={15} />
							</ActionIcon>
						</>
					}
				/>
			</div>
		</div>
	);
};
