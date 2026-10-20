import React from 'react';

import { ActionIcon, Anchor, Card, Group, Skeleton, Table, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuCopy, LuNetwork, LuPencil, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router';

import { Can, Permission } from '@core/auth/authorization';

import type { Form } from '@module/form-engine/types/Form';
import { formFieldCount, formLibraryPath } from '@module/form-engine/utils';

import classes from './FormTable.module.scss';

dayjs.extend(relativeTime);

const COLUMN_COUNT = 4;

interface FormTableProps {
	forms: Form[];
	onDuplicate: (form: Form) => void;
	onUsage: (form: Form) => void;
	onDelete: (form: Form) => void;
	skeletonRows?: number;
}

export const FormTable: React.FC<FormTableProps> = ({ forms, onDuplicate, onUsage, onDelete, skeletonRows }) => {
	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={640} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Name</Table.Th>
							<Table.Th w={96}>Fields</Table.Th>
							<Table.Th w={140}>Updated</Table.Th>
							<Table.Th w={152} />
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
							: forms.map((form) => (
									<Table.Tr key={form.id}>
										<Table.Td>
											<Anchor
												component={Link}
												to={formLibraryPath(form.id)}
												fz="sm"
												fw={600}
												truncate
												maw={420}
												display="block"
												title={form.name}
											>
												{form.name}
											</Anchor>
											<Text fz={11} c="dimmed" ff="monospace">
												{form.id}
											</Text>
										</Table.Td>
										<Table.Td>
											<Text fz="sm">{formFieldCount(form)}</Text>
										</Table.Td>
										<Table.Td>
											<Tooltip label={dayjs(form.updated_at).format('DD MMM YYYY HH:mm:ss')}>
												<Text fz="sm" c="dimmed" className={classes.nowrap}>
													{dayjs(form.updated_at).fromNow()}
												</Text>
											</Tooltip>
										</Table.Td>
										<Table.Td>
											<Group gap={4} justify="flex-end" wrap="nowrap">
												<Tooltip label="Where it's used">
													<ActionIcon
														variant="subtle"
														color="gray"
														onClick={() => onUsage(form)}
														aria-label={`Usage of ${form.name}`}
													>
														<LuNetwork size={16} />
													</ActionIcon>
												</Tooltip>
												<Can rule={Permission.FormsWrite}>
													<Tooltip label="Edit">
														<ActionIcon
															variant="subtle"
															color="gray"
															component={Link}
															to={formLibraryPath(form.id)}
															aria-label={`Edit ${form.name}`}
														>
															<LuPencil size={16} />
														</ActionIcon>
													</Tooltip>
													<Tooltip label="Duplicate">
														<ActionIcon
															variant="subtle"
															color="gray"
															onClick={() => onDuplicate(form)}
															aria-label={`Duplicate ${form.name}`}
														>
															<LuCopy size={16} />
														</ActionIcon>
													</Tooltip>
													<Tooltip label="Delete">
														<ActionIcon
															variant="subtle"
															color="red"
															onClick={() => onDelete(form)}
															aria-label={`Delete ${form.name}`}
														>
															<LuTrash2 size={16} />
														</ActionIcon>
													</Tooltip>
												</Can>
											</Group>
										</Table.Td>
									</Table.Tr>
								))}
					</Table.Tbody>
				</Table>
			</Table.ScrollContainer>
		</Card>
	);
};
