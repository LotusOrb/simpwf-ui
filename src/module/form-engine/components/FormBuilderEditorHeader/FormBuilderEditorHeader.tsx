import React from 'react';

import { ActionIcon, Alert, Badge, Button, Group, Menu, rem, Text, Title, Tooltip } from '@mantine/core';
import { LuArrowLeft, LuCopy, LuEllipsisVertical, LuNetwork, LuPanelLeft, LuPanelRight, LuSave } from 'react-icons/lu';

import { useAppLayoutPanel } from '@module/app/hooks';
import { FormBuilderModeSwitch } from '@module/form-engine/components/FormBuilder';
import type { Form } from '@module/form-engine/types/Form';
import type { FormBuilderState } from '@module/form-engine/types/FormBuilderState';

import classes from './FormBuilderEditorHeader.module.scss';

interface FormBuilderEditorHeaderProps {
	/** The saved form being edited; absent for a new form or a duplicate. */
	form?: Form;
	builder: FormBuilderState;
	readOnly: boolean;
	saving: boolean;
	saveError: string | null;
	onSave: () => void;
	onBack: () => void;
	onDiscard: () => void;
	onOpenUsage: (form: Form) => void;
	onDuplicate: (form: Form) => void;
	onDismissSaveError: () => void;
}

export const FormBuilderEditorHeader: React.FC<FormBuilderEditorHeaderProps> = ({
	form,
	builder,
	readOnly,
	saving,
	saveError,
	onSave,
	onBack,
	onDiscard,
	onOpenUsage,
	onDuplicate,
	onDismissSaveError,
}) => {
	const panel = useAppLayoutPanel();
	const { draft, dirty, issues } = builder;
	const building = builder.tab === 'build';

	return (
		<div className={classes.root}>
			<Group justify="space-between" align="center" gap="sm">
				<Tooltip label="Back to forms">
					<ActionIcon variant="subtle" color="gray" size="lg" aria-label="Back to forms" onClick={onBack}>
						<LuArrowLeft size={18} />
					</ActionIcon>
				</Tooltip>
				<div className={classes.title}>
					<Group gap="xs" wrap="nowrap">
						<Title order={2} fz={rem(18)} lineClamp={1}>
							{draft.name.trim() || (form ? 'Untitled form' : 'New form')}
						</Title>
						{readOnly && (
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
						{readOnly
							? 'Your role can view this form but not change it'
							: 'Add fields from the left, arrange them in the middle, configure on the right'}
					</Text>
				</div>
				<Group gap="xs">
					<FormBuilderModeSwitch builder={builder} />
					{building && !readOnly && (
						<Tooltip label={panel.opened.left ? 'Hide fields' : 'Show fields'}>
							<ActionIcon
								variant="default"
								size="lg"
								aria-label="Toggle fields panel"
								aria-pressed={panel.opened.left}
								onClick={() => panel.toggle('left')}
							>
								<LuPanelLeft size={16} />
							</ActionIcon>
						</Tooltip>
					)}
					{building && (
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
					)}
					{!readOnly && (
						<>
							{dirty && form && (
								<Button variant="default" onClick={onDiscard}>
									Cancel
								</Button>
							)}
							<Tooltip
								label={`${issues.length} ${issues.length === 1 ? 'issue' : 'issues'} to fix`}
								disabled={issues.length === 0}
							>
								<Button
									leftSection={<LuSave size={16} />}
									loading={saving}
									disabled={!dirty && !!form}
									onClick={onSave}
								>
									{form ? 'Save' : 'Create'}
								</Button>
							</Tooltip>
						</>
					)}
					{form && (
						<Menu position="bottom-end" shadow="md" withinPortal>
							<Menu.Target>
								<ActionIcon variant="default" size="lg" aria-label="More actions">
									<LuEllipsisVertical size={16} />
								</ActionIcon>
							</Menu.Target>
							<Menu.Dropdown>
								<Menu.Item leftSection={<LuNetwork size={14} />} onClick={() => onOpenUsage(form)}>
									Where it's used
								</Menu.Item>
								{!readOnly && (
									<Menu.Item leftSection={<LuCopy size={14} />} onClick={() => onDuplicate(form)}>
										Duplicate
									</Menu.Item>
								)}
							</Menu.Dropdown>
						</Menu>
					)}
				</Group>
			</Group>

			{saveError && (
				<Alert
					color="red"
					variant="light"
					title="Couldn't save the form"
					withCloseButton
					onClose={onDismissSaveError}
				>
					{saveError}
				</Alert>
			)}
		</div>
	);
};
