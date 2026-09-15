import React from 'react';

import { Badge, Card, Group, Skeleton, Table, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { formatRunDuration, type WorkflowRun, type WorkflowRunAction } from '../../data';
import { WorkflowRunActions } from '../WorkflowRunActions';
import type { WorkflowRunDefinitionInfo } from '../WorkflowRunCard';
import { WorkflowRunIdText } from '../WorkflowRunIdText';
import { WorkflowRunStatusBadge } from '../WorkflowRunStatusBadge';
import classes from './WorkflowRunTable.module.scss';

dayjs.extend(relativeTime);

const COLUMN_COUNT = 7;

interface WorkflowRunTableProps {
	runs: WorkflowRun[];
	definitions: Map<string, WorkflowRunDefinitionInfo>;
	busyIds?: string[];
	onAction: (run: WorkflowRun, action: WorkflowRunAction) => void;
	skeletonRows?: number;
}

export const WorkflowRunTable: React.FC<WorkflowRunTableProps> = ({
	runs,
	definitions,
	busyIds = [],
	onAction,
	skeletonRows,
}) => {
	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={900} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Run</Table.Th>
							<Table.Th>Workflow</Table.Th>
							<Table.Th>Status</Table.Th>
							<Table.Th>Detail</Table.Th>
							<Table.Th>Started</Table.Th>
							<Table.Th ta="right">Duration</Table.Th>
							<Table.Th w={48} />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{skeletonRows
							? Array.from({ length: skeletonRows }, (_, index) => (
									<Table.Tr key={index}>
										{Array.from({ length: COLUMN_COUNT }, (_, cell) => (
											<Table.Td key={cell}>
												<Skeleton height={10} width={cell === 3 ? '80%' : '50%'} />
											</Table.Td>
										))}
									</Table.Tr>
								))
							: runs.map((run) => {
									const definition = definitions.get(run.workflow_definition_id);
									const startedAt = run.started_at ?? run.created_at;
									const detail = run.error ?? run.waiting_reason;

									return (
										<Table.Tr key={run.id}>
											<Table.Td>
												<WorkflowRunIdText id={run.id} />
											</Table.Td>
											<Table.Td>
												<Group gap={6} wrap="nowrap">
													<Text fz="sm" fw={600} truncate maw={200} title={definition?.name}>
														{definition?.name ?? 'Unknown definition'}
													</Text>
													{definition && (
														<Badge size="xs" color="gray">
															v{definition.version}
														</Badge>
													)}
												</Group>
											</Table.Td>
											<Table.Td>
												<WorkflowRunStatusBadge run={run} />
											</Table.Td>
											<Table.Td>
												{detail ? (
													<Text
														fz="xs"
														c={run.error ? 'red.7' : 'yellow.8'}
														truncate
														maw={280}
														title={detail}
													>
														{detail}
													</Text>
												) : (
													<Text fz="xs" c="dimmed">
														—
													</Text>
												)}
											</Table.Td>
											<Table.Td>
												<Tooltip label={dayjs(startedAt).format('DD MMM YYYY HH:mm:ss')}>
													<Text fz="sm" c="dimmed" className={classes.nowrap}>
														{dayjs(startedAt).fromNow()}
													</Text>
												</Tooltip>
											</Table.Td>
											<Table.Td ta="right" className={classes.numeric}>
												{formatRunDuration(run)}
											</Table.Td>
											<Table.Td>
												<WorkflowRunActions
													run={run}
													busy={busyIds.includes(run.id)}
													onAction={onAction}
												/>
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
