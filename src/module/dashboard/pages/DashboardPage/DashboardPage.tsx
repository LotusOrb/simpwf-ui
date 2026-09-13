import React from 'react';

import { Box, Button, Group, ScrollArea, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { LuDownload, LuPlus } from 'react-icons/lu';

import { DashboardExecutionList } from '@module/dashboard/components/DashboardExecutionList';
import { DashboardExplorer } from '@module/dashboard/components/DashboardExplorer';
import { DashboardRunsChart } from '@module/dashboard/components/DashboardRunsChart';
import { DashboardSettingsPanel } from '@module/dashboard/components/DashboardSettingsPanel';
import { DashboardStatCard } from '@module/dashboard/components/DashboardStatCard';
import { dashboardStats } from '@module/dashboard/data';

import classes from './DashboardPage.module.scss';

interface DashboardPageProps {
	withExplorer?: boolean;
	withSettingsPanel?: boolean;
}

export const DashboardPage: React.FC<DashboardPageProps> = ({ withExplorer = false, withSettingsPanel = false }) => {
	return (
		<div className={classes.root}>
			{withExplorer && (
				<Box w={280} visibleFrom="lg" className={classes.side}>
					<DashboardExplorer />
				</Box>
			)}

			<ScrollArea flex={1} className={classes.canvas}>
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

			{withSettingsPanel && (
				<Box w={320} visibleFrom="md" className={classes.side}>
					<DashboardSettingsPanel />
				</Box>
			)}
		</div>
	);
};
