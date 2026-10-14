import React, { useState } from 'react';

import { ActionIcon, Group, Indicator, Loader, Menu, ScrollArea, Switch, Text, Tooltip } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import dayjs from 'dayjs';
import { LuBug, LuCheck, LuMenu, LuRefreshCw } from 'react-icons/lu';

import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';
import { Permission, useCan } from '@core/auth/authorization';
import { useCoreDispatch, useCoreSelector } from '@core/store';

import { latestRunQuery } from '@module/workflow-definition/hooks';
import {
	contextSourceChanged,
	selectEditorContextSource,
	selectEditorSourceId,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorContextSource } from '@module/workflow-definition/types/WorkflowDefinitionEditorContextSource';
import { runStatusMeta } from '@module/workflow-run/data';
import { useListWorkflowRunsQuery } from '@module/workflow-run/hooks';

const RECENT_RUNS = 20;

const Check: React.FC<{ visible: boolean }> = ({ visible }) => (
	<LuCheck size={14} style={{ visibility: visible ? 'visible' : 'hidden' }} />
);

/** Header menu choosing where every node inspector's `context` types come from. */
export const ContextSourceMenu: React.FC = () => {
	const dispatch = useCoreDispatch();
	const source = useCoreSelector(selectEditorContextSource);
	const sourceId = useCoreSelector(selectEditorSourceId);
	const canReadRuns = useCan(Permission.InstancesRead);
	const [opened, setOpened] = useState(false);
	const [debugOnly, setDebugOnly] = useState(false);

	// Only while open: the list is just for picking.
	const runs = useListWorkflowRunsQuery(
		opened && sourceId && canReadRuns
			? {
					page: 1,
					perPage: RECENT_RUNS,
					order: { by: 'created_at', direction: 'desc' },
					filter: {
						workflow_definition_id: { op: '_eq', value: sourceId },
						...(debugOnly ? { debug: { op: '_eq' as const, value: true } } : {}),
					},
				}
			: skipToken,
	);
	// Shares its cache entry with the inspectors' lookup of the same run.
	const latest = useListWorkflowRunsQuery(
		source.mode === 'latest' && sourceId && canReadRuns ? latestRunQuery(sourceId) : skipToken,
	);
	const latestRun = latest.data?.items[0];

	const unavailable = !sourceId
		? 'Save the workflow to use run context'
		: !canReadRuns
			? "Your role can't read workflow runs"
			: null;

	if (unavailable) {
		return (
			<Tooltip label={unavailable}>
				<ActionIcon
					variant="default"
					size="lg"
					aria-label="Context source"
					data-disabled
					onClick={(event) => event.preventDefault()}
				>
					<LuMenu size={16} />
				</ActionIcon>
			</Tooltip>
		);
	}

	const select = (next: WorkflowDefinitionEditorContextSource) => dispatch(contextSourceChanged(next));
	// Refetches the run list and whichever run's context the inspectors are reading.
	const refresh = () =>
		dispatch(
			coreApi.util.invalidateTags([
				{ type: apiTagConfig.workflowRun, id: API_TAG_LIST_ID },
				...(source.mode === 'run' ? [{ type: apiTagConfig.workflowRun, id: source.runId }] : []),
				...(source.mode === 'latest' && latestRun
					? [{ type: apiTagConfig.workflowRun, id: latestRun.id }]
					: []),
			]),
		);
	const items = runs.data?.items ?? [];
	const label =
		source.mode === 'off'
			? 'Context types: off'
			: source.mode === 'run'
				? `Context types: run ${source.runId.slice(0, 8)}`
				: `Context types: latest run${latestRun ? ` ${latestRun.id.slice(0, 8)}` : ''}`;

	return (
		<Menu opened={opened} onChange={setOpened} position="bottom-end" shadow="md" width={300} withinPortal>
			<Menu.Target>
				<Indicator size={8} offset={4} disabled={source.mode === 'off'}>
					<Tooltip label={label} disabled={opened}>
						<ActionIcon variant="default" size="lg" aria-label="Context source">
							<LuMenu size={16} />
						</ActionIcon>
					</Tooltip>
				</Indicator>
			</Menu.Target>
			<Menu.Dropdown>
				<Menu.Label>Context source</Menu.Label>
				<Menu.Item
					leftSection={<Check visible={source.mode === 'latest'} />}
					onClick={() => select({ mode: 'latest' })}
				>
					Latest run (auto)
				</Menu.Item>
				<Menu.Item
					leftSection={<Check visible={source.mode === 'off'} />}
					onClick={() => select({ mode: 'off' })}
				>
					Off
				</Menu.Item>

				<Menu.Divider />
				<Group justify="space-between" px="sm" py={6} wrap="nowrap">
					<Text fz="xs" fw={500} c="dimmed">
						Pick a run
					</Text>
					<Switch
						size="xs"
						label="Debug runs only"
						checked={debugOnly}
						onChange={(event) => setDebugOnly(event.currentTarget.checked)}
					/>
				</Group>
				<ScrollArea.Autosize mah={260} type="auto">
					{runs.isLoading ? (
						<Group justify="center" py="xs">
							<Loader size={14} />
						</Group>
					) : items.length === 0 ? (
						<Text fz="xs" c="dimmed" px="sm" py={6}>
							{runs.isError
								? "Couldn't load runs."
								: debugOnly
									? 'No debug runs of this version'
									: 'No runs of this version'}
						</Text>
					) : (
						items.map((run) => (
							<Menu.Item
								key={run.id}
								leftSection={<Check visible={source.mode === 'run' && source.runId === run.id} />}
								rightSection={run.debug ? <LuBug size={13} aria-label="Debug run" /> : undefined}
								onClick={() => select({ mode: 'run', runId: run.id, debug: run.debug })}
							>
								<Text fz="sm" ff="monospace" span>
									{run.id.slice(0, 8)}
								</Text>
								<Text fz="sm" span>
									{` · ${runStatusMeta[run.status].label} · ${dayjs(run.created_at).format('DD MMM HH:mm')}`}
								</Text>
							</Menu.Item>
						))
					)}
				</ScrollArea.Autosize>

				<Menu.Divider />
				<Menu.Item
					leftSection={runs.isFetching ? <Loader size={14} /> : <LuRefreshCw size={14} />}
					closeMenuOnClick={false}
					onClick={refresh}
				>
					Refresh
				</Menu.Item>
			</Menu.Dropdown>
		</Menu>
	);
};
