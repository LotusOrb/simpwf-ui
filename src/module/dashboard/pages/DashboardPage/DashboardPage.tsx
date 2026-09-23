import React, { useState } from 'react';

import { Alert, Button, Group, ScrollArea, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import dayjs from 'dayjs';
import { LuPlus, LuTriangleAlert } from 'react-icons/lu';
import { Link } from 'react-router';

import { DashboardDateRangePicker } from '@module/dashboard/components/DashboardDateRangePicker';
import { DashboardExecutionList } from '@module/dashboard/components/DashboardExecutionList';
import { DashboardRunsChart } from '@module/dashboard/components/DashboardRunsChart';
import { DashboardStatCard, DashboardStatCardSkeleton } from '@module/dashboard/components/DashboardStatCard';
import { DASHBOARD_RANGE_LABEL_FORMAT } from '@module/dashboard/constant/dashboard.constant';
import { getRecentDaysRange, useDashboardOverview } from '@module/dashboard/hooks';
import type { DashboardDateRange } from '@module/dashboard/types/DashboardDateRange';

import classes from './DashboardPage.module.scss';

const formatRangeLabel = ([start, end]: DashboardDateRange) =>
	start === end
		? dayjs(start).format(DASHBOARD_RANGE_LABEL_FORMAT)
		: `${dayjs(start).format(DASHBOARD_RANGE_LABEL_FORMAT)} – ${dayjs(end).format(DASHBOARD_RANGE_LABEL_FORMAT)}`;

export const DashboardPage: React.FC = () => {
	const [range, setRange] = useState<DashboardDateRange>(() => getRecentDaysRange());
	const overview = useDashboardOverview(range);

	return (
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
						<DashboardDateRangePicker value={range} onChange={setRange} />
						<Button component={Link} to="/app/workflow-definition/new" leftSection={<LuPlus size={16} />}>
							New definition
						</Button>
					</Group>
				</Group>

				{overview.isError && (
					<Alert color="red" icon={<LuTriangleAlert size={16} />} title="Failed to load statistics">
						<Group justify="space-between" gap="sm">
							<Text fz="sm">The run statistics for this period could not be loaded.</Text>
							<Button size="compact-sm" variant="light" color="red" onClick={overview.refetch}>
								Retry
							</Button>
						</Group>
					</Alert>
				)}

				<SimpleGrid cols={{ base: 1, xs: 2, lg: 4 }} spacing="sm">
					{overview.stats.map((stat) =>
						overview.isLoading ? (
							<DashboardStatCardSkeleton key={stat.id} />
						) : (
							<DashboardStatCard key={stat.id} stat={stat} comparisonLabel={overview.comparisonLabel} />
						),
					)}
				</SimpleGrid>

				<DashboardRunsChart
					series={overview.series}
					rangeLabel={formatRangeLabel(range)}
					loading={overview.isLoading}
				/>
				<DashboardExecutionList />
			</Stack>
		</ScrollArea>
	);
};
