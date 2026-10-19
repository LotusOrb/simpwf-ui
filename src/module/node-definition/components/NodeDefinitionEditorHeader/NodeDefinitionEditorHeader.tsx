import React, { useState } from 'react';

import { ActionIcon, Alert, Badge, Button, Group, Menu, rem, Text, Title, Tooltip } from '@mantine/core';
import {
	LuArrowLeft,
	LuEllipsisVertical,
	LuHistory,
	LuPanelLeft,
	LuPanelRight,
	LuSave,
	LuTrash2,
} from 'react-icons/lu';

import { Permission, useCan } from '@core/auth/authorization';
import { useCoreSelector } from '@core/store';

import { useAppLayoutPanel } from '@module/app/hooks';
import { NodeDefinitionTypeBadge } from '@module/node-definition/components/NodeDefinitionTypeBadge';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { NodeDefinitionErrorCopy } from '@module/node-definition/utils';
import {
	selectEditorBlockingIssues,
	selectEditorDirty,
	selectEditorNode,
	selectEditorNodeDefinition,
} from '@module/workflow-definition/store';

import classes from './NodeDefinitionEditorHeader.module.scss';

interface NodeDefinitionEditorHeaderProps {
	/** The version being edited; null while it loads and for a new definition. */
	current: NodeDefinition | null;
	/** The newest version of the lineage, when known. */
	latest: NodeDefinition | undefined;
	ready: boolean;
	saving: boolean;
	saveError: NodeDefinitionErrorCopy | null;
	onSave: () => void;
	onBack: () => void;
	onDiscard: () => void;
	onOpenHistory: () => void;
	onOpenVersion: (id: string) => void;
	onDelete: (definition: NodeDefinition) => void;
	onDismissSaveError: () => void;
}

export const NodeDefinitionEditorHeader: React.FC<NodeDefinitionEditorHeaderProps> = ({
	current,
	latest,
	ready,
	saving,
	saveError,
	onSave,
	onBack,
	onDiscard,
	onOpenHistory,
	onOpenVersion,
	onDelete,
	onDismissSaveError,
}) => {
	const panel = useAppLayoutPanel();
	const canEdit = useCan(Permission.DefinitionsWrite);
	// Keyed by version id so the notice comes back when another version is opened.
	const [dismissedOutdated, setDismissedOutdated] = useState<string | null>(null);

	const nodeDefinition = useCoreSelector(selectEditorNodeDefinition);
	const root = useCoreSelector((state) => selectEditorNode(state, nodeDefinition?.rootId ?? null));
	const dirty = useCoreSelector(selectEditorDirty);
	const issues = useCoreSelector(selectEditorBlockingIssues);

	// The engine numbers a new version `previous + 1` and rejects a duplicate number with 409, so
	// only the latest version can be extended.
	const isLatest = !current || !latest || current.version >= latest.version;
	const nextVersion = (current?.version ?? 0) + 1;
	// Ready without a saved version: a new definition, published as v1.
	const isNew = ready && !current;
	const type = current?.type ?? nodeDefinition?.type;
	// Only a group definition has an inner graph to add nodes to.
	const hasPalette = canEdit && type === 'group';
	const name = (ready ? root?.config.name : current?.name)?.trim();

	return (
		<div className={classes.root}>
			<Group justify="space-between" align="center" gap="sm">
				<Tooltip label="Back to library">
					<ActionIcon variant="subtle" color="gray" size="lg" aria-label="Back to library" onClick={onBack}>
						<LuArrowLeft size={18} />
					</ActionIcon>
				</Tooltip>
				<div className={classes.title}>
					<Group gap="xs" wrap="nowrap">
						<Title order={2} fz={rem(18)} lineClamp={1}>
							{name || (current ? 'Untitled node definition' : 'New node definition')}
						</Title>
						{type && <NodeDefinitionTypeBadge type={type} size="sm" className={classes.badge} />}
						{current && (
							<Badge size="sm" className={classes.badge} color="gray">
								v{current.version}
							</Badge>
						)}
						{!!current && !!latest && isLatest && (
							<Badge size="sm" className={classes.badge} color="green">
								Latest
							</Badge>
						)}
						{!canEdit && (
							<Badge size="sm" className={classes.badge} color="gray" variant="outline">
								View only
							</Badge>
						)}
						{dirty && (
							<Badge size="sm" className={classes.badge} color="orange">
								Unsaved
							</Badge>
						)}
					</Group>
					<Text fz={rem(12)} c="dimmed" truncate>
						{!canEdit
							? 'Your role can view this definition but not change it'
							: !ready && !current
								? 'Pick the node type to start with'
								: hasPalette
									? 'Drag nodes from the left, connect handles on the canvas, configure on the right'
									: 'Configure the node on the right'}
					</Text>
				</div>
				<Group gap="xs">
					{hasPalette && (
						<Tooltip label={panel.opened.left ? 'Hide nodes' : 'Show nodes'}>
							<ActionIcon
								variant="default"
								size="lg"
								aria-label="Toggle nodes panel"
								aria-pressed={panel.opened.left}
								onClick={() => panel.toggle('left')}
							>
								<LuPanelLeft size={16} />
							</ActionIcon>
						</Tooltip>
					)}
					<Tooltip label={panel.opened.right ? 'Hide settings' : 'Show settings'}>
						<ActionIcon
							variant="default"
							size="lg"
							aria-label="Toggle settings panel"
							aria-pressed={panel.opened.right}
							onClick={() => panel.toggle('right')}
						>
							<LuPanelRight size={16} />
						</ActionIcon>
					</Tooltip>
					{canEdit && (current || isNew) && (
						<>
							{dirty && (
								<Button variant="default" onClick={onDiscard}>
									Cancel
								</Button>
							)}
							<Tooltip
								label={
									issues.length > 0
										? `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to fix`
										: isNew
											? 'Publishes v1 of a new node definition'
											: !isLatest
												? `v${nextVersion} already exists — open the latest version to save changes`
												: 'Definitions are immutable — saving publishes a new version. Workflows pinned to this one keep using it.'
								}
							>
								<Button
									leftSection={<LuSave size={16} />}
									loading={saving}
									disabled={!ready || !isLatest}
									onClick={onSave}
								>
									{isNew ? 'Create' : `Save as v${nextVersion}`}
								</Button>
							</Tooltip>
						</>
					)}
					{current && (
						<Menu position="bottom-end" shadow="md" withinPortal>
							<Menu.Target>
								<ActionIcon variant="default" size="lg" aria-label="More actions">
									<LuEllipsisVertical size={16} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item leftSection={<LuHistory size={14} />} onClick={onOpenHistory}>
									Version history
								</Menu.Item>
								{canEdit && (
									<>
										<Menu.Divider />
										<Menu.Item
											color="red"
											leftSection={<LuTrash2 size={14} />}
											onClick={() => onDelete(current)}
										>
											Delete this version
										</Menu.Item>
									</>
								)}
							</Menu.Dropdown>
						</Menu>
					)}
				</Group>
			</Group>

			{ready && current && latest && !isLatest && dismissedOutdated !== current.id && (
				<Alert
					color="yellow"
					variant="light"
					icon={<LuHistory size={16} />}
					withCloseButton
					onClose={() => setDismissedOutdated(current.id)}
				>
					<Group justify="space-between" gap="xs">
						<Text fz="sm">
							You're viewing v{current.version} — the latest is v{latest.version}. New versions can only
							be saved from the latest.
						</Text>
						<Button size="xs" variant="default" onClick={() => onOpenVersion(latest.id)}>
							Open latest
						</Button>
					</Group>
				</Alert>
			)}

			{saveError && (
				<Alert color="red" variant="light" title={saveError.title} withCloseButton onClose={onDismissSaveError}>
					{saveError.detail}
				</Alert>
			)}
		</div>
	);
};
