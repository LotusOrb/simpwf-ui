import React from 'react';

import { ActionIcon, Button, Group, ScrollArea, SimpleGrid, Stack, Text, Title, Tooltip } from '@mantine/core';
import { LuDownload, LuPanelLeft, LuPanelRight, LuPlus } from 'react-icons/lu';

import { MainLayoutPanel } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel } from '@module/app/hooks';

import { DashboardExecutionList } from '@module/dashboard/components/DashboardExecutionList';
import { DashboardExplorer } from '@module/dashboard/components/DashboardExplorer';
import { DashboardRunsChart } from '@module/dashboard/components/DashboardRunsChart';
import { DashboardSettingsPanel } from '@module/dashboard/components/DashboardSettingsPanel';
import { DashboardStatCard } from '@module/dashboard/components/DashboardStatCard';
import { dashboardStats } from '@module/dashboard/data';

import classes from './DashboardPage.module.scss';

export const DashboardPage: React.FC = () => {
	const panel = useAppLayoutPanel();

	return (
		<>
			<MainLayoutPanel side="left" w={280} visibleFrom="lg">
				<DashboardExplorer />
			</MainLayoutPanel>

			<MainLayoutPanel side="right" w={320} visibleFrom="md">
				<DashboardSettingsPanel />
			</MainLayoutPanel>

			<ScrollArea h="100%" className={classes.canvas}>
				<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1080} mx="auto">
					<Group justify="space-between" align="flex-end" gap="sm">
						<div>
							<Title order={2} fz={22}>
								Dashboard
							</Title>
							<Text fz="sm" c="dimmed">
								Overview of your workflows and executions
							</Text>
						</div>
						<Group gap="xs">
							<Tooltip label={panel.opened.left ? 'Hide explorer' : 'Show explorer'}>
								<ActionIcon
									variant="default"
									size="lg"
									visibleFrom="lg"
									aria-label="Toggle explorer"
									aria-pressed={panel.opened.left}
									onClick={() => panel.toggle('left')}
								>
									<LuPanelLeft size={16} />
								</ActionIcon>
							</Tooltip>
							<Tooltip label={panel.opened.right ? 'Hide settings' : 'Show settings'}>
								<ActionIcon
									variant="default"
									size="lg"
									visibleFrom="md"
									aria-label="Toggle settings"
									aria-pressed={panel.opened.right}
									onClick={() => panel.toggle('right')}
								>
									<LuPanelRight size={16} />
								</ActionIcon>
							</Tooltip>
							<Button variant="default" leftSection={<LuDownload size={16} />}>
								Export
							</Button>
							<Button leftSection={<LuPlus size={16} />}>New workflow</Button>
						</Group>
					</Group>

					<SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
						{dashboardStats.map((stat) => (
							<DashboardStatCard key={stat.id} stat={stat} />
						))}
					</SimpleGrid>

					<DashboardRunsChart />
					<DashboardExecutionList />
				</Stack>
			</ScrollArea>
		</>
	);
};
