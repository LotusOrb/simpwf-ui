import React from 'react';

import { Card, Group, Text } from '@mantine/core';
import { LuArrowDownRight, LuArrowUpRight } from 'react-icons/lu';

import type { DashboardStat } from '../../data';
import classes from './DashboardStatCard.module.scss';

interface DashboardStatCardProps {
	stat: DashboardStat;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({ stat }) => {
	const isGood = (stat.trend === 'up') === stat.upIsGood;
	const TrendIcon = stat.trend === 'up' ? LuArrowUpRight : LuArrowDownRight;

	return (
		<Card className={classes.root}>
			<Text fz="xs" c="dimmed" fw={500}>
				{stat.label}
			</Text>
			<Text className={classes.value}>{stat.value}</Text>
			<Group gap={4} wrap="nowrap">
				<Group gap={2} wrap="nowrap" c={isGood ? 'teal.7' : 'red.7'} className={classes.delta}>
					<TrendIcon size={14} aria-hidden />
					<Text fz="xs" fw={600} inherit>
						{stat.delta}
					</Text>
				</Group>
				<Text fz="xs" c="dimmed">
					vs last 14 days
				</Text>
			</Group>
		</Card>
	);
};
