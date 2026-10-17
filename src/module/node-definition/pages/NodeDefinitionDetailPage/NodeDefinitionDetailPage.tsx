import React, { useEffect, useRef, useState } from 'react';

import { Button, Drawer, Group, Loader, Modal, Stack, Text, ThemeIcon } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import { ReactFlowProvider } from '@xyflow/react';
import { LuCircleAlert } from 'react-icons/lu';
import { useBlocker, useNavigate, useParams, useSearchParams } from 'react-router';

import { Permission, useCan } from '@core/auth/authorization';
import { useCoreDispatch, useCoreSelector, useCoreStore } from '@core/store';

import { useNavigateBack } from '@common/hooks/useNavigateBack';

import { MainLayoutPanel } from '@module/app/components/AppMainLayout';
import { useAppLayoutPanel, useAppLayoutPanels } from '@module/app/hooks';
import { NodeDefinitionDeleteModal } from '@module/node-definition/components/NodeDefinitionDeleteModal';
import { NodeDefinitionEditorHeader } from '@module/node-definition/components/NodeDefinitionEditorHeader';
import { NodeDefinitionTypePicker } from '@module/node-definition/components/NodeDefinitionTypePicker';
import { NodeDefinitionVersionHistory } from '@module/node-definition/components/NodeDefinitionVersionHistory';
import {
	describeNodeDefinitionSaveError,
	NODE_DEFINITION_ROUTE,
	nodeDefinitionLink,
	type NodeDefinitionErrorCopy,
} from '@module/node-definition/data';
import {
	useCreateNodeDefinitionMutation,
	useGetNodeDefinitionQuery,
	useListNodeDefinitionVersionPagesInfiniteQuery,
	useNodeDefinitionDelete,
} from '@module/node-definition/hooks';
import { NodeTypeCatalogGate } from '@module/node-type/components/NodeTypeCatalogGate';
import { selectNodeTypeCatalog } from '@module/node-type/data';
import { useNotify } from '@module/notification/hooks';
import { WorkflowDefinitionCanvas } from '@module/workflow-definition/components/WorkflowDefinitionCanvas';
import { WorkflowDefinitionInspector } from '@module/workflow-definition/components/WorkflowDefinitionInspector';
import { WorkflowDefinitionIssuesPanel } from '@module/workflow-definition/components/WorkflowDefinitionIssuesPanel';
import { WorkflowDefinitionPalette } from '@module/workflow-definition/components/WorkflowDefinitionPalette';
import { newNodeEditorDocument, toNodeEditorDocument } from '@module/workflow-definition/data';
import { useFocusEditorIssue } from '@module/workflow-definition/hooks';
import {
	editorDiscarded,
	editorLoaded,
	editorReset,
	editorSaved,
	selectEditorBlockingIssues,
	selectEditorDirty,
	selectEditorLoadedKey,
	selectEditorNode,
	selectEditorNodeDefinition,
	selectNodeDefinitionContent,
} from '@module/workflow-definition/store';

import classes from './NodeDefinitionDetailPage.module.scss';

const VERSION_PAGE_SIZE = 20;

// Shares the workflow editor's store, so the key says which kind of document is loaded.
const editorKey = (id: string | undefined, newType: string | null) =>
	id ? `node-definition:${id}` : newType ? `node-definition:new:${newType}` : null;

/**
 * A node definition on the workflow editor's canvas: its node alone, or a group definition's inner graph. `new`
 * asks for the type first (`new?type=<type>`), since the type is fixed for the lineage and shapes the editor. Both
 * need the engine's node type catalog, so nothing opens until it's in.
 */
export const NodeDefinitionDetailPage: React.FC = () => (
	<NodeTypeCatalogGate>
		<NodeDefinitionEditor />
	</NodeTypeCatalogGate>
);

const NodeDefinitionEditor: React.FC = () => {
	const { id } = useParams<{ id: string }>();
	const [searchParams, setSearchParams] = useSearchParams();
	const newType = id ? null : searchParams.get('type');
	const navigate = useNavigate();
	const navigateBack = useNavigateBack(NODE_DEFINITION_ROUTE);
	const dispatch = useCoreDispatch();
	const store = useCoreStore();
	const panel = useAppLayoutPanel();
	const focusIssue = useFocusEditorIssue();
	const notify = useNotify();
	// Without definitions:write the editor is view-only: no palette, no save, no delete.
	const canEdit = useCan(Permission.DefinitionsWrite);

	// The palette only opens once the definition turns out to be a group (see below).
	useAppLayoutPanels({
		top: { opened: true },
		left: { opened: false },
		right: { opened: true },
		bottom: { opened: true, collapsed: true },
	});

	const definition = useGetNodeDefinitionQuery(id ?? skipToken, { refetchOnFocus: false });
	const current = id && definition.data?.id === id ? definition.data : null;
	const catalog = useCoreSelector(selectNodeTypeCatalog);
	// Same cache entry as the history drawer; its head is the lineage's latest.
	const versions = useListNodeDefinitionVersionPagesInfiniteQuery(
		{ lineageId: current?.lineage_id ?? '', perPage: VERSION_PAGE_SIZE },
		{ skip: !current },
	);
	const latest = versions.currentData?.pages[0]?.items[0];
	const type = current?.type ?? newType;
	const hasPalette = canEdit && type === 'group';

	const [createDefinition, createState] = useCreateNodeDefinitionMutation();
	const [saveError, setSaveError] = useState<NodeDefinitionErrorCopy | null>(null);
	// Keyed by version, so opening another version closes the drawer it was opened from.
	const [historyFor, setHistoryFor] = useState<string | null>(null);
	const [discardOpened, setDiscardOpened] = useState(false);
	const allowLeave = useRef(false);

	const leave = (to: string, options?: { replace?: boolean }) => {
		allowLeave.current = true;
		navigate(to, options);
		allowLeave.current = false;
	};

	const deletion = useNodeDefinitionDelete((deleted) => {
		if (deleted.id !== id) return;
		// Fall back to another version of the lineage, or the library when this was the only one.
		const next = versions.currentData?.pages.flatMap((page) => page.items).find((item) => item.id !== id);
		leave(next ? nodeDefinitionLink(next.id) : NODE_DEFINITION_ROUTE, { replace: true });
	});

	const loadedKey = useCoreSelector(selectEditorLoadedKey);
	const dirty = useCoreSelector(selectEditorDirty);
	const issues = useCoreSelector(selectEditorBlockingIssues);
	const routeKey = editorKey(id, newType);
	const ready = !!routeKey && loadedKey === routeKey;

	useEffect(() => () => void dispatch(editorReset()), [dispatch]);

	useEffect(() => {
		if (!routeKey || ready) return;
		if (current) {
			dispatch(editorLoaded({ key: routeKey, document: toNodeEditorDocument(current) }));
		} else if (newType) {
			dispatch(editorLoaded({ key: routeKey, document: newNodeEditorDocument(newType, catalog) }));
		}
	}, [routeKey, ready, current, newType, catalog, dispatch]);

	// Opened once per version, so the user's own toggle sticks; closed for a type with nothing to add.
	const paletteShownFor = useRef<string | null>(null);
	const { open: openPanel, close: closePanel } = panel;
	useEffect(() => {
		if (!ready || paletteShownFor.current === routeKey) return;
		paletteShownFor.current = routeKey;
		if (hasPalette) openPanel('left');
		else closePanel('left');
	}, [routeKey, ready, hasPalette, openPanel, closePanel]);

	const blocker = useBlocker(
		({ currentLocation, nextLocation }) =>
			!allowLeave.current &&
			dirty &&
			// The search holds a new definition's type, so going back to the type picker leaves the draft too.
			(currentLocation.pathname !== nextLocation.pathname || currentLocation.search !== nextLocation.search),
	);

	const save = async () => {
		setSaveError(null);
		const rootId = selectEditorNodeDefinition(store.getState())?.rootId;
		if (!type || !rootId) return;
		if (issues.length > 0) {
			panel.setCollapsed('bottom', false);
			focusIssue(issues[0]);
			return;
		}

		// The definition's own node carries its name; see toNodeEditorDocument.
		const state = store.getState();
		const result = await createDefinition({
			name: selectEditorNode(state, rootId)?.config.name.trim() ?? '',
			type,
			content: selectNodeDefinitionContent(state),
			...(current ? { previous_version_id: current.id } : {}),
		});
		if ('error' in result) {
			setSaveError(describeNodeDefinitionSaveError(result.error));
			return;
		}

		dispatch(editorSaved());
		notify.success({
			title: 'Node definition saved',
			message: `${result.data.name} v${result.data.version} saved`,
			link: nodeDefinitionLink(result.data.id),
		});
		// Pushed so "back" returns to the version this one was made from; a new one replaces its draft.
		leave(nodeDefinitionLink(result.data.id), { replace: !current });
	};

	if (id && definition.isError && !current) {
		return (
			<Stack align="center" justify="center" gap="xs" h="100%">
				<ThemeIcon size={48} radius="xl" variant="light" color="red">
					<LuCircleAlert size={22} />
				</ThemeIcon>
				<Text fw={600}>Couldn't load this node definition</Text>
				<Group gap="xs" mt={4}>
					<Button variant="default" size="xs" onClick={navigateBack}>
						Back to library
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
				<NodeDefinitionEditorHeader
					current={current}
					latest={latest}
					ready={ready}
					saving={createState.isLoading}
					saveError={saveError}
					onSave={save}
					onBack={navigateBack}
					onDiscard={() => setDiscardOpened(true)}
					onOpenHistory={() => setHistoryFor(id ?? null)}
					onOpenVersion={(versionId) => navigate(nodeDefinitionLink(versionId))}
					onDelete={deletion.request}
					onDismissSaveError={() => setSaveError(null)}
				/>
			</MainLayoutPanel>
			{ready && (
				<>
					{hasPalette && (
						<MainLayoutPanel side="left" w={280} drawerBelow="md">
							<WorkflowDefinitionPalette />
						</MainLayoutPanel>
					)}
					<MainLayoutPanel side="right" w={360} drawerBelow="md">
						<WorkflowDefinitionInspector />
					</MainLayoutPanel>
					<MainLayoutPanel side="bottom">
						<WorkflowDefinitionIssuesPanel />
					</MainLayoutPanel>
				</>
			)}

			<div className={classes.root}>
				{!id && !newType ? (
					<NodeDefinitionTypePicker onPick={(picked) => setSearchParams({ type: picked })} />
				) : ready ? (
					<WorkflowDefinitionCanvas />
				) : (
					<Stack align="center" justify="center" h="100%">
						<Loader size="sm" color="gray" />
					</Stack>
				)}
			</div>

			<Drawer
				opened={historyFor === id && !!current}
				onClose={() => setHistoryFor(null)}
				position="right"
				size="md"
				title={
					<div>
						<Text fw={600}>Version history</Text>
						<Text fz="xs" c="dimmed" lineClamp={1}>
							{current?.name} · most recent first
						</Text>
					</div>
				}
			>
				{current && (
					<NodeDefinitionVersionHistory
						lineageId={current.lineage_id}
						viewingId={current.id}
						onDelete={canEdit ? deletion.request : undefined}
					/>
				)}
			</Drawer>

			<NodeDefinitionDeleteModal
				definition={deletion.pending}
				loading={deletion.loading}
				error={deletion.error}
				onClose={deletion.close}
				onConfirm={deletion.confirm}
			/>

			<Modal opened={discardOpened} onClose={() => setDiscardOpened(false)} title="Discard changes?" centered>
				<Text fz="sm" c="dimmed">
					Everything you've changed since the last save will be undone.
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
