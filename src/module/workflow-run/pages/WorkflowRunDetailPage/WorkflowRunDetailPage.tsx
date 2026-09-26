import React, { useMemo, useState } from 'react';

import { Button, Center, Group, Loader, Modal, Stack, Text } from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import { LuCircleAlert, LuRefreshCw } from 'react-icons/lu';
import { Link, useParams } from 'react-router';

import { MainLayoutPanel, MainLayoutPanelBar } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel, useAppLayoutPanels } from '@module/app/hooks';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { WorkflowRunDetailHeader } from '@module/workflow-run/components/WorkflowRunDetailHeader';
import { WorkflowRunGraph } from '@module/workflow-run/components/WorkflowRunGraph';
import { WorkflowRunInputModal } from '@module/workflow-run/components/WorkflowRunInputModal';
import { WorkflowRunNodeInspector } from '@module/workflow-run/components/WorkflowRunNodeInspector';
import { WorkflowRunRollbackModal } from '@module/workflow-run/components/WorkflowRunRollbackModal';
import { WorkflowRunSidePanel } from '@module/workflow-run/components/WorkflowRunSidePanel';
import { WorkflowRunSummary } from '@module/workflow-run/components/WorkflowRunSummary';
import { WorkflowRunTimeline } from '@module/workflow-run/components/WorkflowRunTimeline';
import { indexDefinitionNodes } from '@module/workflow-run/data';
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

const errorMessage = (error: unknown, fallback: string): string => {
	const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
	return typeof message === 'string' && message ? message : fallback;
};

export const WorkflowRunDetailPage: React.FC = () => {
	const { id = '' } = useParams<{ id: string }>();

	const panel = useAppLayoutPanel();
	useAppLayoutPanels({
		top: { opened: true },
		left: { opened: false },
		right: { opened: false },
		bottom: { opened: true, collapsed: false },
	});
	const run = useWorkflowRunDetail(id);

	const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
	const [rollbackFrom, setRollbackFrom] = useState<string | null>(null);
	const [rollbackOpened, setRollbackOpened] = useState(false);
	const [inputOpened, setInputOpened] = useState(false);
	const [stopOpened, setStopOpened] = useState(false);
	const [actionError, setActionError] = useState<string | null>(null);

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

	const selectedNode = selectedNodeId ? (nodesById.get(selectedNodeId) ?? null) : null;
	const selectedOccurrence = selectedNodeId ? (detail.nodes[selectedNodeId] ?? null) : null;
	const selectedDebug = selectedOccurrence ? (debug[selectedOccurrence.occurrence_id] ?? null) : null;

	// A run parked on input reports no current node; the parked node is the one in flight.
	const currentNodeId = detail.current_node_id ?? detail.pending_input?.node_id ?? null;
	const currentNode = currentNodeId ? (nodesById.get(currentNodeId) ?? null) : null;
	const pendingNode = detail.pending_input ? (nodesById.get(detail.pending_input.node_id) ?? null) : null;
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
			<MainLayoutPanel side="top">
				<WorkflowRunDetailHeader
					definition={definition}
					detail={detail}
					pendingNode={pendingNode}
					backTo={RUN_LIST_ROUTE}
					live={live}
					onLiveChange={setLive}
					summary={
						<WorkflowRunSummary
							compact
							detail={detail}
							progress={progress}
							currentNode={currentNode}
							elapsedMs={elapsedMs}
						/>
					}
					pending={{
						pause: pauseState.isLoading,
						resume: resumeState.isLoading,
						stop: stopState.isLoading,
						rollback: rollbackState.isLoading,
					}}
					canRollback={canRollback}
					actionError={actionError}
					onDismissActionError={() => setActionError(null)}
					onProvideInput={() => setInputOpened(true)}
					onPause={() => perform('pause run', () => pauseRun(detail.id).unwrap())}
					onResume={() => perform('resume run', () => resumeRun(detail.id).unwrap())}
					onRollback={() => openRollback(null)}
					onStop={() => setStopOpened(true)}
				/>
			</MainLayoutPanel>

			<MainLayoutPanel side="left" w={360} drawerBelow="md">
				<WorkflowRunSidePanel
					detail={detail}
					context={context}
					onReplaceContext={(next, reason) =>
						perform('replace context', () =>
							replaceContext({ id: detail.id, context: next, reason }).unwrap(),
						)
					}
				/>
			</MainLayoutPanel>

			<MainLayoutPanel side="right" w={360} drawerBelow="md">
				<WorkflowRunNodeInspector
					node={selectedNode}
					occurrence={selectedOccurrence}
					debug={selectedDebug}
					canRollback={canRollback && !!selectedOccurrence?.rollbackable}
					onRollback={openRollback}
				/>
			</MainLayoutPanel>

			<MainLayoutPanel side="bottom">
				<MainLayoutPanelBar
					title="Timeline"
					meta={
						<Text fz={11} c="dimmed">
							{timeline.entries.length} occurrences
						</Text>
					}
				>
					<WorkflowRunTimeline timeline={timeline} selectedNodeId={selectedNodeId} onSelect={selectNode} />
				</MainLayoutPanelBar>
			</MainLayoutPanel>

			<div className={classes.root}>
				<ReactFlowProvider>
					<WorkflowRunGraph
						definition={definition}
						detail={detail}
						debug={debug}
						selectedNodeId={selectedNodeId}
						onSelect={selectNode}
					/>
				</ReactFlowProvider>

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
