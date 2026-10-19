import React from 'react';

import { ActionIcon, Badge, Card, Menu, Skeleton, Table, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuEllipsisVertical, LuGitBranchPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { Permission, useCan } from '@core/auth/authorization';

import { NodeDefinitionTypeBadge } from '@module/node-definition/components/NodeDefinitionTypeBadge';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import { nodeDefinitionLink } from '@module/node-definition/utils';

import classes from './NodeDefinitionTable.module.scss';

dayjs.extend(relativeTime);

const COLUMN_COUNT = 5;

// Interactive cells keep their clicks (including portalled menu dropdowns) from opening the row.
const stopRowClick = (event: React.SyntheticEvent) => event.stopPropagation();

interface NodeDefinitionTableProps {
	definitions: NodeDefinition[];
	/** Offered only where every row is known to be its lineage's latest; the engine extends nothing else. */
	onNewVersion?: (definition: NodeDefinition) => void;
	onDelete: (definition: NodeDefinition) => void;
	skeletonRows?: number;
}

export const NodeDefinitionTable: React.FC<NodeDefinitionTableProps> = ({
	definitions,
	onNewVersion,
	onDelete,
	skeletonRows,
}) => {
	const canWrite = useCan(Permission.DefinitionsWrite);
	const navigate = useNavigate();

	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={680} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th>Type</Table.Th>
							<Table.Th>Version</Table.Th>
							<Table.Th>Updated</Table.Th>
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
							: definitions.map((definition) => (
									<Table.Tr
										key={definition.id}
										className={classes.row}
										role="link"
										tabIndex={0}
										aria-label={`Open ${definition.name}`}
										onClick={() => navigate(nodeDefinitionLink(definition.id))}
										onKeyDown={(event) => {
											if (event.target !== event.currentTarget || event.key !== 'Enter') return;
											navigate(nodeDefinitionLink(definition.id));
										}}
									>
										<Table.Td>
											<Text fz="sm" fw={600} truncate maw={320} title={definition.name}>
												{definition.name}
											</Text>
										</Table.Td>
										<Table.Td>
											<NodeDefinitionTypeBadge type={definition.type} />
										</Table.Td>
										<Table.Td>
											<Badge size="sm" color="gray" variant="light">
												v{definition.version}
											</Badge>
										</Table.Td>
										<Table.Td>
											<Tooltip
												label={dayjs(definition.updated_at).format('DD MMM YYYY HH:mm:ss')}
											>
												<Text fz="sm" c="dimmed" className={classes.nowrap}>
													{dayjs(definition.updated_at).fromNow()}
												</Text>
											</Tooltip>
										</Table.Td>
										<Table.Td onClick={stopRowClick}>
											{canWrite && (
												<Menu position="bottom-end" shadow="md" withinPortal>
													<Menu.Target>
														<ActionIcon
															variant="subtle"
															color="gray"
															aria-label={`Actions for ${definition.name}`}
														>
															<LuEllipsisVertical size={16} />
														</ActionIcon>
													</Menu.Target>
													<Menu.Dropdown>
														{onNewVersion && (
															<Menu.Item
																leftSection={<LuGitBranchPlus size={14} />}
																onClick={() => onNewVersion(definition)}
															>
																New version
															</Menu.Item>
														)}
														<Menu.Item
															color="red"
															leftSection={<LuTrash2 size={14} />}
															onClick={() => onDelete(definition)}
														>
															Delete version
														</Menu.Item>
													</Menu.Dropdown>
												</Menu>
											)}
										</Table.Td>
									</Table.Tr>
								))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Card>
	);
};
