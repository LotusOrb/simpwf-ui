import React from 'react';

import { ActionIcon, Badge, Button, Card, Group, Skeleton, Table, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuTrash2 } from 'react-icons/lu';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

import { complexityMeta, countNodes, getComplexity, getNodeTypes, getStartNode, nodeTypeMeta } from '../../data';
import classes from './WorkflowDefinitionTable.module.scss';

dayjs.extend(relativeTime);

interface WorkflowDefinitionTableProps {
	definitions: WorkflowDefinition[];
	skeletonRows?: number;
	onDelete?: (definition: WorkflowDefinition) => void;
}

export const WorkflowDefinitionTable: React.FC<WorkflowDefinitionTableProps> = ({
	definitions,
	skeletonRows,
	onDelete,
}) => {
	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={820} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Trigger</Table.Th>
							<Table.Th ta="right">Nodes</Table.Th>
							<Table.Th>Node types</Table.Th>
							<Table.Th>Complexity</Table.Th>
							<Table.Th>Updated</Table.Th>
							<Table.Th />
						</Table.Tr>
					</Table.Thead>
					<Table.Tbody>
						{skeletonRows
							? Array.from({ length: skeletonRows }, (_, index) => (
									<Table.Tr key={index}>
										{Array.from({ length: 7 }, (_, cell) => (
											<Table.Td key={cell}>
												<Skeleton height={10} width={cell === 0 ? '70%' : '50%'} />
											</Table.Td>
										))}
									</Table.Tr>
								))
							: definitions.map((definition) => {
									const { content } = definition;
									const startNode = getStartNode(content);
									const StartIcon = startNode && nodeTypeMeta[startNode.type].icon;
									const complexity = complexityMeta[getComplexity(content)];

									return (
										<Table.Tr key={definition.id}>
											<Table.Td>
												<Group gap={6} wrap="nowrap">
													<Text fz="sm" fw={600} truncate maw={240} title={definition.name}>
														{definition.name}
													</Text>
													<Badge size="xs" color="gray">
														v{definition.version}
													</Badge>
												</Group>
												<Text fz="xs" c="dimmed" ff="monospace" truncate maw={260}>
													{definition.id}
												</Text>
											</Table.Td>
											<Table.Td>
												{startNode && StartIcon ? (
													<Group gap={6} wrap="nowrap">
														<StartIcon
															size={14}
															color={`var(--mantine-color-${nodeTypeMeta[startNode.type].color}-6)`}
															aria-hidden
														/>
														<Text fz="sm">{nodeTypeMeta[startNode.type].label}</Text>
													</Group>
												) : (
													<Text fz="sm" c="dimmed">
														Unknown
													</Text>
												)}
											</Table.Td>
											<Table.Td ta="right" className={classes.numeric}>
												{countNodes(content)}
											</Table.Td>
											<Table.Td>
												<Group gap={4} wrap="nowrap">
													{getNodeTypes(content).map((type) => {
														const meta = nodeTypeMeta[type];
														return (
															<Tooltip key={type} label={meta.label}>
																<ThemeIcon
																	size={22}
																	variant="default"
																	radius="sm"
																	c={`${meta.color}.6`}
																>
																	<meta.icon size={12} />
																</ThemeIcon>
															</Tooltip>
														);
													})}
												</Group>
											</Table.Td>
											<Table.Td>
												<Badge color={complexity.color}>{complexity.label}</Badge>
											</Table.Td>
											<Table.Td>
												<Text
													fz="sm"
													c="dimmed"
													title={dayjs(definition.updated_at).format('DD MMM YYYY HH:mm')}
												>
													{dayjs(definition.updated_at).fromNow()}
												</Text>
											</Table.Td>
											<Table.Td ta="right">
												<Group gap={4} justify="flex-end" wrap="nowrap">
													<Button size="compact-xs" radius="xl" px="sm" variant="light">
														View detail
													</Button>
													{onDelete && (
														<Tooltip label="Delete">
															<ActionIcon
																size={22}
																radius="xl"
																variant="subtle"
																color="red"
																aria-label={`Delete ${definition.name}`}
																onClick={() => onDelete(definition)}
															>
																<LuTrash2 size={13} />
															</ActionIcon>
														</Tooltip>
													)}
												</Group>
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
