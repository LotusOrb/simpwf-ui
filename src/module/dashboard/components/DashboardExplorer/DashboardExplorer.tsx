import React, { useState } from 'react';

import { ActionIcon, Collapse, Group, ScrollArea, Text, TextInput, UnstyledButton } from '@mantine/core';
import { LuChevronDown, LuChevronUp, LuCloud, LuSearch, LuStar } from 'react-icons/lu';

import { explorerSections, type ExplorerItem } from '../../data';
import classes from './DashboardExplorer.module.scss';

export const DashboardExplorer: React.FC = () => {
	const [query, setQuery] = useState('');
	const [openSections, setOpenSections] = useState<string[]>(['favorites', 'integration', 'stores']);
	const [starred, setStarred] = useState<string[]>(() =>
		explorerSections.flatMap((section) => section.items.filter((item) => item.starred).map((item) => item.id)),
	);

	const toggleSection = (id: string) =>
		setOpenSections((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));

	const toggleStar = (id: string) =>
		setStarred((current) => (current.includes(id) ? current.filter((s) => s !== id) : [...current, id]));

	const matches = (item: ExplorerItem) => item.name.toLowerCase().includes(query.trim().toLowerCase());

	const allItems = explorerSections.flatMap((section) => section.items);
	const sections = explorerSections.map((section) =>
		section.id === 'favorites'
			? { ...section, items: allItems.filter((item) => starred.includes(item.id)) }
			: section,
	);

	return (
		<div className={classes.root}>
			<UnstyledButton className={classes.workspace}>
				<Group gap="xs" wrap="nowrap">
					<LuCloud size={16} />
					<Text fz="sm" fw={600} truncate>
						Workspace/Overview
					</Text>
				</Group>
				<LuChevronDown size={16} />
			</UnstyledButton>

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
				{sections.map((section) => {
					const items = section.items.filter(matches);
					const opened = openSections.includes(section.id);

					return (
						<div key={section.id} className={classes.section}>
							<UnstyledButton className={classes.sectionHeader} onClick={() => toggleSection(section.id)}>
								<Text fz="sm" fw={500}>
									{section.label}
								</Text>
								{opened ? <LuChevronUp size={16} /> : <LuChevronDown size={16} />}
							</UnstyledButton>

							<Collapse expanded={opened}>
								<div className={classes.items}>
									{items.length === 0 && (
										<Text fz="xs" c="dimmed" px={4} pb="xs">
											{section.id === 'favorites' ? 'Star an item to pin it here' : 'No items'}
										</Text>
									)}
									{items.map((item) => {
										const isStarred = starred.includes(item.id);
										return (
											<div key={item.id} className={classes.item}>
												<div className={classes.itemIcon}>
													<item.icon size={18} color={item.iconColor} />
												</div>
												<div className={classes.itemBody}>
													<Text fz="sm" fw={600} truncate>
														{item.name}
													</Text>
													<Text fz="xs" c="dimmed" truncate>
														{item.description}
													</Text>
												</div>
												<ActionIcon
													size="sm"
													aria-label={isStarred ? `Unstar ${item.name}` : `Star ${item.name}`}
													aria-pressed={isStarred}
													onClick={() => toggleStar(item.id)}
													className={classes.star}
													data-starred={isStarred || undefined}
												>
													<LuStar size={14} />
												</ActionIcon>
											</div>
										);
									})}
								</div>
							</Collapse>
						</div>
					);
				})}
			</ScrollArea>
		</div>
	);
};
