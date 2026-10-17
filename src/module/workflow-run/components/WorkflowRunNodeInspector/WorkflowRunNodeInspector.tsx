import React, { useState } from 'react';

import { Alert, Badge, Button, Fieldset, Group, ScrollArea, Stack, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import { LuCheck, LuCircleAlert, LuFileType, LuMousePointerClick, LuShieldCheck, LuUndo2 } from 'react-icons/lu';

import { SchemaForm } from '@common/component/SchemaForm';

import { nodeTypeMetaOf } from '@module/node-type/data';
import { useNodeTypeCatalog } from '@module/node-type/hooks';
import { useNotify } from '@module/notification/hooks';
import { GRAPH_FIELDS, shownStartDelay } from '@module/workflow-definition/data';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { formatDuration, nodeRunStatusMeta } from '@module/workflow-run/data';
import { useLazyGetWorkflowRunDebugContextQuery } from '@module/workflow-run/hooks';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeOccurrence } from '@module/workflow-run/types/WorkflowRunNodeOccurrence';

import { WorkflowRunJsonView } from '../WorkflowRunJsonView';
import classes from './WorkflowRunNodeInspector.module.scss';

const timestamp = (value: string | null) => (value ? dayjs(value).format('DD MMM HH:mm:ss.SSS') : '—');

// Shown elsewhere in the inspector (name, start delay) or meaningless here (routing, editor metadata).
const HIDDEN_CONFIG_FIELDS: ReadonlySet<string> = new Set([
	...GRAPH_FIELDS,
	'name',
	'metadata',
	'start_delay',
	'node_definition_id',
]);

/** The node's configuration as the run's definition snapshot has it, read-only, laid out from its catalog schema. */
const NodeConfiguration: React.FC<{ node: WorkflowDefinitionNode }> = ({ node }) => {
	const { catalog } = useNodeTypeCatalog();
	const schema = catalog.byType[node.type]?.schema;
	const config = node as unknown as Record<string, unknown>;
	const keys = Object.keys(config).filter((key) => !HIDDEN_CONFIG_FIELDS.has(key) && config[key] !== undefined);

	if (keys.length === 0) return null;
	return (
		<Stack gap="xs">
			<Text fz={11} fw={600} c="dimmed">
				Configuration
			</Text>
			{schema ? (
				<Fieldset variant="unstyled" disabled>
					<Stack gap="sm">
						<SchemaForm
							key={node.id}
							schema={schema}
							value={config}
							onChange={() => undefined}
							keys={keys.filter((key) => schema.properties?.[key])}
							readOnly
						/>
					</Stack>
				</Fieldset>
			) : (
				<WorkflowRunJsonView value={Object.fromEntries(keys.map((key) => [key, config[key]]))} />
			)}
		</Stack>
	);
};

interface WorkflowRunNodeInspectorProps {
	node: WorkflowDefinitionNode | null;
	occurrence: WorkflowRunNodeOccurrence | null;
	debug: WorkflowRunNodeDebug | null;
	canRollback: boolean;
	onRollback: (nodeId: string) => void;
	/** Set for debug runs only: their context can be copied as TypeScript declarations. */
	debugRunId?: string | null;
}

/** Copies the `declare const context` types the engine renders for this node's snapshot. */
const CopyTypesButton: React.FC<{ runId: string; nodeId: string }> = ({ runId, nodeId }) => {
	const [fetchTypes, state] = useLazyGetWorkflowRunDebugContextQuery();
	const [copied, setCopied] = useState(false);
	const notify = useNotify();

	const copy = async () => {
		try {
			const { typescript } = await fetchTypes({ id: runId, nodeId }, true).unwrap();
			await navigator.clipboard.writeText(typescript);
			setCopied(true);
			setTimeout(() => setCopied(false), 1_500);
		} catch (error) {
			const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
			notify.error({
				title: "Couldn't copy context types",
				message: typeof message === 'string' && message ? message : 'The debug context is not available',
				toastOnly: true,
			});
		}
	};

	return (
		<Tooltip label="Context at this node as TypeScript declarations, for script autocomplete">
			<Button
				size="xs"
				variant="default"
				mt="sm"
				fullWidth
				leftSection={copied ? <LuCheck size={14} /> : <LuFileType size={14} />}
				loading={state.isFetching}
				onClick={copy}
			>
				{copied ? 'Copied' : 'Copy TS types'}
			</Button>
		</Tooltip>
	);
};

export const WorkflowRunNodeInspector: React.FC<WorkflowRunNodeInspectorProps> = ({
	node,
	occurrence,
	debug,
	canRollback,
	onRollback,
	debugRunId,
}) => {
	if (!node) {
		return (
			<Stack align="center" justify="center" gap="xs" h="100%" p="lg">
				<ThemeIcon size={44} radius="xl" variant="light" color="gray">
					<LuMousePointerClick size={20} />
				</ThemeIcon>
				<Text fw={600} fz="sm">
					No node selected
				</Text>
				<Text fz="xs" c="dimmed" ta="center" maw={220}>
					Pick a node on the canvas or a row in the timeline to inspect its attempts and payloads.
				</Text>
			</Stack>
		);
	}

	const typeMeta = nodeTypeMetaOf(node.type);
	const status = occurrence?.status ?? 'pending';
	const statusMeta = nodeRunStatusMeta[status];
	const isDelay = node.type === 'delay';
	const startDelay = shownStartDelay(node);

	const facts: { label: string; value: React.ReactNode }[] = [
		// Configured waits from the definition snapshot. A library delay's own value isn't in the snapshot.
		...(isDelay && node.delay ? [{ label: 'Delay', value: node.delay }] : []),
		...(startDelay ? [{ label: 'Start delay', value: startDelay }] : []),
		{ label: 'Attempts', value: debug ? `${debug.latest_attempt} of ${debug.attempt_count}` : '—' },
		{ label: 'Duration', value: formatDuration(debug?.duration_ms ?? null) },
		{ label: 'Started', value: timestamp(debug?.started_at ?? null) },
		{ label: 'Finished', value: timestamp(debug?.finished_at ?? debug?.stopped_at ?? null) },
		{ label: 'Occurrence', value: occurrence?.occurrence_id ?? '—' },
		{ label: 'Node id', value: node.id },
	];

	return (
		<div className={classes.root}>
			<div className={classes.header}>
				<Group gap="sm" wrap="nowrap" align="flex-start">
					<ThemeIcon size={34} radius="sm" variant="light" color={typeMeta.color}>
						<typeMeta.icon size={17} />
					</ThemeIcon>
					<div className={classes.headerTitle}>
						<Text fw={600} truncate title={node.name}>
							{node.name}
						</Text>
						<Text fz="xs" c="dimmed">
							{typeMeta.label}
						</Text>
					</div>
					<Badge color={statusMeta.color} variant="light" leftSection={<statusMeta.icon size={11} />}>
						{statusMeta.label}
					</Badge>
				</Group>

				{debugRunId && occurrence && <CopyTypesButton runId={debugRunId} nodeId={node.id} />}

				{canRollback && (
					<Tooltip label="Rewind the run to just before this node and replay from here">
						<Button
							size="xs"
							variant="light"
							color="grape"
							mt="sm"
							fullWidth
							leftSection={<LuUndo2 size={14} />}
							onClick={() => onRollback(node.id)}
						>
							Roll back to this node
						</Button>
					</Tooltip>
				)}
			</div>

			<ScrollArea className={classes.body} type="auto">
				<Stack gap="md" p="md">
					{debug?.error && (
						<Alert color="red" icon={<LuCircleAlert size={16} />} title="Node error" p="sm">
							<Text fz="xs" className={classes.error}>
								{debug.error}
							</Text>
						</Alert>
					)}

					{debug?.recovery_policy && (
						<Alert color="gray" icon={<LuShieldCheck size={16} />} p="sm">
							<Text fz="xs" fw={600}>
								{debug.recovery_policy}
							</Text>
							{debug.recovery_result && (
								<Text fz="xs" c="dimmed">
									{debug.recovery_result}
								</Text>
							)}
						</Alert>
					)}

					<div className={classes.facts}>
						{facts.map((fact) => (
							<div key={fact.label} className={classes.fact}>
								<Text fz={10} c="dimmed" tt="uppercase" fw={600} lts={0.4}>
									{fact.label}
								</Text>
								<Text fz="xs" className={classes.factValue} title={String(fact.value)}>
									{fact.value}
								</Text>
							</div>
						))}
					</div>

					<Stack gap="xs">
						<Text fz={11} fw={600} c="dimmed">
							Input
						</Text>
						<WorkflowRunJsonView value={debug?.input} emptyLabel="No input recorded" />
						<Text fz={11} fw={600} c="dimmed" mt={4}>
							Output
						</Text>
						{/* A finished node can legitimately output null (a delay node always does). */}
						<WorkflowRunJsonView
							value={debug?.output}
							emptyLabel="Node has not produced output"
							showNull={debug?.status === 'succeeded'}
						/>
						{isDelay && debug?.status === 'succeeded' && (
							<Text fz="xs" c="dimmed">
								A delay node always outputs null.
							</Text>
						)}
					</Stack>

					<NodeConfiguration node={node} />
				</Stack>
			</ScrollArea>
		</div>
	);
};
