import React from 'react';

import { Group, Loader, Select, Stack, Text } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import dayjs from 'dayjs';
import { LuBug, LuChevronsUpDown } from 'react-icons/lu';

import type { CoreQueryError } from '@core/api';
import { Permission, useCan } from '@core/auth/authorization';
import { useCoreSelector } from '@core/store';

import { selectEditorSourceId } from '@module/workflow-definition/store';
import { runStatusMeta } from '@module/workflow-run/data';
import { useGetWorkflowRunDebugContextQuery, useListWorkflowRunsQuery } from '@module/workflow-run/hooks';
import type { WorkflowRunQuery } from '@module/workflow-run/types/WorkflowRunQuery';

import { ContextTypes } from './InspectorContextTypes.context';

// How far back the picker looks. The instance list has no `debug` filter, so debug runs are picked out of the most
// recent runs of this version on the client.
const RECENT_RUNS = 100;

/** Fetches the debug context of `nodeId` in the picked run and hands its TypeScript to the editors inside. */
export const ContextTypesProvider: React.FC<{
	debugRunId: string | null;
	nodeId: string;
	children: React.ReactNode;
}> = ({ debugRunId, nodeId, children }) => {
	const { data, error } = useGetWorkflowRunDebugContextQuery(debugRunId ? { id: debugRunId, nodeId } : skipToken);
	return (
		<ContextTypes.Provider value={debugRunId && !error ? data?.typescript : undefined}>
			{children}
		</ContextTypes.Provider>
	);
};

const describeError = (error: unknown) => {
	const code = (error as Partial<CoreQueryError> | undefined)?.code;
	if (code === 404) return "This node hasn't run in that debug run yet; step the run past it first.";
	if (code === 409) return 'That run is not a debug run.';
	return "Couldn't load context types from that run.";
};

interface InspectorContextTypesPickerProps {
	nodeId: string;
	debugRunId: string | null;
	onChange: (runId: string | null) => void;
}

/** "Load context types from debug run…": typed autocomplete for `context` from a real step-through run. */
export const InspectorContextTypesPicker: React.FC<InspectorContextTypesPickerProps> = ({
	nodeId,
	debugRunId,
	onChange,
}) => {
	const canReadRuns = useCan(Permission.InstancesRead);
	const sourceId = useCoreSelector(selectEditorSourceId);

	const query: WorkflowRunQuery | null = sourceId
		? {
				page: 1,
				perPage: RECENT_RUNS,
				order: { by: 'created_at', direction: 'desc' },
				filter: { workflow_definition_id: { op: '_eq', value: sourceId } },
			}
		: null;
	const runs = useListWorkflowRunsQuery(canReadRuns && query ? query : skipToken);
	const debugRuns = (runs.data?.items ?? []).filter((run) => run.debug);
	const types = useGetWorkflowRunDebugContextQuery(debugRunId ? { id: debugRunId, nodeId } : skipToken);

	// Only saved versions have runs.
	if (!canReadRuns || !sourceId) return null;

	return (
		<Stack gap={4}>
			<Select
				size="xs"
				label="Context types"
				placeholder={
					debugRuns.length > 0 ? 'Load context types from debug run…' : 'No debug runs of this version'
				}
				leftSection={<LuBug size={13} />}
				rightSection={runs.isFetching ? <Loader size={12} /> : <LuChevronsUpDown size={14} />}
				disabled={debugRuns.length === 0 && !debugRunId}
				clearable
				data={debugRuns.map((run) => ({
					value: run.id,
					label: `${run.id.slice(0, 8)} · ${runStatusMeta[run.status].label} · ${dayjs(run.created_at).format('DD MMM HH:mm')}`,
				}))}
				value={debugRunId}
				onChange={onChange}
			/>
			{debugRunId && (
				<Group gap={6} wrap="nowrap">
					{types.isFetching && <Loader size={10} />}
					<Text fz="xs" c={types.error ? 'red' : 'dimmed'}>
						{types.error
							? describeError(types.error)
							: types.data
								? 'Script editors autocomplete `context` as it was at this node.'
								: 'Loading context types…'}
					</Text>
				</Group>
			)}
		</Stack>
	);
};
