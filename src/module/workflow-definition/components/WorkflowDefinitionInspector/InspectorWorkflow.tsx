import React from 'react';

import { Button, Card, Group, Modal, ScrollArea, Select, Stack, Text, TextInput } from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { LuBraces, LuChevronsUpDown } from 'react-icons/lu';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import {
	contextModeChanged,
	nameChanged,
	selectEditorContent,
	selectEditorContextMode,
	selectEditorName,
	selectEditorNodes,
	selectEditorSourceVersion,
} from '@module/workflow-definition/store';

import { SectionLabel } from './InspectorControls';
import classes from './WorkflowDefinitionInspector.module.scss';

const SERVER_DEFAULT = 'default';

export const InspectorWorkflow: React.FC = () => {
	const dispatch = useCoreDispatch();
	const [jsonOpened, json] = useDisclosure(false);

	const name = useCoreSelector(selectEditorName);
	const contextMode = useCoreSelector(selectEditorContextMode);
	const sourceVersion = useCoreSelector(selectEditorSourceVersion);
	const nodes = useCoreSelector(selectEditorNodes);
	const content = useCoreSelector(selectEditorContent);

	const nodeCount = Object.keys(nodes).length;
	const groupCount = Object.values(nodes).filter((node) => node.config.type === 'group').length;

	return (
		<div className={classes.root}>
			<div className={classes.nodeHeader}>
				<div className={classes.nodeTitle}>
					<Text fw={600}>Workflow settings</Text>
					<Text fz="xs" c="dimmed">
						Select a node on the canvas to configure it
					</Text>
				</div>
			</div>

			<ScrollArea flex={1} type="hover">
				<Stack gap="lg" p="md">
					<TextInput
						label={<SectionLabel required>Name</SectionLabel>}
						placeholder="Order fulfillment"
						value={name}
						onChange={(event) => dispatch(nameChanged(event.currentTarget.value))}
					/>

					<Select
						label={<SectionLabel>Context mode</SectionLabel>}
						description="Snapshotted when an instance starts. Lean keeps less history per node."
						inputWrapperOrder={['label', 'input', 'description']}
						data={[
							{ value: SERVER_DEFAULT, label: 'Server default' },
							{ value: 'full', label: 'Full' },
							{ value: 'lean', label: 'Lean' },
						]}
						value={contextMode ?? SERVER_DEFAULT}
						onChange={(value) =>
							dispatch(
								contextModeChanged(
									value === SERVER_DEFAULT || !value ? null : (value as 'full' | 'lean'),
								),
							)
						}
						rightSection={<LuChevronsUpDown size={14} />}
						allowDeselect={false}
					/>

					<Stack gap="xs">
						<SectionLabel>Summary</SectionLabel>
						<Card shadow="none" padding="sm">
							<Group grow>
								<div className={classes.metric}>
									<Text fw={600}>{nodeCount}</Text>
									<Text fz="xs" c="dimmed">
										Nodes
									</Text>
								</div>
								<div className={classes.metric}>
									<Text fw={600}>{groupCount}</Text>
									<Text fz="xs" c="dimmed">
										Groups
									</Text>
								</div>
								<div className={classes.metric}>
									<Text fw={600}>{sourceVersion ? `v${sourceVersion + 1}` : 'v1'}</Text>
									<Text fz="xs" c="dimmed">
										On save
									</Text>
								</div>
							</Group>
						</Card>
						{sourceVersion && (
							<Text fz="xs" c="dimmed">
								Definitions are immutable. Saving creates v{sourceVersion + 1} from v{sourceVersion}.
							</Text>
						)}
					</Stack>
				</Stack>
			</ScrollArea>

			<div className={classes.footer}>
				<Button fullWidth variant="default" leftSection={<LuBraces size={16} />} onClick={json.open}>
					View JSON
				</Button>
			</div>

			<Modal opened={jsonOpened} onClose={json.close} size="xl" title="Workflow content" centered>
				<CodeEditor language="json" readOnly height={480} value={JSON.stringify({ name, content }, null, 2)} />
			</Modal>
		</div>
	);
};
