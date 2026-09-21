import { useEffect, useMemo, useState } from 'react';

import { skipToken } from '@reduxjs/toolkit/query';

import { useGetWorkflowDefinitionQuery } from '@module/workflow-definition/hooks';
import { workflowRunApi } from '@module/workflow-run/api';
import { buildRunTimeline, getRunProgress } from '@module/workflow-run/data';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';

import {
	useGetWorkflowRunContextQuery,
	useGetWorkflowRunNodeDebugsQuery,
	useGetWorkflowRunQuery,
} from './workflow-run.hooks';

const POLL_MS = 2_000;
const CLOCK_MS = 1_000;

const EMPTY_DEBUG: Record<string, WorkflowRunNodeDebug> = {};
const EMPTY_CONTEXT: Record<string, unknown> = {};

/**
 * Loads everything the run detail screen renders: the instance status, the definition it
 * runs, per-node debug records and the live context. While `live` is on and the run has
 * not settled, the status is polled and everything else follows its changes.
 */
export const useWorkflowRunDetail = (runId: string) => {
	const [live, setLive] = useState(true);

	// Reads the cached status without subscribing, so polling can stop once the run settles.
	const cached = workflowRunApi.endpoints.getWorkflowRun.useQueryState(runId).data;
	const active = !!cached && ['running', 'waiting', 'paused'].includes(cached.status);
	const pollingInterval = live && active ? POLL_MS : 0;

	const status = useGetWorkflowRunQuery(runId, { pollingInterval });
	const detail = status.data;

	const definition = useGetWorkflowDefinitionQuery(detail?.workflow_definition_id ?? skipToken);

	const debugNodes = useMemo(
		() =>
			Object.entries(detail?.nodes ?? {})
				.map(([nodeId, occurrence]) => ({
					nodeId,
					occurrenceId: occurrence.occurrence_id,
					status: occurrence.status,
					attempt: occurrence.attempt,
				}))
				.sort((a, b) => a.nodeId.localeCompare(b.nodeId)),
		[detail?.nodes],
	);
	const debug = useGetWorkflowRunNodeDebugsQuery(detail ? { id: runId, nodes: debugNodes } : skipToken);

	const context = useGetWorkflowRunContextQuery(detail ? runId : skipToken, { pollingInterval });

	// Keeps in-flight timeline bars and the elapsed counter moving between polls.
	const [clock, setClock] = useState(() => Date.now());
	const ticking = detail?.status === 'running' || detail?.status === 'waiting';
	useEffect(() => {
		if (!ticking) return;
		const timer = setInterval(() => setClock(Date.now()), CLOCK_MS);
		return () => clearInterval(timer);
	}, [ticking]);

	const debugById = debug.data ?? EMPTY_DEBUG;

	const timeline = useMemo(
		() => (detail ? buildRunTimeline(detail, debugById, clock) : null),
		[detail, debugById, clock],
	);

	const progress = useMemo(
		() => (detail && definition.data ? getRunProgress(detail, definition.data.content) : null),
		[detail, definition.data],
	);

	return {
		detail,
		definition: definition.data,
		debug: debugById,
		context: context.data ?? EMPTY_CONTEXT,
		clock,
		timeline,
		progress,
		live,
		setLive,
		isLoading: status.isLoading || definition.isLoading,
		error: status.error ?? definition.error ?? null,
		refetch: status.refetch,
	};
};

export type WorkflowRunDetailState = ReturnType<typeof useWorkflowRunDetail>;
