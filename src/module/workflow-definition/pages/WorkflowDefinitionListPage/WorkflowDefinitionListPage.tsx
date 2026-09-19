import React, { useState } from 'react';

import { Button, Group, ScrollArea, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { LuCircleAlert, LuPlus, LuSearchX } from 'react-icons/lu';
import { Link } from 'react-router';

import { PaginationBar } from '@common/component/PaginationBar';
import { ViewModeToggle, type ViewMode } from '@common/component/ViewModeToggle';

import {
	WorkflowDefinitionCard,
	WorkflowDefinitionCardSkeleton,
} from '@module/workflow-definition/components/WorkflowDefinitionCard';
import { WorkflowDefinitionDeleteModal } from '@module/workflow-definition/components/WorkflowDefinitionDeleteModal';
import { WorkflowDefinitionFilters } from '@module/workflow-definition/components/WorkflowDefinitionFilters';
import { WorkflowDefinitionHero } from '@module/workflow-definition/components/WorkflowDefinitionHero';
import { WorkflowDefinitionTable } from '@module/workflow-definition/components/WorkflowDefinitionTable';
import { sortOrders } from '@module/workflow-definition/data';
import {
	SEARCH_URL_UPDATE,
	useDeleteWorkflowDefinitionMutation,
	useListWorkflowDefinitionsQuery,
	useWorkflowDefinitionListParams,
	type WorkflowDefinitionVersionScope,
} from '@module/workflow-definition/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionFilterValues } from '@module/workflow-definition/types/WorkflowDefinitionFilterValues';

import classes from './WorkflowDefinitionListPage.module.scss';

export const WorkflowDefinitionListPage: React.FC = () => {
	const [view, setView] = useState<ViewMode>('card');
	const [params, setParams] = useWorkflowDefinitionListParams();
	const { scope, search, sort, startType, complexity, page, perPage } = params;
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const filters: WorkflowDefinitionFilterValues = { sort, startType, complexity };
	const setPage = (next: number) => setParams({ page: next });

	const [pendingDelete, setPendingDelete] = useState<WorkflowDefinition | null>(null);

	const { by, direction } = sortOrders[sort];
	const {
		data: result,
		isFetching,
		isError,
		refetch,
	} = useListWorkflowDefinitionsQuery({
		page,
		perPage,
		search: debouncedSearch,
		order: { by, direction },
		filter: {
			latest_only: { op: '_eq', value: String(scope === 'latest') },
			...(startType ? { start_type: { op: '_eq' as const, value: startType } } : {}),
			...(complexity ? { complexity: { op: '_eq' as const, value: complexity } } : {}),
		},
	});

	const [deleteDefinition, deleteState] = useDeleteWorkflowDefinitionMutation();
	const deleteError = deleteState.error && 'message' in deleteState.error ? (deleteState.error.message ?? null) : null;

	const closeDelete = () => {
		setPendingDelete(null);
		deleteState.reset();
	};

	const confirmDelete = async (definition: WorkflowDefinition) => {
		const response = await deleteDefinition(definition.id);
		if ('error' in response) return;

		if (result && result.items.length === 1 && page > 1) setPage(page - 1);
		closeDelete();
	};

	const hasActiveFilters = !!search || !!startType || !!complexity;
	const clearFilters = () => setParams({ search: null, sort: null, startType: null, complexity: null, page: null });

	const renderResults = () => {
		if (isError && !isFetching) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load workflow definitions</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!result) {
			return view === 'card' ? (
				<SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
					{Array.from({ length: perPage }, (_, index) => (
						<WorkflowDefinitionCardSkeleton key={index} />
					))}
				</SimpleGrid>
			) : (
				<WorkflowDefinitionTable definitions={[]} skeletonRows={perPage} />
			);
		}

		if (result.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuSearchX size={22} />
					</ThemeIcon>
					<Text fw={600}>No workflow definitions found</Text>
					<Text fz="sm" c="dimmed">
						Try a different name or loosen the filters.
					</Text>
					{hasActiveFilters && (
						<Button variant="default" size="xs" mt={4} onClick={clearFilters}>
							Clear filters
						</Button>
					)}
				</Stack>
			);
		}

		return (
			<div className={classes.results} data-loading={isFetching || undefined} aria-busy={isFetching}>
				{view === 'card' ? (
					<SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
						{result.items.map((definition) => (
							<WorkflowDefinitionCard
								key={definition.id}
								definition={definition}
								onDelete={setPendingDelete}
							/>
						))}
					</SimpleGrid>
				) : (
					<WorkflowDefinitionTable definitions={result.items} onDelete={setPendingDelete} />
				)}
			</div>
		);
	};

	return (
		<ScrollArea h="100%" className={classes.canvas}>
			<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1180} mx="auto">
				<Group justify="space-between" align="flex-end" gap="sm">
					<div>
						<Title order={2} fz={22}>
							Workflow Definition
						</Title>
						<Text fz="sm" c="dimmed">
							Immutable, versioned blueprints your workflow instances run from
						</Text>
					</div>
					<Button component={Link} to="new" leftSection={<LuPlus size={16} />}>
						New definition
					</Button>
				</Group>

				<SegmentedControl
					fullWidth={false}
					size="sm"
					className={classes.scope}
					value={scope}
					onChange={(value) => setParams({ scope: value as WorkflowDefinitionVersionScope, page: null })}
					data={[
						{ label: 'Latest versions', value: 'latest' },
						{ label: 'All versions', value: 'all' },
					]}
				/>

				<WorkflowDefinitionHero
					search={search}
					onSearchChange={(value) => setParams({ search: value, page: null }, SEARCH_URL_UPDATE)}
				/>

				<Group justify="space-between" gap="sm">
					<WorkflowDefinitionFilters value={filters} onChange={(value) => setParams({ ...value, page: null })} />
					<Group gap="sm">
						{result && (
							<Text fz="sm" c="dimmed">
								{result.total} {result.total === 1 ? 'definition' : 'definitions'}
							</Text>
						)}
						<ViewModeToggle value={view} onChange={setView} />
					</Group>
				</Group>

				{renderResults()}

				{result && result.total > 0 && (
					<PaginationBar
						page={result.page}
						perPage={result.per_page}
						total={result.total}
						totalPages={result.total_pages}
						onPageChange={setPage}
						onPerPageChange={(value) => setParams({ perPage: value, page: null })}
					/>
				)}
			</Stack>

			<WorkflowDefinitionDeleteModal
				definition={pendingDelete}
				loading={deleteState.isLoading}
				error={deleteError}
				onClose={closeDelete}
				onConfirm={confirmDelete}
			/>
		</ScrollArea>
	);
};
