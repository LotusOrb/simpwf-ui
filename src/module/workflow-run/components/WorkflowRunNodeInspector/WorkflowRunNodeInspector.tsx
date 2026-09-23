import React from 'react';

import { Alert, Badge, Button, Group, ScrollArea, Stack, Tabs, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import { LuCircleAlert, LuMousePointerClick, LuShieldCheck, LuUndo2 } from 'react-icons/lu';

import { nodeTypeMeta } from '@module/workflow-definition/data';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { formatDuration, nodeRunStatusMeta } from '@module/workflow-run/data';
import type { WorkflowRunNodeDebug } from '@module/workflow-run/types/WorkflowRunNodeDebug';
import type { WorkflowRunNodeOccurrence } from '@module/workflow-run/types/WorkflowRunNodeOccurrence';

import { WorkflowRunJsonView } from '../WorkflowRunJsonView';
import classes from './WorkflowRunNodeInspector.module.scss';

const timestamp = (value: string | null) => (value ? dayjs(value).format('DD MMM HH:mm:ss.SSS') : '—');

interface WorkflowRunNodeInspectorProps {
	node: WorkflowDefinitionNode | null;
	occurrence: WorkflowRunNodeOccurrence | null;
	debug: WorkflowRunNodeDebug | null;
	canRollback: boolean;
	onRollback: (nodeId: string) => void;
}

export const WorkflowRunNodeInspector: React.FC<WorkflowRunNodeInspectorProps> = ({
	node,
	occurrence,
	debug,
	canRollback,
	onRollback,
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
					Pick a node on the canvas or a row in the timeline to inspect its attempts, payloads and context
					diff.
				</Text>
			</Stack>
		);
	}

	const typeMeta = nodeTypeMeta[node.type];
	const status = occurrence?.status ?? 'pending';
	const statusMeta = nodeRunStatusMeta[status];

	const facts: { label: string; value: React.ReactNode }[] = [
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

					<Tabs defaultValue="io" variant="outline">
						<Tabs.List>
							<Tabs.Tab value="io" fz="xs">
								Input / Output
							</Tabs.Tab>
							<Tabs.Tab value="context" fz="xs">
								Context diff
							</Tabs.Tab>
						</Tabs.List>

						<Tabs.Panel value="io" pt="sm">
							<Stack gap="xs">
								<Text fz={11} fw={600} c="dimmed">
									Input
								</Text>
								<WorkflowRunJsonView value={debug?.input} emptyLabel="No input recorded" />
								<Text fz={11} fw={600} c="dimmed" mt={4}>
									Output
								</Text>
								<WorkflowRunJsonView value={debug?.output} emptyLabel="Node has not produced output" />
							</Stack>
						</Tabs.Panel>

						<Tabs.Panel value="context" pt="sm">
							<Stack gap="xs">
								<Text fz={11} fw={600} c="dimmed">
									Before
								</Text>
								<WorkflowRunJsonView
									value={debug?.context_before}
									emptyLabel="No snapshot taken (lean context mode)"
								/>
								<Text fz={11} fw={600} c="dimmed" mt={4}>
									After
								</Text>
								<WorkflowRunJsonView
									value={debug?.context_after}
									emptyLabel="Node has not committed a context yet"
								/>
							</Stack>
						</Tabs.Panel>
					</Tabs>
				</Stack>
			</ScrollArea>
		</div>
	);
};
