import React from 'react';

import {
	ActionIcon,
	Badge,
	Button,
	Drawer,
	Group,
	Paper,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuCircleAlert, LuExternalLink, LuHistory, LuTrash2 } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { useListWorkflowDefinitionVersionsQuery } from '@module/workflow-definition/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

dayjs.extend(relativeTime);

const DEFINITION_ROUTE = '/app/workflow-definition';

interface WorkflowDefinitionVersionHistoryProps {
	/** The version the history was opened from; its lineage is listed. `null` closes the drawer. */
	definition: WorkflowDefinition | null;
	/** Id of the version currently open in the editor, badged as "viewing". */
	viewingId?: string | null;
	onClose: () => void;
	onDelete?: (definition: WorkflowDefinition) => void;
}

export const WorkflowDefinitionVersionHistory: React.FC<WorkflowDefinitionVersionHistoryProps> = ({
	definition,
	viewingId,
	onClose,
	onDelete,
}) => {
	const navigate = useNavigate();
	const { currentData, isError, isFetching, refetch } = useListWorkflowDefinitionVersionsQuery(
		definition?.lineage_id ?? skipToken,
	);
	const latestId = currentData?.items[0]?.id;

	const open = (version: WorkflowDefinition) => {
		onClose();
		if (version.id !== viewingId) navigate(`${DEFINITION_ROUTE}/${version.id}`);
	};

	const renderRows = () => {
		if (isError && !isFetching) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load version history</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!currentData) {
			return Array.from({ length: 4 }, (_, index) => <Skeleton key={index} height={64} radius="md" />);
		}

		if (currentData.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuHistory size={22} />
					</ThemeIcon>
					<Text fw={600}>No versions found</Text>
				</Stack>
			);
		}

		return currentData.items.map((version) => (
			<Paper key={version.id} withBorder radius="md" p="sm">
				<Group justify="space-between" wrap="nowrap" gap="sm">
					<div style={{ minWidth: 0 }}>
						<Group gap={6} wrap="nowrap">
							<Text fw={600} fz="sm">
								v{version.version}
							</Text>
							{version.id === latestId && (
								<Badge size="xs" color="green">
									Latest
								</Badge>
							)}
							{version.id === viewingId && (
								<Badge size="xs" color="blue">
									Viewing
								</Badge>
							)}
						</Group>
						<Text fz="xs" c="dimmed" truncate title={dayjs(version.created_at).format('DD MMM YYYY HH:mm')}>
							{dayjs(version.created_at).fromNow()} · {version.created_by}
						</Text>
					</div>
					<Group gap={4} wrap="nowrap">
						<Tooltip label={version.id === viewingId ? 'Already open' : 'Open this version'}>
							<ActionIcon
								variant="default"
								aria-label={`Open v${version.version}`}
								disabled={version.id === viewingId}
								onClick={() => open(version)}
							>
								<LuExternalLink size={14} />
							</ActionIcon>
						</Tooltip>
						{onDelete && (
							<Tooltip label="Delete this version">
								<ActionIcon
									variant="default"
									c="red.6"
									aria-label={`Delete v${version.version}`}
									onClick={() => onDelete(version)}
								>
									<LuTrash2 size={14} />
								</ActionIcon>
							</Tooltip>
						)}
					</Group>
				</Group>
			</Paper>
		));
	};

	return (
		<Drawer
			opened={!!definition}
			onClose={onClose}
			position="right"
			title={
				<div>
					<Text fw={600}>Version history</Text>
					<Text fz="xs" c="dimmed" lineClamp={1}>
						{definition?.name}
					</Text>
				</div>
			}
		>
			<Stack gap="xs" aria-busy={isFetching}>
				{renderRows()}
			</Stack>
		</Drawer>
	);
};
