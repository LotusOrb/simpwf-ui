import React, { useState } from 'react';

import { BarChart } from '@mantine/charts';
import { Card, Center, ColorSwatch, Group, Skeleton, Text, UnstyledButton } from '@mantine/core';
import { Rectangle, type BarShapeProps } from 'recharts';

import type { DashboardRunsPoint } from '@module/dashboard/types/DashboardRunsPoint';

interface DashboardRunsChartProps {
	series: DashboardRunsPoint[];
	rangeLabel: string;
	loading?: boolean;
}

const CHART_HEIGHT = 360;
const BAR_TOP_RADIUS: [number, number, number, number] = [4, 4, 0, 0];

type RunsSeriesName = 'finished' | 'failed' | 'stopped';

const RUNS_SERIES: { name: RunsSeriesName; label: string; color: string }[] = [
	{ name: 'finished', label: 'Finished', color: 'teal.5' },
	{ name: 'failed', label: 'Failed', color: 'red.5' },
	{ name: 'stopped', label: 'Stopped', color: 'gray.5' },
];

export const DashboardRunsChart: React.FC<DashboardRunsChartProps> = ({ series, rangeLabel, loading }) => {
	const [activeSeries, setActiveSeries] = useState<RunsSeriesName | null>(null);
	const isEmpty = series.every((point) => point.total === 0);
	const visibleSeries = activeSeries ? RUNS_SERIES.filter((item) => item.name === activeSeries) : RUNS_SERIES;

	// Round only the topmost non-empty segment of each stacked bar.
	const renderBarShape = (seriesName: RunsSeriesName) => (props: BarShapeProps) => {
		const point = props.payload as DashboardRunsPoint;
		const seriesAbove = visibleSeries.slice(visibleSeries.findIndex((item) => item.name === seriesName) + 1);
		const isTop = seriesAbove.every((item) => point[item.name] === 0);
		return <Rectangle {...props} radius={isTop ? BAR_TOP_RADIUS : 0} />;
	};

	const toggleSeries = (name: RunsSeriesName) => {
		setActiveSeries((current) => (current === name ? null : name));
	};

	const renderBody = () => {
		if (loading) return <Skeleton h={CHART_HEIGHT} />;

		if (isEmpty) {
			return (
				<Center h={CHART_HEIGHT}>
					<Text fz="sm" c="dimmed">
						No runs in this period
					</Text>
				</Center>
			);
		}

		return (
			<BarChart
				h={CHART_HEIGHT}
				data={series}
				dataKey="label"
				type="stacked"
				series={visibleSeries}
				gridAxis="y"
				tickLine="none"
				withLegend={false}
				barProps={(item) => ({ shape: renderBarShape(item.name as RunsSeriesName) })}
				withBarValueLabel
				valueLabelProps={{
					position: 'center',
					angle: -45,
					fontSize: 11,
					fill: 'var(--mantine-color-white)',
					formatter: (value) => (Number(value) > 0 ? Number(value).toLocaleString() : ''),
				}}
				valueFormatter={(value) => value.toLocaleString()}
			/>
		);
	};

	return (
		<Card padding="lg">
			<Group justify="space-between" align="flex-start" mb="md" wrap="nowrap">
				<div>
					<Text fw={600}>Workflow runs per day</Text>
					<Text fz="xs" c="dimmed">
						{rangeLabel}, all workflows
					</Text>
				</div>
				<Group gap="md" wrap="nowrap">
					{RUNS_SERIES.map((item) => {
						const dimmed = activeSeries !== null && activeSeries !== item.name;
						return (
							<UnstyledButton
								key={item.name}
								onClick={() => toggleSeries(item.name)}
								aria-pressed={activeSeries === item.name}
								style={{ opacity: dimmed ? 0.4 : 1 }}
							>
								<Group gap={6} wrap="nowrap">
									<ColorSwatch
										color={`var(--mantine-color-${item.color.replace('.', '-')})`}
										size={10}
										withShadow={false}
									/>
									<Text fz="xs">{item.label}</Text>
								</Group>
							</UnstyledButton>
						);
					})}
				</Group>
			</Group>

			{renderBody()}
		</Card>
	);
};
