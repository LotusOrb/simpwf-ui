import React from 'react';

import { ActionIcon, Badge, Card, Group, Menu, Skeleton, Table, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuCopy, LuEllipsisVertical, LuHistory, LuTrash2 } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';

import { Can, Permission } from '@core/auth/authorization';

import { nodeTypeMetaOf } from '@module/node-type/utils';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import { countNodes, getNodeTypes, getStartNode } from '@module/workflow-definition/utils';

import classes from './WorkflowDefinitionTable.module.scss';

dayjs.extend(relativeTime);

interface WorkflowDefinitionTableProps {
	definitions: WorkflowDefinition[];
	skeletonRows?: number;
	onDelete?: (definition: WorkflowDefinition) => void;
	onShowVersions?: (definition: WorkflowDefinition) => void;
}

// Interactive cells keep their clicks (including portalled menu dropdowns) from opening the row.
const stopRowClick = (event: React.SyntheticEvent) => event.stopPropagation();

export const WorkflowDefinitionTable: React.FC<WorkflowDefinitionTableProps> = ({
	definitions,
	skeletonRows,
	onDelete,
	onShowVersions,
}) => {
	const navigate = useNavigate();

	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={820} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Version</Table.Th>
							<Table.Th>Trigger</Table.Th>
							<Table.Th ta="right">Nodes</Table.Th>
							<Table.Th>Node types</Table.Th>
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
									const StartIcon = startNode && nodeTypeMetaOf(startNode.type).icon;

									return (
										<Table.Tr
											key={definition.id}
											className={classes.row}
											role="link"
											tabIndex={0}
											aria-label={`Open ${definition.name}`}
											onClick={() => navigate(definition.id)}
											onKeyDown={(event) => {
												if (event.target !== event.currentTarget || event.key !== 'Enter')
													return;
												navigate(definition.id);
											}}
										>
											<Table.Td>
												<Text fz="sm" fw={600} truncate maw={260} title={definition.name}>
													{definition.name}
												</Text>
												<Text fz="xs" c="dimmed" ff="monospace" truncate maw={260}>
													{definition.id}
												</Text>
											</Table.Td>
											<Table.Td>
												<Badge color="gray">v{definition.version}</Badge>
											</Table.Td>
											<Table.Td>
												{startNode && StartIcon ? (
													<Group gap={6} wrap="nowrap">
														<StartIcon
															size={14}
															color={`var(--mantine-color-${nodeTypeMetaOf(startNode.type).color}-6)`}
															aria-hidden
														/>
														<Text fz="sm">{nodeTypeMetaOf(startNode.type).label}</Text>
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
														const meta = nodeTypeMetaOf(type);
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
												<Text
													fz="sm"
													c="dimmed"
													title={dayjs(definition.updated_at).format('DD MMM YYYY HH:mm')}
												>
													{dayjs(definition.updated_at).fromNow()}
												</Text>
											</Table.Td>
											<Table.Td ta="right" onClick={stopRowClick}>
												<Menu position="bottom-end" shadow="md" withinPortal>
													<Menu.Target>
														<ActionIcon
															size={26}
															variant="subtle"
															color="gray"
															aria-label={`Actions for ${definition.name}`}
														>
															<LuEllipsisVertical size={14} />
														</ActionIcon>
													</Menu.Target>
													<Menu.Dropdown>
														{onShowVersions && (
															<Menu.Item
																leftSection={<LuHistory size={14} />}
																onClick={() => onShowVersions(definition)}
															>
																Versions
															</Menu.Item>
														)}
														<Can rule={Permission.DefinitionsWrite}>
															<Menu.Item
																component={Link}
																to={`new?from=${definition.id}`}
																leftSection={<LuCopy size={14} />}
															>
																Duplicate
															</Menu.Item>
														</Can>
														{onDelete && (
															<>
																<Menu.Divider />
																<Menu.Item
																	color="red"
																	leftSection={<LuTrash2 size={14} />}
																	onClick={() => onDelete(definition)}
																>
																	Delete version
																</Menu.Item>
															</>
														)}
													</Menu.Dropdown>
												</Menu>
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
