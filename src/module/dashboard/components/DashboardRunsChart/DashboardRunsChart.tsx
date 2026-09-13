import React, { useState } from 'react';

import { AreaChart } from '@mantine/charts';
import { Card, Group, ScrollArea, SegmentedControl, Table, Text } from '@mantine/core';

import { runsSeries } from '../../data';

type RunsView = 'chart' | 'table';

export const DashboardRunsChart: React.FC = () => {
	const [view, setView] = useState<RunsView>('chart');

	return (
		<Card padding="lg">
			<Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
				<div>
					<Text fw={600}>Workflow runs per day</Text>
					<Text fz="xs" c="dimmed">
						Last 14 days, all workflows
					</Text>
				</div>
				<SegmentedControl
					size="xs"
					fullWidth={false}
					value={view}
					onChange={(value) => setView(value as RunsView)}
					data={[
						{ label: 'Chart', value: 'chart' },
						{ label: 'Table', value: 'table' },
					]}
				/>
			</Group>

			{view === 'chart' ? (
				<AreaChart
					h={240}
					data={runsSeries}
					dataKey="date"
					series={[{ name: 'runs', label: 'Runs', color: 'brand.4' }]}
					curveType="monotone"
					strokeWidth={2}
					gridAxis="x"
					tickLine="none"
					fillOpacity={0.18}
					withDots={false}
					activeDotProps={{ r: 5, strokeWidth: 2, stroke: 'var(--mantine-color-white)' }}
					valueFormatter={(value) => value.toLocaleString()}
				/>
			) : (
				<ScrollArea h={240}>
					<Table striped highlightOnHover fz="sm">
						<Table.Thead>
							<Table.Tr>
								<Table.Th>Date</Table.Th>
								<Table.Th ta="right">Runs</Table.Th>
							</Table.Tr>
						</Table.Thead>
						<Table.Tbody>
							{runsSeries.map((point) => (
								<Table.Tr key={point.date}>
									<Table.Td>{point.date}</Table.Td>
									<Table.Td ta="right">{point.runs.toLocaleString()}</Table.Td>
								</Table.Tr>
							))}
						</Table.Tbody>
					</Table>
				</ScrollArea>
			)}
		</Card>
	);
};
