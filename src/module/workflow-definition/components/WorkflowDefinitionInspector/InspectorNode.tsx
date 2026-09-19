import React, { useState } from 'react';

import {
	ActionIcon,
	Alert,
	Button,
	CopyButton,
	Group,
	List,
	ScrollArea,
	SegmentedControl,
	Stack,
	Switch,
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { LuCheck, LuCopy, LuLibrary, LuTrash2, LuX } from 'react-icons/lu';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import {
	formatRawNode,
	nodeTypeMeta,
	parseRawNode,
	supportsFailure,
	supportsOutputProperty,
	supportsRetryOnRecovery,
	supportsTimeout,
} from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import { nodeSelected, nodesRemoved, selectEditorIssues } from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionHookScript } from '@module/workflow-definition/types/WorkflowDefinitionHookScript';

import { DurationInput, JsonField, SectionLabel } from './InspectorControls';
import { ConditionsFields, FailureFields, InspectorNodeFields } from './InspectorNodeFields';
import classes from './WorkflowDefinitionInspector.module.scss';

export type NodeTab = 'setup' | 'hooks' | 'advanced' | 'json';

interface InspectorNodeProps {
	node: WorkflowDefinitionEditorNode;
	tab: NodeTab;
	onTabChange: (tab: NodeTab) => void;
}

const HookField: React.FC<{
	label: string;
	description: string;
	value: WorkflowDefinitionHookScript | null | undefined;
	onChange: (value: WorkflowDefinitionHookScript | undefined) => void;
}> = ({ label, description, value, onChange }) => (
	<Stack gap="xs">
		<Group justify="space-between" wrap="nowrap" align="flex-start">
			<div>
				<SectionLabel>{label}</SectionLabel>
				<Text fz="xs" c="dimmed">
					{description}
				</Text>
			</div>
			<Switch
				aria-label={label}
				checked={!!value}
				onChange={(event) => onChange(event.currentTarget.checked ? { script: '' } : undefined)}
			/>
		</Group>
		{value && (
			<>
				<CodeEditor height={130} value={value.script} onChange={(script) => onChange({ ...value, script })} />
				<DurationInput
					label="Timeout"
					placeholder="Engine default"
					value={value.timeout}
					onChange={(timeout) => onChange({ ...value, timeout })}
				/>
			</>
		)}
	</Stack>
);

const RawJsonField: React.FC<{ node: WorkflowDefinitionEditorNode }> = ({ node }) => {
	const { replaceRaw } = useWorkflowDefinitionEditorNodeActions(node.id);
	const [text, setText] = useState(() => formatRawNode(node));
	const [error, setError] = useState<string>();

	const onChange = (next: string) => {
		setText(next);
		const parsed = parseRawNode(node, next);
		if (!parsed.ok) return setError(parsed.error);
		setError(undefined);
		replaceRaw(parsed.config, parsed.branches);
	};

	return (
		<CodeEditor
			language="json"
			label={<SectionLabel>Node JSON</SectionLabel>}
			description="Valid changes apply as you type. Routing (next node, failure, branch targets) stays on the canvas."
			height={420}
			value={text}
			onChange={onChange}
			error={error}
		/>
	);
};

export const InspectorNode: React.FC<InspectorNodeProps> = ({ node, tab, onTabChange }) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const issues = useCoreSelector(selectEditorIssues).filter((issue) => issue.nodeId === node.id);

	const { config } = node;
	const meta = nodeTypeMeta[config.type];
	const isReference = !!config.node_definition_id;

	return (
		<div className={classes.root}>
			<div className={classes.nodeHeader}>
				<ThemeIcon size={36} variant="light" color={meta.color} radius="md">
					<meta.icon size={18} />
				</ThemeIcon>
				<div className={classes.nodeTitle}>
					<Text fw={600} truncate>
						{config.name || 'Untitled'}
					</Text>
					<Text fz="xs" c="dimmed">
						{meta.label}
					</Text>
				</div>
				<Tooltip label="Close">
					<ActionIcon aria-label="Close node settings" onClick={() => dispatch(nodeSelected(null))}>
						<LuX size={16} />
					</ActionIcon>
				</Tooltip>
			</div>

			<div className={classes.header}>
				<SegmentedControl
					value={tab}
					onChange={(value) => onTabChange(value as NodeTab)}
					classNames={{ root: classes.segmented, indicator: classes.indicator, label: classes.segmentLabel }}
					data={[
						{ label: 'Setup', value: 'setup' },
						{ label: 'Hooks', value: 'hooks' },
						{ label: 'Advanced', value: 'advanced' },
						{ label: 'JSON', value: 'json' },
					]}
				/>
			</div>

			<ScrollArea flex={1} type="hover">
				<Stack gap="lg" p="md">
					{issues.length > 0 && (
						<Alert color="red" variant="light" p="xs" title={`${issues.length} to fix before saving`}>
							<List size="xs" spacing={2}>
								{issues.map((issue) => (
									<List.Item key={issue.message}>{issue.message}</List.Item>
								))}
							</List>
						</Alert>
					)}

					{tab === 'setup' && (
						<>
							<TextInput
								label={<SectionLabel required>Name</SectionLabel>}
								value={config.name}
								onChange={(event) => patch({ name: event.currentTarget.value })}
							/>

							{isReference ? (
								<>
									<Group gap="xs" wrap="nowrap" className={classes.reference}>
										<LuLibrary size={16} />
										<div>
											<Text fz="sm" fw={600}>
												{node.reference
													? `${node.reference.name} v${node.reference.version}`
													: 'Node library'}
											</Text>
											<Text fz="xs" c="dimmed">
												Behavior comes from the node library. Only routing, hooks and output can
												be changed here.
											</Text>
										</div>
									</Group>
									{config.type === 'conditions' && <ConditionsFields node={node} />}
								</>
							) : (
								<InspectorNodeFields node={node} />
							)}

							{supportsFailure(config.type) && <FailureFields node={node} />}
						</>
					)}

					{tab === 'hooks' && (
						<>
							<HookField
								label="Pre-script"
								description="Transforms context before the node runs. Return value is ignored."
								value={config.pre_script}
								onChange={(pre_script) => patch({ pre_script })}
							/>
							<HookField
								label="Post-script"
								description="Runs after the output is merged. The native output is available as `output`."
								value={config.post_script}
								onChange={(post_script) => patch({ post_script })}
							/>
						</>
					)}

					{tab === 'json' && <RawJsonField node={node} />}

					{tab === 'advanced' && (
						<>
							{supportsOutputProperty(config.type) && (
								<TextInput
									label={<SectionLabel>Output property</SectionLabel>}
									description="Top-level context key for this node's output. Defaults to the node id."
									inputWrapperOrder={['label', 'input', 'description']}
									placeholder="result"
									value={config.output_property ?? ''}
									onChange={(event) =>
										patch({ output_property: event.currentTarget.value || undefined })
									}
								/>
							)}
							{supportsTimeout(config.type) && !isReference && (
								<DurationInput
									label={<SectionLabel>Timeout</SectionLabel>}
									description="Defaults to the engine timeout, capped by the engine maximum"
									inputWrapperOrder={['label', 'input', 'description', 'error']}
									placeholder="30s"
									value={config.timeout}
									onChange={(timeout) => patch({ timeout })}
								/>
							)}
							{supportsRetryOnRecovery(config.type) && (
								<Group justify="space-between" wrap="nowrap" align="flex-start">
									<div>
										<SectionLabel>Retry on recovery</SectionLabel>
										<Text fz="xs" c="dimmed">
											Requeue instead of failing when a worker lease expires mid-run
										</Text>
									</div>
									<Switch
										aria-label="Retry on recovery"
										checked={config.retry_on_recovery ?? config.type === 'poller'}
										onChange={(event) => patch({ retry_on_recovery: event.currentTarget.checked })}
									/>
								</Group>
							)}
							<JsonField
								node={node}
								field="metadata"
								label={<SectionLabel>Metadata</SectionLabel>}
								description="Free-form JSON object stored with the node"
							/>
							<TextInput
								label={<SectionLabel>Node id</SectionLabel>}
								value={node.id}
								readOnly
								styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 } }}
								rightSection={
									<CopyButton value={node.id}>
										{({ copied, copy }) => (
											<ActionIcon aria-label="Copy node id" onClick={copy}>
												{copied ? <LuCheck size={14} /> : <LuCopy size={14} />}
											</ActionIcon>
										)}
									</CopyButton>
								}
							/>
						</>
					)}
				</Stack>
			</ScrollArea>

			<div className={classes.footer}>
				<Button
					fullWidth
					variant="default"
					color="red"
					c="red.7"
					leftSection={<LuTrash2 size={16} />}
					onClick={() => dispatch(nodesRemoved([node.id]))}
				>
					Delete node
				</Button>
			</div>
		</div>
	);
};
