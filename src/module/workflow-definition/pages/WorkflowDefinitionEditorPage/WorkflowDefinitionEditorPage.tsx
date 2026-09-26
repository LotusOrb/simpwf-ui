import React, { useEffect, useRef, useState } from 'react';

import { Button, Group, Loader, Modal, Stack, Text, ThemeIcon } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import { ReactFlowProvider } from '@xyflow/react';
import { LuCircleAlert } from 'react-icons/lu';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';

import { useCoreDispatch, useCoreSelector, useCoreStore } from '@core/store';

import { MainLayoutPanel } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel, useAppLayoutPanels } from '@module/app/hooks';
import { useLazyGetNodeDefinitionQuery } from '@module/node-definition/hooks';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import { WorkflowDefinitionCanvas } from '@module/workflow-definition/components/WorkflowDefinitionCanvas';
import { WorkflowDefinitionDeleteModal } from '@module/workflow-definition/components/WorkflowDefinitionDeleteModal';
import { WorkflowDefinitionEditorHeader } from '@module/workflow-definition/components/WorkflowDefinitionEditorHeader';
import { WorkflowDefinitionInspector } from '@module/workflow-definition/components/WorkflowDefinitionInspector';
import { WorkflowDefinitionIssuesPanel } from '@module/workflow-definition/components/WorkflowDefinitionIssuesPanel';
import { WorkflowDefinitionPalette } from '@module/workflow-definition/components/WorkflowDefinitionPalette';
import { WorkflowDefinitionVersionHistory } from '@module/workflow-definition/components/WorkflowDefinitionVersionHistory';
import {
	collectReferenceIds,
	describeSaveError,
	getStartNode,
	toEditorDocument,
	type WorkflowDefinitionErrorCopy,
} from '@module/workflow-definition/data';
import {
	useCreateWorkflowDefinitionMutation,
	useFocusEditorIssue,
	useGetWorkflowDefinitionQuery,
	useListWorkflowDefinitionVersionsQuery,
	useWorkflowDefinitionDelete,
} from '@module/workflow-definition/hooks';
import {
	editorDiscarded,
	editorLoaded,
	editorReset,
	editorSaved,
	selectEditorContent,
	selectEditorDirty,
	selectEditorIssues,
	selectEditorLoadedKey,
	selectEditorName,
	selectEditorSourceId,
} from '@module/workflow-definition/store';
import { useStartWorkflowRunMutation } from '@module/workflow-run/hooks';

import classes from './WorkflowDefinitionEditorPage.module.scss';

const DEFINITION_ROUTE = '/app/workflow-definition';
const RUN_ROUTE = '/app/workflow-run';

export const WorkflowDefinitionEditorPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	// `new?from=<id>` duplicates a definition into a fresh lineage.
	const [searchParams] = useSearchParams();
	const duplicateOf = id ? null : searchParams.get('from');
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const store = useCoreStore();
	const panel = useAppLayoutPanel();
	const focusIssue = useFocusEditorIssue();

	useAppLayoutPanels({
		top: { opened: true },
		left: { opened: true },
		right: { opened: true },
		bottom: { opened: true, collapsed: true },
	});

	const definitionId = id ?? duplicateOf;
	const definition = useGetWorkflowDefinitionQuery(definitionId ?? skipToken, { refetchOnFocus: false });
	const current = id && definition.data?.id === id ? definition.data : null;
	const versions = useListWorkflowDefinitionVersionsQuery(current?.lineage_id ?? skipToken);
	const [fetchNodeDefinition] = useLazyGetNodeDefinitionQuery();
	const [createDefinition, createState] = useCreateWorkflowDefinitionMutation();
	const [startRun, startState] = useStartWorkflowRunMutation();

	const [saveError, setSaveError] = useState<WorkflowDefinitionErrorCopy | null>(null);
	const [startError, setStartError] = useState<string | null>(null);
	const [historyOpened, setHistoryOpened] = useState(false);
	const [discardOpened, setDiscardOpened] = useState(false);
	const allowLeave = useRef(false);

	const leave = (to: string) => {
		allowLeave.current = true;
		navigate(to);
		allowLeave.current = false;
	};

	const deletion = useWorkflowDefinitionDelete((deleted) => {
		if (deleted.id === id) leave(DEFINITION_ROUTE);
	});

	const loadedKey = useCoreSelector(selectEditorLoadedKey);
	const name = useCoreSelector(selectEditorName);
	const dirty = useCoreSelector(selectEditorDirty);
	const issues = useCoreSelector(selectEditorIssues);
	const sourceId = useCoreSelector(selectEditorSourceId);

	const routeKey = id ?? (duplicateOf ? `new:${duplicateOf}` : 'new');
	const ready = loadedKey === routeKey;
	const startsWithInput = !!current && getStartNode(current.content)?.type === 'input';

	// Versions are listed newest first, so the head of the list is the lineage's latest.
	const latest = versions.currentData?.items[0];

	useEffect(() => () => void dispatch(editorReset()), [dispatch]);

	useEffect(() => {
		if (loadedKey === routeKey) return;

		if (!definitionId) {
			dispatch(editorLoaded({ key: routeKey, document: toEditorDocument(null, {}) }));
			return;
		}

		const source = definition.data;
		if (!source || source.id !== definitionId) return;

		let cancelled = false;
		const referenceIds = [...new Set(collectReferenceIds(source.content.nodes))];
		Promise.allSettled(referenceIds.map((refId) => fetchNodeDefinition(refId, true).unwrap())).then((results) => {
			if (cancelled) return;
			const references: Record<string, NodeDefinition> = {};
			for (const result of results) {
				if (result.status === 'fulfilled') references[result.value.id] = result.value;
			}
			const document = toEditorDocument(source, references);
			dispatch(
				editorLoaded({
					key: routeKey,
					// A duplicate is a new lineage: no `previous_version_id` on save.
					document: id
						? document
						: { ...document, sourceId: null, sourceVersion: null, name: `Copy of ${source.name}` },
				}),
			);
		});

		return () => {
			cancelled = true;
		};
	}, [id, definitionId, routeKey, loadedKey, definition.data, dispatch, fetchNodeDefinition]);

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			!allowLeave.current && dirty && currentLocation.pathname !== nextLocation.pathname,
	);

	const save = async () => {
		setSaveError(null);
		if (issues.length > 0) {
			panel.setCollapsed('bottom', false);
			focusIssue(issues[0]);
			return;
		}

		const result = await createDefinition({
			name: name.trim(),
			content: selectEditorContent(store.getState()),
			...(sourceId ? { previous_version_id: sourceId } : {}),
		});
		if ('error' in result) {
			setSaveError(describeSaveError(result.error));
			return;
		}

		dispatch(editorSaved());
		// Push when editing so "back" returns to the version this one was branched from.
		allowLeave.current = true;
		navigate(`${DEFINITION_ROUTE}/${result.data.id}`, { replace: !sourceId });
		allowLeave.current = false;
	};

	const start = async () => {
		if (!id) return;
		setStartError(null);

		const result = await startRun(id);
		if ('error' in result) {
			const error = result.error as { message?: string; explain?: string };
			setStartError(error.message || error.explain || 'Something went wrong while starting the workflow');
			return;
		}

		navigate(`${RUN_ROUTE}?definition=${id}`);
	};

	if (definitionId && definition.isError) {
		return (
			<Stack align="center" justify="center" gap="xs" h="100%">
				<ThemeIcon size={48} radius="xl" variant="light" color="red">
					<LuCircleAlert size={22} />
				</ThemeIcon>
				<Text fw={600}>Couldn't load this workflow definition</Text>
				<Group gap="xs" mt={4}>
					<Button variant="default" size="xs" onClick={() => navigate(DEFINITION_ROUTE)}>
						Back to list
					</Button>
					<Button variant="default" size="xs" onClick={definition.refetch}>
						Try again
					</Button>
				</Group>
			</Stack>
		);
	}

	return (
		<ReactFlowProvider>
			<MainLayoutPanel side="top">
				<WorkflowDefinitionEditorHeader
					current={current}
					latest={latest}
					ready={ready}
					startsWithInput={startsWithInput}
					saving={createState.isLoading}
					starting={startState.isLoading}
					saveError={saveError}
					startError={startError}
					onSave={save}
					onStart={start}
					onBack={() => navigate(DEFINITION_ROUTE)}
					onDiscard={() => setDiscardOpened(true)}
					onOpenHistory={() => setHistoryOpened(true)}
					onOpenVersion={(versionId) => navigate(`${DEFINITION_ROUTE}/${versionId}`)}
					onDuplicate={(fromId) => navigate(`${DEFINITION_ROUTE}/new?from=${fromId}`)}
					onDelete={deletion.request}
					onDismissSaveError={() => setSaveError(null)}
					onDismissStartError={() => setStartError(null)}
				/>
			</MainLayoutPanel>
			{ready && (
				<>
					<MainLayoutPanel side="left" w={280} drawerBelow="md">
						<WorkflowDefinitionPalette />
					</MainLayoutPanel>
					<MainLayoutPanel side="right" w={360} drawerBelow="md">
						<WorkflowDefinitionInspector />
					</MainLayoutPanel>
					<MainLayoutPanel side="bottom">
						<WorkflowDefinitionIssuesPanel />
					</MainLayoutPanel>
				</>
			)}

			<div className={classes.root}>
				{ready ? (
					<WorkflowDefinitionCanvas />
				) : (
					<Stack align="center" justify="center" h="100%">
						<Loader size="sm" color="gray" />
					</Stack>
				)}
			</div>

			<WorkflowDefinitionVersionHistory
				definition={historyOpened ? current : null}
				viewingId={id}
				onClose={() => setHistoryOpened(false)}
				onDelete={deletion.request}
			/>

			<WorkflowDefinitionDeleteModal
				definition={deletion.pending}
				loading={deletion.loading}
				error={deletion.error}
				onClose={deletion.close}
				onConfirm={deletion.confirm}
			/>

			<Modal opened={discardOpened} onClose={() => setDiscardOpened(false)} title="Discard changes?" centered>
				<Text fz="sm" c="dimmed">
					{sourceId
						? "Everything you've changed since the last save will be undone."
						: "Everything you've changed in this new workflow will be undone."}
				</Text>
				<Group justify="flex-end" mt="lg" gap="xs">
					<Button variant="default" onClick={() => setDiscardOpened(false)}>
						Keep editing
					</Button>
					<Button
						color="red"
						onClick={() => {
							dispatch(editorDiscarded());
							setDiscardOpened(false);
						}}
					>
						Discard changes
					</Button>
				</Group>
			</Modal>

			<Modal
				opened={blocker.state === 'blocked'}
				onClose={() => blocker.reset?.()}
				title="Leave without saving?"
				centered
			>
				<Text fz="sm" c="dimmed">
					You have unsaved changes. If you leave this page, they'll be lost.
				</Text>
				<Group justify="flex-end" mt="lg" gap="xs">
					<Button variant="default" onClick={() => blocker.reset?.()}>
						Stay
					</Button>
					<Button color="red" onClick={() => blocker.proceed?.()}>
						Leave without saving
					</Button>
				</Group>
			</Modal>
		</ReactFlowProvider>
	);
};
