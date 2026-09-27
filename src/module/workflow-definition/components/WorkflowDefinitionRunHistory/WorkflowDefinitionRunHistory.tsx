import React, { useEffect } from 'react';

import { Button, Drawer, Loader, Stack, Text, ThemeIcon } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import { skipToken } from '@reduxjs/toolkit/query';
import { LuActivity, LuCircleAlert } from 'react-icons/lu';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import { WorkflowRunCard, WorkflowRunCardSkeleton } from '@module/workflow-run/components/WorkflowRunCard';
import { runSortOrders } from '@module/workflow-run/data';
import { useListWorkflowRunPagesInfiniteQuery } from '@module/workflow-run/hooks';

const PER_PAGE = 20;

interface WorkflowDefinitionRunHistoryProps {
	/** The version whose runs are listed. `null` closes the drawer. */
	definition: WorkflowDefinition | null;
	onClose: () => void;
}

export const WorkflowDefinitionRunHistory: React.FC<WorkflowDefinitionRunHistoryProps> = ({ definition, onClose }) => {
	const { by, direction } = runSortOrders.newest;
	const { currentData, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
		useListWorkflowRunPagesInfiniteQuery(
			definition
				? {
						perPage: PER_PAGE,
						order: { by, direction },
						filter: { workflow_definition_id: { op: '_eq', value: definition.id } },
					}
				: skipToken,
		);
	const runs = currentData?.pages.flatMap((page) => page.items) ?? [];
	const total = currentData?.pages[0]?.total;

	const { ref: sentinelRef, entry } = useIntersection({ rootMargin: '200px' });
	const sentinelVisible = !!entry?.isIntersecting;
	// Re-checked after every page so a sentinel still in view keeps loading; a failed page waits for "Try again".
	useEffect(() => {
		if (sentinelVisible && hasNextPage && !isFetching && !isError) fetchNextPage();
	}, [sentinelVisible, hasNextPage, isFetching, isError, fetchNextPage, runs.length]);

	const renderRows = () => {
		if (isError && !currentData) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load workflow runs</Text>
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
						<WorkflowRunCardSkeleton key={index} />
					))}
				</Stack>
			);
		}

		if (runs.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuActivity size={22} />
					</ThemeIcon>
					<Text fw={600}>No runs yet</Text>
					<Text fz="sm" c="dimmed">
						Runs started from this version will show up here.
					</Text>
				</Stack>
			);
		}

		return (
			<Stack gap="xs">
				{runs.map((run) => (
					<WorkflowRunCard
						key={run.id}
						run={run}
						definition={definition ? { name: definition.name, version: definition.version } : undefined}
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
							Couldn't load more runs
						</Text>
						<Button variant="default" size="xs" onClick={() => fetchNextPage()}>
							Try again
						</Button>
					</Stack>
				)}
				{!hasNextPage && !isError && (
					<Text fz="xs" c="dimmed" ta="center" py="sm">
						All {runs.length} runs loaded
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
					<Text fw={600}>Workflow Run{total !== undefined && ` (${total})`}</Text>
					<Text fz="xs" c="dimmed" lineClamp={1}>
						{definition?.name} · v{definition?.version} · most recent first
					</Text>
				</div>
			}
		>
			<div aria-busy={isFetching}>{renderRows()}</div>
		</Drawer>
	);
};
