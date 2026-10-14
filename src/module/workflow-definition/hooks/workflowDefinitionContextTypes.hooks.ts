import { skipToken } from '@reduxjs/toolkit/query';

import { Permission, useCan } from '@core/auth/authorization';
import { useCoreSelector } from '@core/store';

import { contextTypesFromValue } from '@module/workflow-definition/data';
import {
	selectEditorContextSource,
	selectEditorNodeDefinition,
	selectEditorSourceId,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorContextSource } from '@module/workflow-definition/types/WorkflowDefinitionEditorContextSource';
import {
	useGetWorkflowRunContextQuery,
	useGetWorkflowRunDebugContextQuery,
	useListWorkflowRunsQuery,
} from '@module/workflow-run/hooks';
import type { WorkflowRun } from '@module/workflow-run/types/WorkflowRun';
import type { WorkflowRunQuery } from '@module/workflow-run/types/WorkflowRunQuery';

export interface EditorContextTypes {
	source: WorkflowDefinitionEditorContextSource;
	/** `unavailable`: an unsaved draft (no runs), a node definition (never run itself) or no permission to read runs. */
	state: 'off' | 'unavailable' | 'none' | 'loading' | 'ready' | 'error';
	typescript?: string;
	/** The run the types come from: the full run for `latest`, just its id and kind for a picked run. */
	run?: Pick<WorkflowRun, 'id' | 'debug'> & Partial<WorkflowRun>;
	error?: unknown;
}

// Keyed by the cached context object, so every node inspector shares one inference per fetched context.
const inferredTypes = new WeakMap<object, string>();
const inferTypes = (context: Record<string, unknown>) => {
	let typescript = inferredTypes.get(context);
	if (typescript === undefined) {
		typescript = contextTypesFromValue(context);
		inferredTypes.set(context, typescript);
	}
	return typescript;
};

/** The newest run of a definition version, of any status or kind. */
export const latestRunQuery = (definitionId: string): WorkflowRunQuery => ({
	page: 1,
	perPage: 1,
	order: { by: 'created_at', direction: 'desc' },
	filter: { workflow_definition_id: { op: '_eq', value: definitionId } },
});

/**
 * `context` types for `nodeId` from the editor-wide context source. A debug run gives per-node, redacted types; any
 * other run gives types inferred from its current context, the same for every node.
 */
export const useEditorContextTypes = (nodeId: string): EditorContextTypes => {
	const source = useCoreSelector(selectEditorContextSource);
	const sourceId = useCoreSelector(selectEditorSourceId);
	const isNodeDefinition = !!useCoreSelector(selectEditorNodeDefinition);
	const canReadRuns = useCan(Permission.InstancesRead);
	const enabled = source.mode !== 'off' && !!sourceId && !isNodeDefinition && canReadRuns;

	const latest = useListWorkflowRunsQuery(enabled && source.mode === 'latest' ? latestRunQuery(sourceId) : skipToken);
	const run: EditorContextTypes['run'] = !enabled
		? undefined
		: source.mode === 'run'
			? { id: source.runId, debug: source.debug }
			: latest.data?.items[0];

	const debugContext = useGetWorkflowRunDebugContextQuery(run?.debug ? { id: run.id, nodeId } : skipToken);
	const context = useGetWorkflowRunContextQuery(run && !run.debug ? run.id : skipToken);

	if (source.mode === 'off') return { source, state: 'off' };
	if (!enabled) return { source, state: 'unavailable' };
	if (source.mode === 'latest') {
		if (latest.error) return { source, state: 'error', error: latest.error };
		if (!latest.data) return { source, state: 'loading' };
		if (!run) return { source, state: 'none' };
	}

	const types = run?.debug ? debugContext : context;
	// `currentData`, so a switch of run or node never shows the previous one's types.
	const typescript = run?.debug
		? debugContext.currentData?.typescript
		: context.currentData && inferTypes(context.currentData);
	if (types.error) return { source, state: 'error', run, error: types.error };
	if (!typescript) return { source, state: 'loading', run };
	return { source, state: 'ready', run, typescript };
};
