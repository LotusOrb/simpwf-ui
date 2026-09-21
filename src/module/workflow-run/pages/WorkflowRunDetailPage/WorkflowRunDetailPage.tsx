import React, { useMemo, useState } from 'react';

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Card,
	Center,
	Group,
	Loader,
	Modal,
	Stack,
	Switch,
	Tabs,
	Text,
	Title,
	Tooltip,
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import {
	LuArrowLeft,
	LuChevronDown,
	LuChevronUp,
	LuCircleAlert,
	LuHourglass,
	LuMaximize2,
	LuMinimize2,
	LuPanelRight,
	LuPause,
	LuPlay,
	LuRefreshCw,
	LuSquare,
	LuTriangleAlert,
	LuUndo2,
} from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { MainLayoutPanel } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel } from '@module/app/hooks';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { WorkflowRunContextPanel } from '@module/workflow-run/components/WorkflowRunContextPanel';
import { WorkflowRunGraph } from '@module/workflow-run/components/WorkflowRunGraph';
import { WorkflowRunIdText } from '@module/workflow-run/components/WorkflowRunIdText';
import { WorkflowRunInputModal } from '@module/workflow-run/components/WorkflowRunInputModal';
import { WorkflowRunJsonView } from '@module/workflow-run/components/WorkflowRunJsonView';
import { WorkflowRunNodeInspector } from '@module/workflow-run/components/WorkflowRunNodeInspector';
import { WorkflowRunRollbackModal } from '@module/workflow-run/components/WorkflowRunRollbackModal';
import { WorkflowRunStatusBadge } from '@module/workflow-run/components/WorkflowRunStatusBadge';
import { WorkflowRunSummary } from '@module/workflow-run/components/WorkflowRunSummary';
import { WorkflowRunTimeline } from '@module/workflow-run/components/WorkflowRunTimeline';
import { formatWaitingReason, getAllowedActions, indexDefinitionNodes } from '@module/workflow-run/data';
import {
	usePauseWorkflowRunMutation,
	useProvideWorkflowRunInputMutation,
	useReplaceWorkflowRunContextMutation,
	useResumeWorkflowRunMutation,
	useRollbackWorkflowRunMutation,
	useStopWorkflowRunMutation,
	useWorkflowRunDetail,
} from '@module/workflow-run/hooks';

import classes from './WorkflowRunDetailPage.module.scss';

const RUN_LIST_ROUTE = '/app/workflow-run';

type TimelineMode = 'collapsed' | 'normal' | 'full';

const errorMessage = (error: unknown, fallback: string): string => {
	const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
	return typeof message === 'string' && message ? message : fallback;
};

export const WorkflowRunDetailPage: React.FC = () => {
	const { id = '' } = useParams<{ id: string }>();

	const panel = useAppLayoutPanel();
	const run = useWorkflowRunDetail(id);

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [rollbackFrom, setRollbackFrom] = useState<string | null>(null);
	const [rollbackOpened, setRollbackOpened] = useState(false);
	const [inputOpened, setInputOpened] = useState(false);
	const [stopOpened, setStopOpened] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);
	const [timelineMode, setTimelineMode] = useState<TimelineMode>('normal');

	const [pauseRun, pauseState] = usePauseWorkflowRunMutation();
	const [resumeRun, resumeState] = useResumeWorkflowRunMutation();
	const [stopRun, stopState] = useStopWorkflowRunMutation();
	const [rollbackRun, rollbackState] = useRollbackWorkflowRunMutation();
	const [provideInput] = useProvideWorkflowRunInputMutation();
	const [replaceContext] = useReplaceWorkflowRunContextMutation();

	const content = run.definition?.content;
	const nodesById = useMemo(
		() => (content ? indexDefinitionNodes(content) : new Map<string, WorkflowDefinitionNode>()),
		[content],
	);

	if (run.isLoading) {
		return (
			<Center h="100%">
				<Loader size="sm" />
			</Center>
		);
	}

	const { detail, definition, debug, context, clock, timeline, progress, live, setLive } = run;

	if (!detail || !definition || !timeline || !progress) {
		return (
			<Center h="100%" p="lg">
				<Stack align="center" gap="xs" maw={360}>
					<LuCircleAlert size={22} />
					<Text fw={600} fz="sm">
						Couldn't load this run
					</Text>
					<Text fz="xs" c="dimmed" ta="center">
						{errorMessage(run.error, 'The run or its workflow definition could not be found.')}
					</Text>
					<Group gap="xs" mt="xs">
						<Button size="xs" variant="default" component={Link} to={RUN_LIST_ROUTE}>
							Back to runs
						</Button>
						<Button size="xs" leftSection={<LuRefreshCw size={13} />} onClick={() => run.refetch()}>
							Retry
						</Button>
					</Group>
				</Stack>
			</Center>
		);
	}

	const perform = async (label: string, request: () => Promise<unknown>) => {
		setActionError(null);
		try {
			await request();
		} catch (error) {
			setActionError(errorMessage(error, `Failed to ${label}`));
		}
	};

	const busy = pauseState.isLoading || resumeState.isLoading || stopState.isLoading || rollbackState.isLoading;

	const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null;
	const selectedOccurrence = selectedNodeId ? (detail.nodes[selectedNodeId] ?? null) : null;
	const selectedDebug = selectedOccurrence ? (debug[selectedOccurrence.occurrence_id] ?? null) : null;

	// A run parked on input reports no current node; the parked node is the one in flight.
	const currentNodeId = detail.current_node_id ?? detail.pending_input?.node_id ?? null;
	const currentNode = currentNodeId ? (nodesById.get(currentNodeId) ?? null) : null;
	const pendingNode = detail.pending_input ? (nodesById.get(detail.pending_input.node_id) ?? null) : null;
	const actions = getAllowedActions(detail);
	const rollbackTargets = timeline.entries.filter((entry) => detail.nodes[entry.nodeId]?.rollbackable);
	const canRollback = ['paused', 'failed', 'stopped'].includes(detail.status) && rollbackTargets.length > 0;

	const elapsedMs = detail.started_at
		? (detail.finished_at ? new Date(detail.finished_at).getTime() : clock) - new Date(detail.started_at).getTime()
		: 0;

	const selectNode = (nodeId: string | null) => {
		setSelectedNodeId(nodeId);
		if (nodeId) panel.open('right');
	};

	const openRollback = (nodeId: string | null) => {
		setRollbackFrom(nodeId);
		setRollbackOpened(true);
	};

	return (
		<>
			<MainLayoutPanel side="right" w={360} visibleFrom="md">
				<WorkflowRunNodeInspector
					node={selectedNode}
					occurrence={selectedOccurrence}
					debug={selectedDebug}
					canRollback={canRollback && !!selectedOccurrence?.rollbackable}
					onRollback={openRollback}
				/>
			</MainLayoutPanel>

			<div className={classes.root}>
				<div className={classes.header}>
					<Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
						<Group gap="sm" wrap="nowrap" className={classes.headerTitle}>
							<Tooltip label="Back to runs">
								<ActionIcon
									component={Link}
									to={RUN_LIST_ROUTE}
									variant="subtle"
									color="gray"
									size={34}
									aria-label="Back to runs"
								>
									<LuArrowLeft size={18} />
								</ActionIcon>
							</Tooltip>
							<div className={classes.titleBlock}>
								<Group gap={8} wrap="nowrap">
									<Title order={2} fz={20} className={classes.title} title={definition.name}>
										{definition.name}
									</Title>
									<Badge size="sm" color="gray">
										v{definition.version}
									</Badge>
									<WorkflowRunStatusBadge run={detail} />
								</Group>
								<Group gap="sm" wrap="nowrap">
									<WorkflowRunIdText id={detail.id} />
									<Text fz="xs" c="dimmed">
										started by {detail.created_by}
									</Text>
								</Group>
							</div>
						</Group>

						<Group gap="xs" wrap="nowrap">
							<Switch
								label="Live"
								size="sm"
								checked={live}
								onChange={(event) => setLive(event.currentTarget.checked)}
							/>

							{detail.pending_input && (
								<Button
									size="sm"
									leftSection={<LuHourglass size={15} />}
									onClick={() => setInputOpened(true)}
								>
									Provide input
								</Button>
							)}
							{actions.includes('pause') && (
								<Button
									size="sm"
									variant="default"
									leftSection={<LuPause size={15} />}
									loading={pauseState.isLoading}
									disabled={busy}
									onClick={() => perform('pause run', () => pauseRun(detail.id).unwrap())}
								>
									Pause
								</Button>
							)}
							{actions.includes('resume') && (
								<Button
									size="sm"
									variant="default"
									leftSection={<LuPlay size={15} />}
									loading={resumeState.isLoading}
									disabled={busy}
									onClick={() => perform('resume run', () => resumeRun(detail.id).unwrap())}
								>
									Resume
								</Button>
							)}
							{canRollback && (
								<Button
									size="sm"
									variant="default"
									color="grape"
									leftSection={<LuUndo2 size={15} />}
									loading={rollbackState.isLoading}
									disabled={busy}
									onClick={() => openRollback(null)}
								>
									Roll back
								</Button>
							)}
							{actions.includes('stop') && (
								<Button
									size="sm"
									variant="light"
									color="red"
									leftSection={<LuSquare size={14} />}
									loading={stopState.isLoading}
									disabled={busy}
									onClick={() => setStopOpened(true)}
								>
									Stop
								</Button>
							)}

							<Tooltip label={panel.opened.right ? 'Hide node details' : 'Show node details'}>
								<ActionIcon
									variant="default"
									size={30}
									visibleFrom="md"
									aria-label="Toggle node details panel"
									aria-pressed={panel.opened.right}
									onClick={() => panel.toggle('right')}
								>
									<LuPanelRight size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					</Group>
				</div>

				<div className={classes.body}>
					<Stack gap="md" className={classes.bodyInner}>
						<WorkflowRunSummary
							detail={detail}
							progress={progress}
							currentNode={currentNode}
							elapsedMs={elapsedMs}
						/>

						{actionError && (
							<Alert
								color="red"
								icon={<LuTriangleAlert size={16} />}
								p="sm"
								withCloseButton
								onClose={() => setActionError(null)}
							>
								<Text fz="xs">{actionError}</Text>
							</Alert>
						)}

						{detail.error && (
							<Alert color="red" icon={<LuTriangleAlert size={16} />} title="Run failed" p="sm">
								<Text fz="xs" className={classes.mono}>
									{detail.error}
								</Text>
							</Alert>
						)}
						{!detail.error && detail.waiting_reason && (
							<Alert color="yellow" icon={<LuHourglass size={16} />} p="sm">
								{detail.pending_input ? (
									<Text fz="xs">
										Waiting for input on{' '}
										<strong>{pendingNode?.name ?? detail.pending_input.node_id}</strong>
										<Text span fz="xs" c="dimmed">
											{' · '}
											{detail.pending_input.channel} →{' '}
											{detail.pending_input.context_path || '(root)'}
										</Text>
									</Text>
								) : (
									<Text fz="xs">{formatWaitingReason(detail.waiting_reason)}</Text>
								)}
							</Alert>
						)}

						<Card padding={0} withBorder className={classes.main}>
							<Tabs defaultValue="graph" className={classes.tabs} keepMounted={false}>
								<Tabs.List className={classes.tabsList}>
									<Tabs.Tab value="graph">Execution</Tabs.Tab>
									<Tabs.Tab value="context">Context</Tabs.Tab>
									<Tabs.Tab value="raw">Raw status</Tabs.Tab>
								</Tabs.List>

								<Tabs.Panel value="graph" className={classes.tabPanel}>
									{timelineMode !== 'full' && (
										<div className={classes.canvas}>
											<ReactFlowProvider>
												<WorkflowRunGraph
													definition={definition}
													detail={detail}
													debug={debug}
													selectedNodeId={selectedNodeId}
													onSelect={selectNode}
												/>
											</ReactFlowProvider>
										</div>
									)}
									<div className={classes.timeline} data-mode={timelineMode}>
										<Group justify="space-between" px="xs" py={4} wrap="nowrap">
											<Group gap={6} wrap="nowrap">
												<Tooltip
													label={
														timelineMode === 'collapsed'
															? 'Expand timeline'
															: 'Collapse timeline'
													}
												>
													<ActionIcon
														variant="subtle"
														color="gray"
														size="sm"
														aria-label="Toggle timeline"
														aria-expanded={timelineMode !== 'collapsed'}
														onClick={() =>
															setTimelineMode((mode) =>
																mode === 'collapsed' ? 'normal' : 'collapsed',
															)
														}
													>
														{timelineMode === 'collapsed' ? (
															<LuChevronUp size={14} />
														) : (
															<LuChevronDown size={14} />
														)}
													</ActionIcon>
												</Tooltip>
												<Text fz={11} fw={600} c="dimmed" tt="uppercase" lts={0.4}>
													Timeline
												</Text>
											</Group>
											<Group gap={6} wrap="nowrap">
												<Text fz={11} c="dimmed">
													{timeline.entries.length} occurrences
												</Text>
												<Tooltip
													label={
														timelineMode === 'full'
															? 'Show node graph'
															: 'Full height (hides node graph)'
													}
												>
													<ActionIcon
														variant="subtle"
														color="gray"
														size="sm"
														aria-label="Toggle full-height timeline"
														aria-pressed={timelineMode === 'full'}
														onClick={() =>
															setTimelineMode((mode) =>
																mode === 'full' ? 'normal' : 'full',
															)
														}
													>
														{timelineMode === 'full' ? (
															<LuMinimize2 size={13} />
														) : (
															<LuMaximize2 size={13} />
														)}
													</ActionIcon>
												</Tooltip>
											</Group>
										</Group>
										{timelineMode !== 'collapsed' && (
											<WorkflowRunTimeline
												timeline={timeline}
												fill={timelineMode === 'full'}
												selectedNodeId={selectedNodeId}
												onSelect={selectNode}
											/>
										)}
									</div>
								</Tabs.Panel>

								<Tabs.Panel value="context" className={classes.tabPanelScroll}>
									<WorkflowRunContextPanel
										context={context}
										editable={detail.status === 'paused'}
										onReplace={(next, reason) =>
											perform('replace context', () =>
												replaceContext({ id: detail.id, context: next, reason }).unwrap(),
											)
										}
									/>
								</Tabs.Panel>

								<Tabs.Panel value="raw" className={classes.tabPanelScroll}>
									<Stack gap="xs" p="md">
										<Text fz="xs" c="dimmed">
											GET /v1/workflow/instance/{detail.id}/status
										</Text>
										<WorkflowRunJsonView value={detail} maxHeight={480} />
									</Stack>
								</Tabs.Panel>
							</Tabs>
						</Card>
					</Stack>
				</div>

				<WorkflowRunInputModal
					pending={inputOpened ? detail.pending_input : null}
					onClose={() => setInputOpened(false)}
					onSubmit={async (payload) => {
						try {
							await provideInput({ id: detail.id, payload }).unwrap();
						} catch (error) {
							throw new Error(errorMessage(error, 'Failed to deliver input'));
						}
					}}
				/>

				<WorkflowRunRollbackModal
					opened={rollbackOpened}
					targets={rollbackTargets}
					initialNodeId={rollbackFrom}
					onClose={() => setRollbackOpened(false)}
					onConfirm={(nodeId, reason) => {
						const occurrence = detail.nodes[nodeId];
						if (!occurrence) return;
						selectNode(nodeId);
						perform('roll back run', () =>
							rollbackRun({
								id: detail.id,
								targetOccurrenceId: occurrence.occurrence_id,
								reason,
							}).unwrap(),
						);
					}}
				/>

				<Modal opened={stopOpened} onClose={() => setStopOpened(false)} title="Stop this run?" centered>
					<Stack gap="md">
						<Text fz="sm">
							{definition.name} will be stopped and its active node cancelled. Stopped runs can't be
							resumed.
						</Text>
						<Group justify="flex-end" gap="xs">
							<Button variant="default" onClick={() => setStopOpened(false)}>
								Cancel
							</Button>
							<Button
								color="red"
								onClick={() => {
									setStopOpened(false);
									perform('stop run', () => stopRun(detail.id).unwrap());
								}}
							>
								Stop run
							</Button>
						</Group>
					</Stack>
				</Modal>
			</div>
		</>
	);
};
