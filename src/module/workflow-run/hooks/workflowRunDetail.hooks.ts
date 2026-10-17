import { useEffect, useMemo, useState } from 'react';

import { skipToken } from '@reduxjs/toolkit/query';

import { Permission, useCan } from '@core/auth/authorization';

import { useRunStream } from '@module/notification/hooks';
import { useGetWorkflowDefinitionQuery } from '@module/workflow-definition/hooks';
import { workflowRunApi } from '@module/workflow-run/api';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import { buildRunTimeline, getRunProgress } from '@module/workflow-run/utils';

import {
	useGetWorkflowRunContextQuery,
	useGetWorkflowRunDebugContextQuery,
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
 * not settled, the status follows the run's event stream, falling back to polling when the
 * stream is unavailable, and everything else follows its changes.
 */
export const useWorkflowRunDetail = (runId: string) => {
	const [live, setLive] = useState(true);

	// Reads the cached status without subscribing, so polling can stop once the run settles.
	const cached = workflowRunApi.endpoints.getWorkflowRun.useQueryState(runId).data;
	const active = !!cached && ['running', 'waiting', 'paused'].includes(cached.status);
	const streamState = useRunStream(runId, live && active);
	const streaming = streamState === 'open' || streamState === 'connecting';
	const pollingInterval = live && active && !streaming ? POLL_MS : 0;

	const status = useGetWorkflowRunQuery(runId, { pollingInterval });
	const detail = status.data;

	// Without definitions:read the screen degrades to what the run itself reports, rather than failing on a 403.
	const canReadDefinition = useCan(Permission.DefinitionsRead);
	const definition = useGetWorkflowDefinitionQuery(
		canReadDefinition && detail ? detail.workflow_definition_id : skipToken,
	);

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

	// Only step-through runs have a debug cursor; a 409 means the engine disagrees, so the feature stays hidden.
	const debugContext = useGetWorkflowRunDebugContextQuery(detail?.debug ? { id: runId } : skipToken, {
		pollingInterval,
	});
	const debugCursor = detail?.debug && !debugContext.error ? (debugContext.data ?? null) : null;

	// Streamed status events replace the status poll, so the context and debug cursor refetch on each one.
	const refetchContext = context.isUninitialized ? null : context.refetch;
	const refetchDebugContext = debugContext.isUninitialized ? null : debugContext.refetch;
	useEffect(() => {
		if (!streaming) return;
		refetchContext?.();
		refetchDebugContext?.();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [detail]);

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

	const progress = useMemo(() => {
		if (!detail) return null;
		if (canReadDefinition) return definition.data ? getRunProgress(detail, definition.data.content) : null;
		return getRunProgress(detail, null);
	}, [detail, definition.data, canReadDefinition]);

	return {
		detail,
		definition: definition.data,
		canReadDefinition,
		debug: debugById,
		context: context.data ?? EMPTY_CONTEXT,
		/** Where a debug run is paused; null for regular runs. */
		debugCursor,
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
