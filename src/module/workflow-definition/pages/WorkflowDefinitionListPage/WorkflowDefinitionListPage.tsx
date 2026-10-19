import React, { useState } from 'react';

import { Button, Group, ScrollArea, SimpleGrid, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { LuCircleAlert, LuPlus, LuSearchX } from 'react-icons/lu';
import { Link } from 'react-router';

import { Can, Permission, useCan } from '@core/auth/authorization';

import { PaginationBar } from '@common/component/PaginationBar';
import { ViewModeToggle } from '@common/component/ViewModeToggle';

import { useListViewPreference } from '@module/settings/hooks';
import {
	WorkflowDefinitionCard,
	WorkflowDefinitionCardSkeleton,
} from '@module/workflow-definition/components/WorkflowDefinitionCard';
import { WorkflowDefinitionDeleteModal } from '@module/workflow-definition/components/WorkflowDefinitionDeleteModal';
import { WorkflowDefinitionFilters } from '@module/workflow-definition/components/WorkflowDefinitionFilters';
import { WorkflowDefinitionHero } from '@module/workflow-definition/components/WorkflowDefinitionHero';
import { WorkflowDefinitionTable } from '@module/workflow-definition/components/WorkflowDefinitionTable';
import { WorkflowDefinitionVersionHistory } from '@module/workflow-definition/components/WorkflowDefinitionVersionHistory';
import { sortOrders } from '@module/workflow-definition/constant';
import {
	NAME_URL_UPDATE,
	useListWorkflowDefinitionsQuery,
	useWorkflowDefinitionDelete,
	useWorkflowDefinitionListParams,
} from '@module/workflow-definition/hooks';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionFilterValues } from '@module/workflow-definition/types/WorkflowDefinitionFilterValues';

import classes from './WorkflowDefinitionListPage.module.scss';

export const WorkflowDefinitionListPage: React.FC = () => {
	const [view, setView] = useListViewPreference('workflowDefinition');
	const [params, setParams] = useWorkflowDefinitionListParams();
	const { name, sort, page, perPage } = params;
	const [debouncedName] = useDebouncedValue(name.trim(), 300);
	const filters: WorkflowDefinitionFilterValues = { sort };
	const setPage = (next: number) => setParams({ page: next });

	const [historyFor, setHistoryFor] = useState<WorkflowDefinition | null>(null);
	const canWrite = useCan(Permission.DefinitionsWrite);

	const { by, direction } = sortOrders[sort];
	const {
		data: result,
		isFetching,
		isError,
		refetch,
	} = useListWorkflowDefinitionsQuery({
		page,
		perPage,
		order: { by, direction },
		filter: {
			latest_only: { op: '_eq', value: 'true' },
			...(debouncedName ? { name: { op: '_eq' as const, value: debouncedName } } : {}),
		},
	});

	const deletion = useWorkflowDefinitionDelete((definition) => {
		const lastOnPage = result?.items.length === 1 && result.items[0].id === definition.id;
		if (lastOnPage && page > 1) setPage(page - 1);
	});

	const hasActiveFilters = !!name;
	const clearFilters = () => setParams({ name: null, sort: null, page: null });

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
						The name filter matches whole names only, and is case-sensitive.
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
								onDelete={canWrite ? deletion.request : undefined}
								onShowVersions={setHistoryFor}
							/>
						))}
					</SimpleGrid>
				) : (
					<WorkflowDefinitionTable
						definitions={result.items}
						onDelete={canWrite ? deletion.request : undefined}
						onShowVersions={setHistoryFor}
					/>
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
					<Can rule={Permission.DefinitionsWrite}>
						<Button component={Link} to="new" leftSection={<LuPlus size={16} />}>
							New definition
						</Button>
					</Can>
				</Group>

				<WorkflowDefinitionHero
					name={name}
					onNameChange={(value) => setParams({ name: value, page: null }, NAME_URL_UPDATE)}
				/>

				<Group justify="space-between" gap="sm">
					<WorkflowDefinitionFilters
						value={filters}
						onChange={(value) => setParams({ ...value, page: null })}
					/>
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

			<WorkflowDefinitionVersionHistory
				definition={historyFor}
				onClose={() => setHistoryFor(null)}
				onDelete={canWrite ? deletion.request : undefined}
			/>

			<WorkflowDefinitionDeleteModal
				definition={deletion.pending}
				loading={deletion.loading}
				error={deletion.error}
				onClose={deletion.close}
				onConfirm={deletion.confirm}
			/>
		</ScrollArea>
	);
};
