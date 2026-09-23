import React from 'react';

import { Card, Group, Skeleton, Text } from '@mantine/core';
import { LuArrowDownRight, LuArrowUpRight, LuMinus } from 'react-icons/lu';

import type { DashboardStat } from '@module/dashboard/types/DashboardStat';

import classes from './DashboardStatCard.module.scss';

interface DashboardStatCardProps {
	stat: DashboardStat;
	comparisonLabel: string;
}

const trendIcons = { up: LuArrowUpRight, down: LuArrowDownRight, flat: LuMinus };

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ stat, comparisonLabel }) => {
	const TrendIcon = trendIcons[stat.trend];
	const color = stat.trend === 'flat' ? 'dimmed' : (stat.trend === 'up') === stat.upIsGood ? 'teal.7' : 'red.7';

	return (
		<Card className={classes.root}>
			<Text fz="xs" c="dimmed" fw={500}>
				{stat.label}
			</Text>
			<Text className={classes.value}>{stat.value}</Text>
			<Group gap={4} wrap="nowrap">
				{stat.delta === null ? (
					<Text fz="xs" c="dimmed">
						No data {comparisonLabel}
					</Text>
				) : (
					<>
						<Group gap={2} wrap="nowrap" c={color} className={classes.delta}>
							<TrendIcon size={14} aria-hidden />
							<Text fz="xs" fw={600} inherit>
								{stat.delta}
							</Text>
						</Group>
						<Text fz="xs" c="dimmed">
							{comparisonLabel}
						</Text>
					</>
				)}
			</Group>
		</Card>
	);
};

export const DashboardStatCardSkeleton: React.FC = () => (
	<Card className={classes.root}>
		<Skeleton height={10} width="40%" />
		<Skeleton height={26} width="60%" my={2} />
		<Skeleton height={10} width="70%" />
	</Card>
);
