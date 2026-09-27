import React, { useEffect } from 'react';

import { Badge, Button, Drawer, Loader, Stack, Text, ThemeIcon } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { skipToken } from '@reduxjs/toolkit/query';
import { LuCircleAlert, LuHistory } from 'react-icons/lu';

import {
	WorkflowDefinitionCard,
	WorkflowDefinitionCardSkeleton,
} from '@module/workflow-definition/components/WorkflowDefinitionCard';
import { useListWorkflowDefinitionVersionPagesInfiniteQuery } from '@module/workflow-definition/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

const PER_PAGE = 20;

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
	const { currentData, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
		useListWorkflowDefinitionVersionPagesInfiniteQuery(
			definition ? { lineageId: definition.lineage_id, perPage: PER_PAGE } : skipToken,
		);
	const versions = currentData?.pages.flatMap((page) => page.items) ?? [];
	const total = currentData?.pages[0]?.total;
	const latestId = versions[0]?.id;

	const { ref: sentinelRef, entry } = useIntersection({ rootMargin: '200px' });
	const sentinelVisible = !!entry?.isIntersecting;
	// Re-checked after every page so a sentinel still in view keeps loading; a failed page waits for "Try again".
	useEffect(() => {
		if (sentinelVisible && hasNextPage && !isFetching && !isError) fetchNextPage();
	}, [sentinelVisible, hasNextPage, isFetching, isError, fetchNextPage, versions.length]);

	const renderRows = () => {
		if (isError && !currentData) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load version history</Text>
					<Button variant="default" size="xs" mt={4} onClick={() => refetch()}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!currentData) {
			return (
				<Stack gap="xs">
					{Array.from({ length: 4 }, (_, index) => (
						<WorkflowDefinitionCardSkeleton key={index} />
					))}
				</Stack>
			);
		}

		if (versions.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuHistory size={22} />
					</ThemeIcon>
					<Text fw={600}>No versions found</Text>
				</Stack>
			);
		}

		return (
			<Stack gap="xs">
				{versions.map((version) => (
					<WorkflowDefinitionCard
						key={version.id}
						definition={version}
						onDelete={onDelete}
						onOpen={onClose}
						badge={
							<>
								{version.id === latestId && (
									<Badge color="green" variant="white">
										Latest
									</Badge>
								)}
								{version.id === viewingId && (
									<Badge color="blue" variant="white">
										Viewing
									</Badge>
								)}
							</>
						}
					/>
				))}
				<div ref={sentinelRef} />
				{isFetchingNextPage && (
					<Stack align="center" py="sm">
						<Loader size="sm" color="gray" />
					</Stack>
				)}
				{isError && (
					<Stack align="center" gap={4} py="sm">
						<Text fz="sm" c="red">
							Couldn't load more versions
						</Text>
						<Button variant="default" size="xs" onClick={() => fetchNextPage()}>
							Try again
						</Button>
					</Stack>
				)}
				{!hasNextPage && !isError && (
					<Text fz="xs" c="dimmed" ta="center" py="sm">
						All {versions.length} versions loaded
					</Text>
				)}
			</Stack>
		);
	};

	return (
		<Drawer
			opened={!!definition}
			onClose={onClose}
			position="right"
			size="md"
			title={
				<div>
					<Text fw={600}>Version history{total !== undefined && ` (${total})`}</Text>
					<Text fz="xs" c="dimmed" lineClamp={1}>
						{definition?.name} · most recent first
					</Text>
				</div>
			}
		>
			<div aria-busy={isFetching}>{renderRows()}</div>
		</Drawer>
	);
};
