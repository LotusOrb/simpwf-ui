import React, { useState } from 'react';

import { ActionIcon, Alert, Badge, Button, Group, Loader, Menu, rem, Text, Title, Tooltip } from '@mantine/core';
import {
	LuArrowLeft,
	LuCopy,
	LuEllipsisVertical,
	LuHistory,
	LuPanelLeft,
	LuPanelRight,
	LuPlay,
	LuSave,
	LuTrash2,
} from 'react-icons/lu';

import { useCoreSelector } from '@core/store';

import { useAppLayoutPanel } from '@module/app/hooks';
import type { WorkflowDefinitionErrorCopy } from '@module/workflow-definition/data';
import {
	selectEditorDirty,
	selectEditorIssues,
	selectEditorName,
	selectEditorSourceId,
	selectEditorSourceVersion,
} from '@module/workflow-definition/store';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

import classes from './WorkflowDefinitionEditorHeader.module.scss';

interface WorkflowDefinitionEditorHeaderProps {
	/** The saved version being edited; null for a new or duplicated definition. */
	current: WorkflowDefinition | null;
	/** The newest version of the lineage, when known. */
	latest: WorkflowDefinition | undefined;
	ready: boolean;
	startsWithInput: boolean;
	saving: boolean;
	starting: boolean;
	saveError: WorkflowDefinitionErrorCopy | null;
	startError: string | null;
	onSave: () => void;
	onStart: () => void;
	onBack: () => void;
	onDiscard: () => void;
	onOpenHistory: () => void;
	onOpenVersion: (id: string) => void;
	onDuplicate: (id: string) => void;
	onDelete: (definition: WorkflowDefinition) => void;
	onDismissSaveError: () => void;
	onDismissStartError: () => void;
}

export const WorkflowDefinitionEditorHeader: React.FC<WorkflowDefinitionEditorHeaderProps> = ({
	current,
	latest,
	ready,
	startsWithInput,
	saving,
	starting,
	saveError,
	startError,
	onSave,
	onStart,
	onBack,
	onDiscard,
	onOpenHistory,
	onOpenVersion,
	onDuplicate,
	onDelete,
	onDismissSaveError,
	onDismissStartError,
}) => {
	const panel = useAppLayoutPanel();
	// Keyed by version id so the notice comes back when another version is opened.
	const [dismissedOutdated, setDismissedOutdated] = useState<string | null>(null);

	const name = useCoreSelector(selectEditorName);
	const dirty = useCoreSelector(selectEditorDirty);
	const issues = useCoreSelector(selectEditorIssues);
	const sourceId = useCoreSelector(selectEditorSourceId);
	const sourceVersion = useCoreSelector(selectEditorSourceVersion);

	// The engine numbers a new version `previous + 1` and rejects a duplicate number with 409, so
	// only the latest version can be extended.
	const isLatest = !sourceVersion || !latest || sourceVersion >= latest.version;
	const nextVersion = (sourceVersion ?? 0) + 1;

	return (
		<div className={classes.root}>
			<Group justify="space-between" align="center" gap="sm">
				<Tooltip label="Back to list">
					<ActionIcon variant="subtle" color="gray" size="lg" aria-label="Back to list" onClick={onBack}>
						<LuArrowLeft size={18} />
					</ActionIcon>
				</Tooltip>
				<div className={classes.title}>
					<Group gap="xs" wrap="nowrap">
						<Title order={2} fz={rem(18)} lineClamp={1}>
							{name.trim() || (sourceId ? 'Untitled workflow' : 'New workflow definition')}
						</Title>
						{sourceVersion && (
							<Badge size="sm" className={classes.badge} color="gray">
								v{sourceVersion}
							</Badge>
						)}
						{!!sourceVersion && !!latest && isLatest && (
							<Badge size="sm" className={classes.badge} color="green">
								Latest
							</Badge>
						)}
						{dirty && (
							<Badge size="sm" className={classes.badge} color="orange">
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
							aria-label="Toggle settings panel"
							aria-pressed={panel.opened.right}
							onClick={() => panel.toggle('right')}
						>
							<LuPanelRight size={16} />
						</ActionIcon>
					</Tooltip>
					{dirty && (
						<Button variant="default" onClick={onDiscard}>
							Cancel
						</Button>
					)}
					<Tooltip
						label={
							issues.length > 0
								? `${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to fix`
								: !isLatest
									? `v${nextVersion} already exists — open the latest version to save changes`
									: 'Definitions are immutable — saving publishes a new version.'
						}
						disabled={issues.length === 0 && !sourceId}
					>
						<Button
							leftSection={<LuSave size={16} />}
							loading={saving}
							disabled={!ready || !isLatest}
							onClick={onSave}
						>
							{sourceId ? `Save as v${nextVersion}` : 'Create'}
						</Button>
					</Tooltip>
					{current && (
						<Menu position="bottom-end" shadow="md" withinPortal>
							<Menu.Target>
								<ActionIcon variant="default" size="lg" aria-label="More actions">
									<LuEllipsisVertical size={16} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								{startsWithInput && (
									<Menu.Item
										leftSection={starting ? <Loader size={14} /> : <LuPlay size={14} />}
										disabled={!ready || dirty || starting}
										onClick={onStart}
									>
										Start workflow
										{dirty && (
											<Text fz="xs" c="dimmed">
												Save your changes first
											</Text>
										)}
									</Menu.Item>
								)}
								<Menu.Item leftSection={<LuHistory size={14} />} onClick={onOpenHistory}>
									Version history
								</Menu.Item>
								<Menu.Divider />
								<Menu.Item leftSection={<LuCopy size={14} />} onClick={() => onDuplicate(current.id)}>
									Duplicate
								</Menu.Item>
								<Menu.Divider />
								<Menu.Item
									color="red"
									leftSection={<LuTrash2 size={14} />}
									onClick={() => onDelete(current)}
								>
									Delete this version
								</Menu.Item>
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
							You're viewing v{sourceVersion} — the latest is v{latest.version}. New versions can only be
							saved from the latest; duplicate this one to start a separate workflow from it.
						</Text>
						<Group gap="xs">
							<Button
								size="xs"
								variant="default"
								leftSection={<LuCopy size={14} />}
								onClick={() => onDuplicate(current.id)}
							>
								Duplicate
							</Button>
							<Button size="xs" variant="default" onClick={() => onOpenVersion(latest.id)}>
								Open latest
							</Button>
						</Group>
					</Group>
				</Alert>
			)}

			{saveError && (
				<Alert color="red" variant="light" title={saveError.title} withCloseButton onClose={onDismissSaveError}>
					{saveError.detail}
				</Alert>
			)}

			{startError && (
				<Alert
					color="red"
					variant="light"
					title="Couldn't start workflow"
					withCloseButton
					onClose={onDismissStartError}
				>
					{startError}
				</Alert>
			)}
		</div>
	);
};
