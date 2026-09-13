import React from 'react';

import { Badge, Button, Card, Group, SimpleGrid, Text } from '@mantine/core';
import type { IconType } from 'react-icons';
import { LuCircleCheck, LuCircleX, LuClock, LuRefreshCw, LuTimer } from 'react-icons/lu';

import { recentExecutions, type ExecutionStatus } from '../../data';
import classes from './DashboardExecutionList.module.scss';

const statusMeta: Record<ExecutionStatus, { label: string; color: string; icon: IconType }> = {
	success: { label: 'Success', color: 'teal', icon: LuCircleCheck },
	running: { label: 'Running', color: 'blue', icon: LuRefreshCw },
	failed: { label: 'Failed', color: 'red', icon: LuCircleX },
};

export const DashboardExecutionList: React.FC = () => {
	return (
		<div>
			<Group justify="space-between" mb="sm">
				<Text fw={600}>Recent executions</Text>
				<Button variant="subtle" size="compact-sm">
					View all
				</Button>
			</Group>

			<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
				{recentExecutions.map((execution) => {
					const status = statusMeta[execution.status];
					return (
						<Card key={execution.id} className={classes.card} data-status={execution.status}>
							<Group gap="sm" wrap="nowrap" align="flex-start">
								<div className={classes.icon}>
									<execution.icon size={18} color={execution.iconColor} />
								</div>
								<div className={classes.body}>
									<Text fz="sm" fw={600} truncate>
										{execution.workflow}
									</Text>
									<Text fz="xs" c="dimmed">
										{execution.trigger}
									</Text>
								</div>
								<Badge color={status.color} leftSection={<status.icon size={12} />}>
									{status.label}
								</Badge>
							</Group>
							<Group gap="md" mt="sm" c="dimmed">
								<Group gap={4}>
									<LuClock size={12} aria-hidden />
									<Text fz="xs">{execution.startedAt}</Text>
								</Group>
								<Group gap={4}>
									<LuTimer size={12} aria-hidden />
									<Text fz="xs">{execution.duration}</Text>
								</Group>
							</Group>
						</Card>
					);
				})}
			</SimpleGrid>
		</div>
	);
};
