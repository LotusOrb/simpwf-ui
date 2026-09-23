import React from 'react';

import { Badge, Button, Card, Group, SimpleGrid, Skeleton, Text } from '@mantine/core';
import dayjs from 'dayjs';
import { LuClock, LuTimer } from 'react-icons/lu';
import { Link } from 'react-router';

import { DASHBOARD_RECENT_RUNS_LIMIT, DASHBOARD_RUN_TIME_FORMAT } from '@module/dashboard/constant/dashboard.constant';
import { useListWorkflowDefinitionsQuery } from '@module/workflow-definition/hooks';
import { formatRunDuration, runStatusMeta, shortRunId } from '@module/workflow-run/data';
import { useListWorkflowRunsQuery } from '@module/workflow-run/hooks';

import classes from './DashboardExecutionList.module.scss';

const RUN_PATH = '/app/workflow-run';

export const DashboardExecutionList: React.FC = () => {
	const { data: runs, isLoading } = useListWorkflowRunsQuery({
		page: 1,
		perPage: DASHBOARD_RECENT_RUNS_LIMIT,
		order: { by: 'created_at', direction: 'desc' },
	});
	const { data: definitions } = useListWorkflowDefinitionsQuery({
		perPage: 200,
		filter: { latest_only: { op: '_eq', value: 'false' } },
	});

	const definitionNames = new Map(
		(definitions?.items ?? []).map((definition) => [definition.id, `${definition.name} · v${definition.version}`]),
	);
	const items = runs?.items ?? [];

	return (
		<div>
			<Group justify="space-between" mb="sm">
				<Text fw={600}>Recent executions</Text>
				<Button component={Link} to={RUN_PATH} variant="subtle" size="compact-sm">
					View all
				</Button>
			</Group>

			{!isLoading && items.length === 0 ? (
				<Card>
					<Text fz="sm" c="dimmed" ta="center">
						No executions yet
					</Text>
				</Card>
			) : (
				<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
					{isLoading &&
						Array.from({ length: DASHBOARD_RECENT_RUNS_LIMIT }, (_, index) => (
							<Card key={index}>
								<Skeleton height={14} width="60%" mb={8} />
								<Skeleton height={10} width="40%" />
							</Card>
						))}

					{items.map((run) => {
						const status = runStatusMeta[run.status];
						const name = definitionNames.get(run.workflow_definition_id) ?? 'Unknown definition';
						return (
							<Card
								key={run.id}
								component={Link}
								to={`${RUN_PATH}/${run.id}`}
								className={classes.card}
								data-status={run.status}
								aria-label={`Open run ${name}`}
							>
								<Group gap="sm" wrap="nowrap" align="flex-start">
									<div className={classes.icon}>
										<status.icon size={18} color={`var(--mantine-color-${status.color}-6)`} />
									</div>
									<div className={classes.body}>
										<Text fz="sm" fw={600} truncate title={name}>
											{name}
										</Text>
										<Text fz="xs" c="dimmed" ff="monospace">
											{shortRunId(run.id)}
										</Text>
									</div>
									<Badge color={status.color} leftSection={<status.icon size={12} />}>
										{status.label}
									</Badge>
								</Group>
								<Group gap="md" mt="sm" c="dimmed">
									<Group gap={4}>
										<LuClock size={12} aria-hidden />
										<Text fz="xs">{dayjs(run.created_at).format(DASHBOARD_RUN_TIME_FORMAT)}</Text>
									</Group>
									<Group gap={4}>
										<LuTimer size={12} aria-hidden />
										<Text fz="xs">{formatRunDuration(run)}</Text>
									</Group>
								</Group>
							</Card>
						);
					})}
				</SimpleGrid>
			)}
		</div>
	);
};
