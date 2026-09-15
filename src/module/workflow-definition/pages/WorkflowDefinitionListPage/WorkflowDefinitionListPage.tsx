import React, { useState } from 'react';

import { Button, Group, ScrollArea, SegmentedControl, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { LuPlus, LuSearchX } from 'react-icons/lu';

import { PaginationBar, PER_PAGE_OPTIONS } from '@common/component/PaginationBar';
import { ViewModeToggle, type ViewMode } from '@common/component/ViewModeToggle';
import { useAsyncQuery } from '@common/hooks/useAsyncQuery';

import {
	WorkflowDefinitionCard,
	WorkflowDefinitionCardSkeleton,
} from '@module/workflow-definition/components/WorkflowDefinitionCard';
import { WorkflowDefinitionFilters } from '@module/workflow-definition/components/WorkflowDefinitionFilters';
import { WorkflowDefinitionHero } from '@module/workflow-definition/components/WorkflowDefinitionHero';
import { WorkflowDefinitionTable } from '@module/workflow-definition/components/WorkflowDefinitionTable';
import {
	listWorkflowDefinitions,
	sortOrders,
	type WorkflowDefinitionFilterValues,
} from '@module/workflow-definition/data';

import classes from './WorkflowDefinitionListPage.module.scss';

type VersionScope = 'latest' | 'all';

const initialFilters: WorkflowDefinitionFilterValues = { sort: 'latest', startType: null, complexity: null };

export const WorkflowDefinitionListPage: React.FC = () => {
	const [scope, setScope] = useState<VersionScope>('latest');
	const [view, setView] = useState<ViewMode>('card');
	const [search, setSearch] = useState('');
	const [debouncedSearch] = useDebouncedValue(search, 300);
	const [filters, setFilters] = useState(initialFilters);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);

	const { data: result, loading } = useAsyncQuery(listWorkflowDefinitions, {
		page,
		perPage,
		search: debouncedSearch,
		order: sortOrders[filters.sort],
		latestOnly: scope === 'latest',
		startType: filters.startType,
		complexity: filters.complexity,
	});

	const resetPage =
		<T,>(setter: (value: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const hasActiveFilters = !!search || !!filters.startType || !!filters.complexity;
	const clearFilters = () => {
		setSearch('');
		setFilters(initialFilters);
		setPage(1);
	};

	const renderResults = () => {
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
			<div className={classes.results} data-loading={loading || undefined} aria-busy={loading}>
				{view === 'card' ? (
					<SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
						{result.items.map((definition) => (
							<WorkflowDefinitionCard key={definition.id} definition={definition} />
						))}
					</SimpleGrid>
				) : (
					<WorkflowDefinitionTable definitions={result.items} />
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
					<Button leftSection={<LuPlus size={16} />}>New definition</Button>
				</Group>

				<SegmentedControl
					fullWidth={false}
					size="sm"
					className={classes.scope}
					value={scope}
					onChange={(value) => resetPage(setScope)(value as VersionScope)}
					data={[
						{ label: 'Latest versions', value: 'latest' },
						{ label: 'All versions', value: 'all' },
					]}
				/>

				<WorkflowDefinitionHero search={search} onSearchChange={resetPage(setSearch)} />

				<Group justify="space-between" gap="sm">
					<WorkflowDefinitionFilters value={filters} onChange={resetPage(setFilters)} />
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
						onPerPageChange={resetPage(setPerPage)}
					/>
				)}
			</Stack>
		</ScrollArea>
	);
};
