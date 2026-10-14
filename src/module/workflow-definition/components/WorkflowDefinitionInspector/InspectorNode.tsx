import React, { useState } from 'react';

import {
	ActionIcon,
	Alert,
	Button,
	CopyButton,
	Fieldset,
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

import { Permission, useCan } from '@core/auth/authorization';
import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import {
	defaultOutputProperty,
	formatRawNode,
	isOutputKey,
	nodeTypeMeta,
	parseRawNode,
	retryOnRecoveryDefault,
	supportsFailure,
	supportsOutputProperty,
	supportsRetryOnRecovery,
	supportsStartDelay,
	supportsTimeout,
} from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import { nodeSelected, nodesRemoved, selectEditorEdges, selectEditorIssues } from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionHookScript } from '@module/workflow-definition/types/WorkflowDefinitionHookScript';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import { ContextTypesProvider, InspectorContextTypesPicker } from './InspectorContextTypes';
import { useContextTypes } from './InspectorContextTypes.context';
import { DurationInput, JsonField, SectionLabel } from './InspectorControls';
import { ConditionsFields, FailureFields, InspectorNodeFields, ParallelStartFields } from './InspectorNodeFields';
import classes from './WorkflowDefinitionInspector.module.scss';

export type NodeTab = 'setup' | 'hooks' | 'advanced' | 'json';

const outputPropertyDescription = (type: WorkflowDefinitionNodeType) =>
	type === 'input'
		? 'Top-level context key where the accepted payload is written. Defaults to the node name in snake_case.'
		: "Top-level context key for this node's output. Defaults to the node name in snake_case.";

interface InspectorNodeProps {
	node: WorkflowDefinitionEditorNode;
	tab: NodeTab;
	onTabChange: (tab: NodeTab) => void;
	/** Debug run whose context types feed the script editors. */
	debugRunId: string | null;
	onDebugRunChange: (runId: string | null) => void;
}

const HookField: React.FC<{
	label: string;
	description: string;
	value: WorkflowDefinitionHookScript | null | undefined;
	onChange: (value: WorkflowDefinitionHookScript | undefined) => void;
}> = ({ label, description, value, onChange }) => {
	const contextTypes = useContextTypes();
	return (
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
					<CodeEditor
						height={130}
						value={value.script}
						onChange={(script) => onChange({ ...value, script })}
						extraLib={contextTypes}
					/>
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
};

const START_DELAY_DESCRIPTION =
	"Wait this long on arrival before the node runs. Repeats on every visit. Doesn't hold a worker.";

type StartDelayMode = 'inherit' | 'override' | 'disable';

/**
 * Inline nodes only set or clear a delay. References have three states, matching the engine: omitted inherits the
 * library's delay, a string overrides it and null disables it.
 */
const StartDelayField: React.FC<{ node: WorkflowDefinitionEditorNode }> = ({ node }) => {
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const value = node.config.start_delay;
	// Override with an empty input has nothing to store yet, so the choice is remembered here until a value is typed.
	const [overriding, setOverriding] = useState(typeof value === 'string');

	if (!node.config.node_definition_id) {
		return (
			<DurationInput
				label={<SectionLabel>Start delay</SectionLabel>}
				description={START_DELAY_DESCRIPTION}
				inputWrapperOrder={['label', 'input', 'description', 'error']}
				placeholder="None"
				value={value}
				onChange={(start_delay) => patch({ start_delay })}
			/>
		);
	}

	const mode: StartDelayMode =
		typeof value === 'string' ? 'override' : value === null ? 'disable' : overriding ? 'override' : 'inherit';
	const changeMode = (next: StartDelayMode) => {
		setOverriding(next === 'override');
		if (next === 'inherit') patch({ start_delay: undefined });
		else if (next === 'disable') patch({ start_delay: null });
		else if (typeof value !== 'string') patch({ start_delay: undefined });
	};

	return (
		<Stack gap={6}>
			<div>
				<SectionLabel>Start delay</SectionLabel>
				<Text fz="xs" c="dimmed">
					{START_DELAY_DESCRIPTION}
				</Text>
			</div>
			<SegmentedControl
				size="xs"
				value={mode}
				onChange={(next) => changeMode(next as StartDelayMode)}
				data={[
					{ label: 'Inherit', value: 'inherit' },
					{ label: 'Override', value: 'override' },
					{ label: 'Disable', value: 'disable' },
				]}
			/>
			{mode === 'override' && (
				<DurationInput
					aria-label="Start delay"
					description="Leave empty to inherit the library's delay"
					inputWrapperOrder={['input', 'description', 'error']}
					placeholder="15s"
					value={value}
					onChange={(start_delay) => patch({ start_delay })}
				/>
			)}
			{mode === 'disable' && (
				<Text fz="xs" c="dimmed">
					Runs immediately, even if the library definition sets a delay.
				</Text>
			)}
		</Stack>
	);
};

const RawJsonField: React.FC<{ node: WorkflowDefinitionEditorNode }> = ({ node }) => {
	const { replaceRaw } = useWorkflowDefinitionEditorNodeActions(node.id);
	const edges = useCoreSelector(selectEditorEdges);
	const [text, setText] = useState(() => formatRawNode(node, edges));
	const [error, setError] = useState<string>();

	const onChange = (next: string) => {
		setText(next);
		const parsed = parseRawNode(node, edges, next);
		if (!parsed.ok) return setError(parsed.error);
		setError(undefined);
		replaceRaw(parsed.config, parsed.branches);
	};

	return (
		<CodeEditor
			language="json"
			label={<SectionLabel>Node JSON</SectionLabel>}
			description="Valid changes apply as you type. Routing (next node, failure, branch targets, join) stays on the canvas."
			height={420}
			value={text}
			onChange={onChange}
			error={error}
		/>
	);
};

export const InspectorNode: React.FC<InspectorNodeProps> = ({
	node,
	tab,
	onTabChange,
	debugRunId,
	onDebugRunChange,
}) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const nodeIssues = useCoreSelector(selectEditorIssues).filter((issue) => issue.nodeId === node.id);
	const issues = nodeIssues.filter((issue) => issue.severity !== 'warning');
	const warnings = nodeIssues.filter((issue) => issue.severity === 'warning');
	const canEdit = useCan(Permission.DefinitionsWrite);

	const { config } = node;
	const meta = nodeTypeMeta[config.type];
	const isReference = !!config.node_definition_id;
	// Tabs whose script editors see `context`.
	const scripted =
		tab === 'hooks' ||
		(tab === 'setup' &&
			(config.type === 'script' || config.type === 'conditions' || config.type === 'parallel_end'));

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

			<ContextTypesProvider debugRunId={debugRunId} nodeId={node.id}>
				<ScrollArea flex={1} type="hover">
					<Fieldset variant="unstyled" disabled={!canEdit}>
						<Stack gap="lg" p="md">
							{scripted && (
								<InspectorContextTypesPicker
									nodeId={node.id}
									debugRunId={debugRunId}
									onChange={onDebugRunChange}
								/>
							)}

							{issues.length > 0 && (
								<Alert
									color="red"
									variant="light"
									p="xs"
									title={`${issues.length} to fix before saving`}
								>
									<List size="xs" spacing={2}>
										{issues.map((issue) => (
											<List.Item key={issue.message}>{issue.message}</List.Item>
										))}
									</List>
								</Alert>
							)}
							{warnings.length > 0 && (
								<Alert color="yellow" variant="light" p="xs" title="Worth a look">
									<List size="xs" spacing={2}>
										{warnings.map((issue) => (
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
									{supportsOutputProperty(config.type) && (
										<TextInput
											label={<SectionLabel>Output property</SectionLabel>}
											description={outputPropertyDescription(config.type)}
											inputWrapperOrder={['label', 'input', 'description', 'error']}
											placeholder={
												defaultOutputProperty(config) ??
												(config.type === 'input' ? 'payload' : 'result')
											}
											value={config.output_property ?? ''}
											onChange={(event) =>
												patch({ output_property: event.currentTarget.value || undefined })
											}
											error={
												config.type === 'input' &&
												config.output_property &&
												!isOutputKey(config.output_property)
													? 'Use a bare key like payload'
													: undefined
											}
										/>
									)}

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
														Behavior comes from the node library. Only routing, hooks and
														output can be changed here.
													</Text>
												</div>
											</Group>
											{config.type === 'conditions' && <ConditionsFields node={node} />}
											{config.type === 'parallel_start' && node.branches.length > 0 && (
												<ParallelStartFields node={node} />
											)}
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
									{supportsStartDelay(config.type) && <StartDelayField node={node} />}
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
												checked={
													config.retry_on_recovery ?? retryOnRecoveryDefault(config.type)
												}
												onChange={(event) =>
													patch({ retry_on_recovery: event.currentTarget.checked })
												}
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
										styles={{
											input: { fontFamily: 'var(--mantine-font-family-monospace)', fontSize: 12 },
										}}
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
					</Fieldset>
				</ScrollArea>
			</ContextTypesProvider>

			{canEdit && (
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
			)}
		</div>
	);
};
