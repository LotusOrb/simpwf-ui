import React from 'react';

import { ActionIcon, Card, CopyButton, Group, Skeleton, Table, Text, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuBraces, LuCheck, LuRefreshCcw, LuTrash2 } from 'react-icons/lu';

import { secretReference } from '@module/secret/data';
import type { Secret } from '@module/secret/types/Secret';

import classes from './SecretTable.module.scss';

dayjs.extend(relativeTime);

const COLUMN_COUNT = 5;

interface SecretTableProps {
	secrets: Secret[];
	onRotate: (secret: Secret) => void;
	onDelete: (secret: Secret) => void;
	skeletonRows?: number;
}

const TimeCell: React.FC<{ value: string }> = ({ value }) => (
	<Tooltip label={dayjs(value).format('DD MMM YYYY HH:mm:ss')}>
		<Text fz="sm" c="dimmed" className={classes.nowrap}>
			{dayjs(value).fromNow()}
		</Text>
	</Tooltip>
);

export const SecretTable: React.FC<SecretTableProps> = ({ secrets, onRotate, onDelete, skeletonRows }) => {
	return (
		<Card padding={0} className={classes.root}>
			<Table.ScrollContainer minWidth={680} type="native">
				<Table highlightOnHover verticalSpacing="sm" horizontalSpacing="md" fz="sm">
					<Table.Thead className={classes.head}>
						<Table.Tr>
							<Table.Th>Key</Table.Th>
							<Table.Th>Value</Table.Th>
							<Table.Th>Created</Table.Th>
							<Table.Th>Updated</Table.Th>
							<Table.Th w={112} />
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
							: secrets.map((secret) => (
									<Table.Tr key={secret.key}>
										<Table.Td>
											<Text fz="sm" fw={600} ff="monospace" truncate maw={320} title={secret.key}>
												{secret.key}
											</Text>
										</Table.Td>
										<Table.Td>
											<Text fz="sm" c="dimmed" ff="monospace">
												{secret.value_masked}
											</Text>
										</Table.Td>
										<Table.Td>
											<TimeCell value={secret.created_at} />
										</Table.Td>
										<Table.Td>
											<TimeCell value={secret.updated_at} />
										</Table.Td>
										<Table.Td>
											<Group gap={4} justify="flex-end" wrap="nowrap">
												<CopyButton value={secretReference(secret.key)} timeout={1500}>
													{({ copied, copy }) => (
														<Tooltip
															label={
																copied
																	? 'Copied'
																	: `Copy ${secretReference(secret.key)}`
															}
														>
															<ActionIcon
																variant="subtle"
																color={copied ? 'teal' : 'gray'}
																onClick={copy}
																aria-label={`Copy reference for ${secret.key}`}
															>
																{copied ? (
																	<LuCheck size={16} />
																) : (
																	<LuBraces size={16} />
																)}
															</ActionIcon>
														</Tooltip>
													)}
												</CopyButton>
												<Tooltip label="Rotate value">
													<ActionIcon
														variant="subtle"
														color="gray"
														onClick={() => onRotate(secret)}
														aria-label={`Rotate ${secret.key}`}
													>
														<LuRefreshCcw size={16} />
													</ActionIcon>
												</Tooltip>
												<Tooltip label="Delete">
													<ActionIcon
														variant="subtle"
														color="red"
														onClick={() => onDelete(secret)}
														aria-label={`Delete ${secret.key}`}
													>
														<LuTrash2 size={16} />
													</ActionIcon>
												</Tooltip>
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
