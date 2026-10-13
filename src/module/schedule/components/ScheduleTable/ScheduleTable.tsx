import React from 'react';

import { ActionIcon, Badge, Card, Group, Menu, Skeleton, Switch, Table, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuActivity, LuEllipsisVertical, LuPencil, LuTrash2, LuTriangleAlert } from 'react-icons/lu';
import { Link } from 'react-router';

import { Can, Permission, useCan } from '@core/auth/authorization';

import { analyzeCrontab, formatInZone } from '@module/schedule/data';
import { useScheduleDefinition } from '@module/schedule/hooks';
import type { Schedule } from '@module/schedule/types/Schedule';
import { DEFINITION_ROUTE } from '@module/workflow-definition/data';

import classes from './ScheduleTable.module.scss';

dayjs.extend(relativeTime);

const COLUMN_COUNT = 6;

const RUN_ROUTE = '/app/workflow-run';

interface ScheduleTableProps {
	schedules: Schedule[];
	onToggle: (schedule: Schedule, enabled: boolean) => void;
	onEdit: (schedule: Schedule) => void;
	onDelete: (schedule: Schedule) => void;
	skeletonRows?: number;
}

const WorkflowCell: React.FC<{ definitionId: string }> = ({ definitionId }) => {
	const { definition, deleted, loading, canRead } = useScheduleDefinition(definitionId);

	if (loading) return <Skeleton height={10} width="60%" />;
	if (definition) {
		return (
			<Group gap={6} wrap="nowrap">
				<Text
					component={Link}
					to={`${DEFINITION_ROUTE}/${definition.id}`}
					fz="sm"
					fw={600}
					truncate
					maw={260}
					title={definition.name}
					className={classes.link}
				>
					{definition.name}
				</Text>
				<Badge size="sm" color="gray" variant="light">
					v{definition.version}
				</Badge>
			</Group>
		);
	}

	return (
		<Group gap={6} wrap="nowrap">
			<Text fz="xs" ff="monospace" c="dimmed" truncate maw={260} title={definitionId}>
				{definitionId}
			</Text>
			{deleted && (
				<Tooltip label="The engine no longer has this definition; the schedule can't start runs">
					<Badge size="sm" color="yellow" variant="light" leftSection={<LuTriangleAlert size={10} />}>
						Deleted
					</Badge>
				</Tooltip>
			)}
			{!canRead && !deleted && (
				<Text fz="xs" c="dimmed">
					(name hidden)
				</Text>
			)}
		</Group>
	);
};

const NextRunCell: React.FC<{ schedule: Schedule }> = ({ schedule }) => {
	if (!schedule.enabled) {
		return (
			<Text fz="sm" c="dimmed">
				Paused
			</Text>
		);
	}
	const analysis = analyzeCrontab(schedule.crontab, schedule.timezone);
	if (!analysis.ok) {
		return (
			<Text fz="sm" c="dimmed">
				—
			</Text>
		);
	}
	const [next] = analysis.next(1);
	return (
		<Tooltip label={`${formatInZone(next, analysis.zone)} (${analysis.zone})`}>
			<Text fz="sm" className={classes.nowrap}>
				{dayjs(next).fromNow()}
			</Text>
		</Tooltip>
	);
};

export const ScheduleTable: React.FC<ScheduleTableProps> = ({
	schedules,
	onToggle,
	onEdit,
	onDelete,
	skeletonRows,
}) => {
	const canWrite = useCan(Permission.SchedulesWrite);
	const canViewRuns = useCan(Permission.InstancesRead);

	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={820} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Workflow</Table.Th>
							<Table.Th>Schedule</Table.Th>
							<Table.Th>Timezone</Table.Th>
							<Table.Th>Next run</Table.Th>
							<Table.Th>Enabled</Table.Th>
							<Table.Th w={56} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{skeletonRows
							? Array.from({ length: skeletonRows }, (_, index) => (
									<Table.Tr key={index}>
										{Array.from({ length: COLUMN_COUNT }, (_, cell) => (
											<Table.Td key={cell}>
												<Skeleton height={10} width={cell === 0 ? '70%' : '50%'} />
											</Table.Td>
										))}
									</Table.Tr>
								))
							: schedules.map((schedule) => {
									const analysis = analyzeCrontab(schedule.crontab, schedule.timezone);
									return (
										<Table.Tr key={schedule.id}>
											<Table.Td>
												<WorkflowCell definitionId={schedule.workflow_definition_id} />
											</Table.Td>
											<Table.Td>
												<Text fz="sm" ff="monospace" className={classes.nowrap}>
													{schedule.crontab}
												</Text>
												<Text fz="xs" c="dimmed">
													{analysis.ok
														? (analysis.description ?? 'Custom schedule')
														: 'Not understood by this UI'}
												</Text>
											</Table.Td>
											<Table.Td>
												<Text fz="sm" className={classes.nowrap}>
													{schedule.timezone}
												</Text>
											</Table.Td>
											<Table.Td>
												<NextRunCell schedule={schedule} />
											</Table.Td>
											<Table.Td>
												<Tooltip
													label="Your role can't pause or resume schedules"
													disabled={canWrite}
												>
													<Switch
														checked={schedule.enabled}
														disabled={!canWrite}
														onChange={(event) =>
															onToggle(schedule, event.currentTarget.checked)
														}
														aria-label={
															schedule.enabled ? 'Pause schedule' : 'Resume schedule'
														}
													/>
												</Tooltip>
											</Table.Td>
											<Table.Td>
												{(canWrite || canViewRuns) && (
													<Menu position="bottom-end" shadow="md" withinPortal>
														<Menu.Target>
															<ActionIcon
																variant="subtle"
																color="gray"
																aria-label={`Actions for schedule ${schedule.crontab}`}
															>
																<LuEllipsisVertical size={16} />
															</ActionIcon>
														</Menu.Target>
														<Menu.Dropdown>
															{canViewRuns && (
																<Menu.Item
																	component={Link}
																	to={`${RUN_ROUTE}?definition=${schedule.workflow_definition_id}`}
																	leftSection={<LuActivity size={14} />}
																>
																	Runs of this workflow
																</Menu.Item>
															)}
															<Can rule={Permission.SchedulesWrite}>
																<Menu.Item
																	leftSection={<LuPencil size={14} />}
																	onClick={() => onEdit(schedule)}
																>
																	Edit
																</Menu.Item>
																<Menu.Divider />
																<Menu.Item
																	color="red"
																	leftSection={<LuTrash2 size={14} />}
																	onClick={() => onDelete(schedule)}
																>
																	Delete
																</Menu.Item>
															</Can>
														</Menu.Dropdown>
													</Menu>
												)}
											</Table.Td>
										</Table.Tr>
									);
								})}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Card>
	);
};
