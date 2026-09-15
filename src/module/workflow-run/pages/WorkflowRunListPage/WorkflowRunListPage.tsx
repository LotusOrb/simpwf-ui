import React, { useEffect, useEffectEvent, useState } from 'react';

import {
	ActionIcon,
	Alert,
	Button,
	Group,
	Modal,
	ScrollArea,
	SimpleGrid,
	Stack,
	Switch,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { LuPlay, LuRefreshCw, LuSearchX, LuTriangleAlert } from 'react-icons/lu';

import { PaginationBar, PER_PAGE_OPTIONS } from '@common/component/PaginationBar';
import { ViewModeToggle, type ViewMode } from '@common/component/ViewModeToggle';
import { useAsyncQuery } from '@common/hooks/useAsyncQuery';

import { listWorkflowDefinitions } from '@module/workflow-definition/data';
import {
	WorkflowRunCard,
	WorkflowRunCardSkeleton,
	type WorkflowRunDefinitionInfo,
} from '@module/workflow-run/components/WorkflowRunCard';
import { WorkflowRunFilters, type WorkflowRunFilterValues } from '@module/workflow-run/components/WorkflowRunFilters';
import { WorkflowRunIdText } from '@module/workflow-run/components/WorkflowRunIdText';
import {
	WorkflowRunStatusTabs,
	type WorkflowRunStatusTab,
} from '@module/workflow-run/components/WorkflowRunStatusTabs';
import { WorkflowRunTable } from '@module/workflow-run/components/WorkflowRunTable';
import {
	countWorkflowRunsByStatus,
	listWorkflowRuns,
	pauseWorkflowRun,
	resumeWorkflowRun,
	runSortOrders,
	stopWorkflowRun,
	type WorkflowRun,
	type WorkflowRunAction,
} from '@module/workflow-run/data';

import classes from './WorkflowRunListPage.module.scss';

const AUTO_REFRESH_MS = 5000;
const SETTLE_REFRESH_MS = 3200;

const initialFilters: WorkflowRunFilterValues = { search: '', definitionId: null, sort: 'newest' };

const actionRequests: Record<WorkflowRunAction, (id: string) => Promise<unknown>> = {
	pause: pauseWorkflowRun,
	resume: resumeWorkflowRun,
	stop: stopWorkflowRun,
};

export const WorkflowRunListPage: React.FC = () => {
	const [view, setView] = useState<ViewMode>('card');
	const [statusTab, setStatusTab] = useState<WorkflowRunStatusTab>('all');
	const [filters, setFilters] = useState(initialFilters);
	const [debouncedSearch] = useDebouncedValue(filters.search, 300);
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
	const [autoRefresh, setAutoRefresh] = useState(false);
	const [busyIds, setBusyIds] = useState<string[]>([]);
	const [pendingStop, setPendingStop] = useState<WorkflowRun | null>(null);
	const [actionError, setActionError] = useState<string | null>(null);

	const baseQuery = { search: debouncedSearch, workflowDefinitionId: filters.definitionId };

	const runs = useAsyncQuery(listWorkflowRuns, {
		...baseQuery,
		page,
		perPage,
		order: runSortOrders[filters.sort],
		status: statusTab === 'all' ? undefined : [statusTab],
	});
	const counts = useAsyncQuery(countWorkflowRunsByStatus, baseQuery);
	const definitions = useAsyncQuery(listWorkflowDefinitions, { latestOnly: false, perPage: 200 });

	const definitionInfo = new Map<string, WorkflowRunDefinitionInfo>(
		(definitions.data?.items ?? []).map((definition) => [
			definition.id,
			{ name: definition.name, version: definition.version },
		]),
	);

	const definitionGroups = new Map<string, { value: string; label: string; version: number }[]>();
	for (const definition of definitions.data?.items ?? []) {
		const items = definitionGroups.get(definition.name) ?? [];
		items.push({
			value: definition.id,
			label: `${definition.name} · v${definition.version}`,
			version: definition.version,
		});
		definitionGroups.set(definition.name, items);
	}
	const definitionOptions = [...definitionGroups.entries()]
		.sort(([a], [b]) => a.localeCompare(b))
		.map(([name, items]) => ({
			group: name,
			items: items.sort((a, b) => b.version - a.version).map(({ value, label }) => ({ value, label })),
		}));

	const refresh = () => {
		runs.refetch();
		counts.refetch();
	};

	const tick = useEffectEvent(refresh);
	useEffect(() => {
		if (!autoRefresh) return;
		const timer = setInterval(tick, AUTO_REFRESH_MS);
		return () => clearInterval(timer);
	}, [autoRefresh]);

	const resetPage =
		<T,>(setter: (value: T) => void) =>
		(value: T) => {
			setter(value);
			setPage(1);
		};

	const runAction = async (run: WorkflowRun, action: WorkflowRunAction) => {
		setActionError(null);
		setBusyIds((current) => [...current, run.id]);
		try {
			await actionRequests[action](run.id);
			refresh();
			if (action !== 'resume') setTimeout(refresh, SETTLE_REFRESH_MS);
		} catch (error) {
			setActionError(error instanceof Error ? error.message : `Failed to ${action} run`);
		} finally {
			setBusyIds((current) => current.filter((id) => id !== run.id));
		}
	};

	const handleAction = (run: WorkflowRun, action: WorkflowRunAction) => {
		if (action === 'stop') setPendingStop(run);
		else runAction(run, action);
	};

	const confirmStop = () => {
		if (pendingStop) runAction(pendingStop, 'stop');
		setPendingStop(null);
	};

	const hasActiveFilters = !!filters.search || !!filters.definitionId || statusTab !== 'all';
	const clearFilters = () => {
		setFilters(initialFilters);
		setStatusTab('all');
		setPage(1);
	};

	const result = runs.data;

	const renderResults = () => {
		if (!result) {
			return view === 'card' ? (
				<SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
					{Array.from({ length: perPage }, (_, index) => (
						<WorkflowRunCardSkeleton key={index} />
					))}
				</SimpleGrid>
			) : (
				<WorkflowRunTable
					runs={[]}
					definitions={definitionInfo}
					onAction={handleAction}
					skeletonRows={perPage}
				/>
			);
		}

		if (result.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuSearchX size={22} />
					</ThemeIcon>
					<Text fw={600}>No workflow runs found</Text>
					<Text fz="sm" c="dimmed">
						Try another status, workflow or run ID.
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
			<div className={classes.results} data-loading={runs.loading || undefined} aria-busy={runs.loading}>
				{view === 'card' ? (
					<SimpleGrid cols={{ base: 1, xs: 2, md: 3, lg: 4 }} spacing="md">
						{result.items.map((run) => (
							<WorkflowRunCard
								key={run.id}
								run={run}
								definition={definitionInfo.get(run.workflow_definition_id)}
								busy={busyIds.includes(run.id)}
								onAction={handleAction}
							/>
						))}
					</SimpleGrid>
				) : (
					<WorkflowRunTable
						runs={result.items}
						definitions={definitionInfo}
						busyIds={busyIds}
						onAction={handleAction}
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
							Workflow Run
						</Title>
						<Text fz="sm" c="dimmed">
							Monitor and control workflow instances as they execute
						</Text>
					</div>
					<Group gap="xs">
						<Switch
							label="Auto refresh"
							size="sm"
							checked={autoRefresh}
							onChange={(event) => setAutoRefresh(event.currentTarget.checked)}
						/>
						<Tooltip label="Refresh">
							<ActionIcon
								variant="default"
								size={36}
								aria-label="Refresh runs"
								onClick={refresh}
								loading={runs.fetching && !!result}
							>
								<LuRefreshCw size={16} />
							</ActionIcon>
						</Tooltip>
						<Button leftSection={<LuPlay size={16} />}>Start run</Button>
					</Group>
				</Group>

				<WorkflowRunStatusTabs value={statusTab} counts={counts.data} onChange={resetPage(setStatusTab)} />

				{actionError && (
					<Alert
						color="red"
						icon={<LuTriangleAlert size={16} />}
						withCloseButton
						onClose={() => setActionError(null)}
					>
						{actionError}
					</Alert>
				)}

				<Group justify="space-between" gap="sm">
					<WorkflowRunFilters
						value={filters}
						definitionOptions={definitionOptions}
						onChange={resetPage(setFilters)}
					/>
					<Group gap="sm">
						{result && (
							<Text fz="sm" c="dimmed">
								{result.total} {result.total === 1 ? 'run' : 'runs'}
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

			<Modal opened={!!pendingStop} onClose={() => setPendingStop(null)} title="Stop this run?" centered>
				{pendingStop && (
					<Stack gap="md">
						<div>
							<Text fz="sm">
								{definitionInfo.get(pendingStop.workflow_definition_id)?.name ?? 'This workflow'} will
								be stopped and its active node cancelled. Stopped runs can't be resumed.
							</Text>
							<WorkflowRunIdText id={pendingStop.id} />
						</div>
						<Group justify="flex-end" gap="xs">
							<Button variant="default" onClick={() => setPendingStop(null)}>
								Cancel
							</Button>
							<Button color="red" onClick={confirmStop}>
								Stop run
							</Button>
						</Group>
					</Stack>
				)}
			</Modal>
		</ScrollArea>
	);
};
