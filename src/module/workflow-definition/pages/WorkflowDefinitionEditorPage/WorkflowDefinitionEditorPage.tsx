import React, { useEffect, useRef, useState } from 'react';

import {
	ActionIcon,
	Alert,
	Badge,
	Button,
	Group,
	Loader,
	Modal,
	rem,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import { ReactFlowProvider } from '@xyflow/react';
import { LuCircleAlert, LuPanelLeft, LuPanelRight, LuSave } from 'react-icons/lu';
import { useBlocker, useNavigate, useParams } from 'react-router';

import { useCoreDispatch, useCoreSelector, useCoreStore } from '@core/store';

import { MainLayoutPanel } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel } from '@module/app/hooks';
import { selectPanelOpened } from '@module/app/store';
import { useLazyGetNodeDefinitionQuery } from '@module/node-definition/hooks';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import { WorkflowDefinitionCanvas } from '@module/workflow-definition/components/WorkflowDefinitionCanvas';
import { WorkflowDefinitionInspector } from '@module/workflow-definition/components/WorkflowDefinitionInspector';
import { WorkflowDefinitionPalette } from '@module/workflow-definition/components/WorkflowDefinitionPalette';
import { collectReferenceIds, toEditorDocument } from '@module/workflow-definition/data';
import { useCreateWorkflowDefinitionMutation, useGetWorkflowDefinitionQuery } from '@module/workflow-definition/hooks';
import {
	editorLoaded,
	editorReset,
	editorSaved,
	nodeSelected,
	scopeEntered,
	selectEditorContent,
	selectEditorDirty,
	selectEditorIssues,
	selectEditorLoadedKey,
	selectEditorName,
	selectEditorSourceId,
	selectEditorSourceVersion,
} from '@module/workflow-definition/store';

import classes from './WorkflowDefinitionEditorPage.module.scss';

const DEFINITION_ROUTE = '/app/workflow-definition';

export const WorkflowDefinitionEditorPage: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const store = useCoreStore();
	const panel = useAppLayoutPanel();

	const definition = useGetWorkflowDefinitionQuery(id ?? '', { skip: !id, refetchOnFocus: false });
	const [fetchNodeDefinition] = useLazyGetNodeDefinitionQuery();
	const [createDefinition, createState] = useCreateWorkflowDefinitionMutation();

	const [saveError, setSaveError] = useState<string | null>(null);
	const allowLeave = useRef(false);

	const loadedKey = useCoreSelector(selectEditorLoadedKey);
	const name = useCoreSelector(selectEditorName);
	const dirty = useCoreSelector(selectEditorDirty);
	const issues = useCoreSelector(selectEditorIssues);
	const sourceId = useCoreSelector(selectEditorSourceId);
	const sourceVersion = useCoreSelector(selectEditorSourceVersion);

	const routeKey = id ?? 'new';
	const ready = loadedKey === routeKey;

	const { setOpened: setPanelOpened } = panel;
	useEffect(() => {
		const previous = {
			left: selectPanelOpened(store.getState(), 'left'),
			right: selectPanelOpened(store.getState(), 'right'),
		};
		setPanelOpened('left', true);
		setPanelOpened('right', true);
		return () => {
			setPanelOpened('left', previous.left);
			setPanelOpened('right', previous.right);
			dispatch(editorReset());
		};
	}, [setPanelOpened, store, dispatch]);

	useEffect(() => {
		if (loadedKey === routeKey) return;

		if (!id) {
			dispatch(editorLoaded({ key: routeKey, document: toEditorDocument(null, {}) }));
			return;
		}

		const source = definition.data;
		if (!source || source.id !== id) return;

		let cancelled = false;
		const referenceIds = [...new Set(collectReferenceIds(source.content.nodes))];
		Promise.allSettled(referenceIds.map((refId) => fetchNodeDefinition(refId, true).unwrap())).then((results) => {
			if (cancelled) return;
			const references: Record<string, NodeDefinition> = {};
			for (const result of results) {
				if (result.status === 'fulfilled') references[result.value.id] = result.value;
			}
			dispatch(editorLoaded({ key: routeKey, document: toEditorDocument(source, references) }));
		});

		return () => {
			cancelled = true;
		};
	}, [id, routeKey, loadedKey, definition.data, dispatch, fetchNodeDefinition]);

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			!allowLeave.current && dirty && currentLocation.pathname !== nextLocation.pathname,
	);

	const save = async () => {
		setSaveError(null);
		if (issues.length > 0) {
			const [first] = issues;
			panel.open('right');
			dispatch(nodeSelected(null));
			dispatch(scopeEntered(first.scope));
			return;
		}

		const result = await createDefinition({
			name: name.trim(),
			content: selectEditorContent(store.getState()),
			...(sourceId ? { previous_version_id: sourceId } : {}),
		});
		if ('error' in result) {
			const error = result.error as { message?: string; explain?: string };
			setSaveError(error.explain || error.message || 'Something went wrong while saving');
			return;
		}

		dispatch(editorSaved());
		allowLeave.current = true;
		navigate(`${DEFINITION_ROUTE}/${result.data.id}`, { replace: !sourceId });
		allowLeave.current = false;
	};

	if (id && definition.isError) {
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
			{ready && (
				<>
					<MainLayoutPanel side="left" w={280} visibleFrom="md">
						<WorkflowDefinitionPalette />
					</MainLayoutPanel>
					<MainLayoutPanel side="right" w={360} visibleFrom="md">
						<WorkflowDefinitionInspector />
					</MainLayoutPanel>
				</>
			)}

			<div className={classes.root}>
				<Group justify="space-between" align="center" gap="sm" className={classes.header}>
					<div className={classes.title}>
						<Group gap="xs" wrap="nowrap">
							<Title order={2} fz={rem(18)} lineClamp={1}>
								{name.trim() || (sourceId ? 'Untitled workflow' : 'New workflow definition')}
							</Title>
							{sourceVersion && (
								<Badge size="sm" color="gray">
									v{sourceVersion}
								</Badge>
							)}
							{dirty && (
								<Badge size="sm" color="orange">
									Unsaved
								</Badge>
							)}
						</Group>
						<Text fz={rem(12)} c="dimmed" truncate>
							Drag nodes from the left, connect handles on the canvas, configure on the right
						</Text>
					</div>
					<Group gap="xs">
						<Tooltip label={panel.opened.left ? 'Hide nodes' : 'Show nodes'}>
							<ActionIcon
								variant="default"
								size="lg"
								visibleFrom="md"
								aria-label="Toggle nodes panel"
								aria-pressed={panel.opened.left}
								onClick={() => panel.toggle('left')}
							>
								<LuPanelLeft size={16} />
							</ActionIcon>
						</Tooltip>
						<Tooltip label={panel.opened.right ? 'Hide settings' : 'Show settings'}>
							<ActionIcon
								variant="default"
								size="lg"
								visibleFrom="md"
								aria-label="Toggle settings panel"
								aria-pressed={panel.opened.right}
								onClick={() => panel.toggle('right')}
							>
								<LuPanelRight size={16} />
							</ActionIcon>
						</Tooltip>
						<Button variant="default" onClick={() => navigate(DEFINITION_ROUTE)}>
							Cancel
						</Button>
						<Tooltip
							label={`${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to fix`}
							disabled={issues.length === 0}
						>
							<Button
								leftSection={<LuSave size={16} />}
								loading={createState.isLoading}
								disabled={!ready}
								onClick={save}
							>
								{sourceVersion ? `Save as v${sourceVersion + 1}` : 'Save'}
							</Button>
						</Tooltip>
					</Group>
				</Group>

				{saveError && (
					<Alert
						color="red"
						variant="light"
						mx="md"
						mb="sm"
						title="Couldn't save workflow definition"
						withCloseButton
						onClose={() => setSaveError(null)}
					>
						{saveError}
					</Alert>
				)}

				<div className={classes.canvas}>
					{ready ? (
						<WorkflowDefinitionCanvas />
					) : (
						<Stack align="center" justify="center" h="100%">
							<Loader size="sm" color="gray" />
						</Stack>
					)}
				</div>
			</div>

			<Modal
				opened={blocker.state === 'blocked'}
				onClose={() => blocker.reset?.()}
				title="Discard unsaved changes?"
				centered
			>
				<Text fz="sm" c="dimmed">
					You have changes that haven't been saved. Leaving now will discard them.
				</Text>
				<Group justify="flex-end" mt="lg" gap="xs">
					<Button variant="default" onClick={() => blocker.reset?.()}>
						Keep editing
					</Button>
					<Button color="red" onClick={() => blocker.proceed?.()}>
						Discard
					</Button>
				</Group>
			</Modal>
		</ReactFlowProvider>
	);
};
