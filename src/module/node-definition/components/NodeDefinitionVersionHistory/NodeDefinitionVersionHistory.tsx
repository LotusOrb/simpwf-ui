import React, { useEffect } from 'react';

import { ActionIcon, Badge, Button, Group, Loader, Skeleton, Stack, Text, Tooltip } from '@mantine/core';
import { useIntersection } from '@mantine/hooks';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router';

import { nodeDefinitionLink } from '@module/node-definition/data';
import { useListNodeDefinitionVersionPagesInfiniteQuery } from '@module/node-definition/hooks';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';

import classes from './NodeDefinitionVersionHistory.module.scss';

dayjs.extend(relativeTime);

const PER_PAGE = 20;

interface NodeDefinitionVersionHistoryProps {
	lineageId: string;
	/** The version open on the page, badged as "viewing". */
	viewingId: string;
	onDelete?: (definition: NodeDefinition) => void;
}

/** Every version of a lineage, newest first, loading more as the end scrolls into view. */
export const NodeDefinitionVersionHistory: React.FC<NodeDefinitionVersionHistoryProps> = ({
	lineageId,
	viewingId,
	onDelete,
}) => {
	const { currentData, isError, isFetching, isFetchingNextPage, hasNextPage, fetchNextPage, refetch } =
		useListNodeDefinitionVersionPagesInfiniteQuery({ lineageId, perPage: PER_PAGE });
	const versions = currentData?.pages.flatMap((page) => page.items) ?? [];
	const latestId = versions[0]?.id;

	const { ref: sentinelRef, entry } = useIntersection({ rootMargin: '200px' });
	const sentinelVisible = !!entry?.isIntersecting;
	// Re-checked after every page so a sentinel still in view keeps loading; a failed page waits for "Try again".
	useEffect(() => {
		if (sentinelVisible && hasNextPage && !isFetching && !isError) fetchNextPage();
	}, [sentinelVisible, hasNextPage, isFetching, isError, fetchNextPage, versions.length]);

	if (isError && !currentData) {
		return (
			<Stack align="center" gap={4} py="md">
				<Text fz="sm" c="red">
					Couldn't load version history
				</Text>
				<Button variant="default" size="xs" onClick={() => refetch()}>
					Try again
				</Button>
			</Stack>
		);
	}

	if (!currentData) {
		return (
			<Stack gap="xs">
				{Array.from({ length: 3 }, (_, index) => (
					<Skeleton key={index} height={36} />
				))}
			</Stack>
		);
	}

	return (
		<Stack gap={2} aria-busy={isFetching}>
			{versions.map((version) => (
				<div key={version.id} className={classes.row} data-viewing={version.id === viewingId || undefined}>
					<Badge size="sm" color="gray" variant="light">
						v{version.version}
					</Badge>
					<div className={classes.body}>
						<Text
							component={Link}
							to={nodeDefinitionLink(version.id)}
							fz="sm"
							fw={500}
							truncate
							c="inherit"
							td="none"
							display="block"
						>
							{version.name}
						</Text>
						<Text fz="xs" c="dimmed" title={dayjs(version.created_at).format('DD MMM YYYY HH:mm')}>
							{dayjs(version.created_at).fromNow()}
						</Text>
					</div>
					<Group gap={4} wrap="nowrap">
						{version.id === latestId && (
							<Badge size="xs" color="green" variant="light">
								Latest
							</Badge>
						)}
						{version.id === viewingId && (
							<Badge size="xs" color="blue" variant="light">
								Viewing
							</Badge>
						)}
						{onDelete && (
							<Tooltip label="Delete this version">
								<ActionIcon
									size="sm"
									variant="subtle"
									color="red"
									aria-label={`Delete v${version.version}`}
									onClick={() => onDelete(version)}
								>
									<LuTrash2 size={14} />
								</ActionIcon>
							</Tooltip>
						)}
					</Group>
				</div>
			))}
			<div ref={sentinelRef} />
			{isFetchingNextPage && (
				<Group justify="center" py="xs">
					<Loader size="sm" color="gray" />
				</Group>
			)}
			{isError && (
				<Stack align="center" gap={4} py="xs">
					<Text fz="sm" c="red">
						Couldn't load more versions
					</Text>
					<Button variant="default" size="xs" onClick={() => fetchNextPage()}>
						Try again
					</Button>
				</Stack>
			)}
			{!hasNextPage && !isError && (
				<Text fz="xs" c="dimmed" ta="center" py="xs">
					All {versions.length} {versions.length === 1 ? 'version' : 'versions'} loaded
				</Text>
			)}
		</Stack>
	);
};
