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
	Text,
	TextInput,
	ThemeIcon,
	Tooltip,
} from '@mantine/core';
import { LuCheck, LuCopy, LuLibrary, LuTrash2, LuX } from 'react-icons/lu';

import { Permission, useCan } from '@core/auth/authorization';
import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import { nodeTypeMetaOf, nodeTypeSchema, openNodeSchema, selectNodeTypeCatalog } from '@module/node-type/data';
import {
	defaultOutputProperty,
	formatRawNode,
	parseRawNode,
	supportsFailure,
	supportsOutputProperty,
	supportsStartDelay,
} from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import {
	nodeSelected,
	nodesRemoved,
	selectEditorEdges,
	selectEditorIssues,
	selectEditorNodeDefinition,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import { ContextTypesProvider, InspectorContextTypesStatus } from './InspectorContextTypes';
import { DurationInput, JsonField, SectionLabel } from './InspectorControls';
import { InspectorSchemaFields } from './InspectorSchemaFields';
import { hasScriptField, nodeFormKeys } from './InspectorSchemaFields.utils';
import {
	ConditionsFields,
	FailureFields,
	InspectorStructuralFields,
	ParallelStartFields,
} from './InspectorStructuralFields';
import classes from './WorkflowDefinitionInspector.module.scss';

export type NodeTab = 'setup' | 'hooks' | 'advanced' | 'json';

const outputPropertyDescription = (type: WorkflowDefinitionNodeType) =>
	type === 'input'
		? 'Top-level context key where the accepted payload is written. Defaults to the node name in snake_case.'
		: "Top-level context key for this node's output. Defaults to the node name in snake_case.";

interface InspectorNodeProps {
	node: WorkflowDefinitionEditorNode;
	/** The node a node definition is made of: always shown, never closed or deleted. */
	isDefinitionRoot?: boolean;
	tab: NodeTab;
	onTabChange: (tab: NodeTab) => void;
}

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

const RawJsonField: React.FC<{ node: WorkflowDefinitionEditorNode; jsonSchema?: object }> = ({ node, jsonSchema }) => {
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
			jsonSchema={jsonSchema}
		/>
	);
};

const ALL_TABS: { label: string; value: NodeTab }[] = [
	{ label: 'Setup', value: 'setup' },
	{ label: 'Hooks', value: 'hooks' },
	{ label: 'Advanced', value: 'advanced' },
	{ label: 'JSON', value: 'json' },
];
const JSON_TAB = ALL_TABS.filter((item) => item.value === 'json');

export const InspectorNode: React.FC<InspectorNodeProps> = ({
	node,
	isDefinitionRoot,
	tab: selectedTab,
	onTabChange,
}) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const nodeIssues = useCoreSelector(selectEditorIssues).filter((issue) => issue.nodeId === node.id);
	const issues = nodeIssues.filter((issue) => issue.severity !== 'warning');
	const warnings = nodeIssues.filter((issue) => issue.severity === 'warning');
	const canEdit = useCan(Permission.DefinitionsWrite);
	const nodeDefinition = useCoreSelector(selectEditorNodeDefinition);

	const catalog = useCoreSelector(selectNodeTypeCatalog);

	const { config } = node;
	const meta = nodeTypeMetaOf(config.type, catalog.byType[config.type]);
	const schema = nodeTypeSchema(catalog, config.type);
	// Without a schema (a custom type registered without one) there's nothing to generate: the node is edited as JSON.
	const jsonOnly = !schema;
	const tab = jsonOnly ? 'json' : selectedTab;
	const isReference = !!config.node_definition_id;
	const setupKeys = nodeFormKeys(schema, 'setup', isReference);
	const outputPropertyError = issues.find((issue) => issue.path === 'output_property')?.message;
	// Tabs whose script editors see `context`.
	const scripted =
		tab === 'hooks' || (tab === 'setup' && (config.type === 'conditions' || hasScriptField(schema, setupKeys)));

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
						{isDefinitionRoot ? `${meta.label} node definition` : meta.label}
					</Text>
				</div>
				{!isDefinitionRoot && (
					<Tooltip label="Close">
						<ActionIcon aria-label="Close node settings" onClick={() => dispatch(nodeSelected(null))}>
							<LuX size={16} />
						</ActionIcon>
					</Tooltip>
				)}
			</div>

			<div className={classes.header}>
				<SegmentedControl
					value={tab}
					onChange={(value) => onTabChange(value as NodeTab)}
					classNames={{ root: classes.segmented, indicator: classes.indicator, label: classes.segmentLabel }}
					data={jsonOnly ? JSON_TAB : ALL_TABS}
				/>
			</div>

			<ContextTypesProvider nodeId={node.id}>
				<ScrollArea flex={1} type="hover">
					<Fieldset variant="unstyled" disabled={!canEdit}>
						<Stack gap="lg" p="md">
							{scripted && <InspectorContextTypesStatus nodeId={node.id} />}

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
									{supportsOutputProperty(config.type, catalog) && (
										<TextInput
											label={<SectionLabel>Output property</SectionLabel>}
											description={outputPropertyDescription(config.type)}
											inputWrapperOrder={['label', 'input', 'description', 'error']}
											placeholder={
												defaultOutputProperty(config, catalog) ??
												(config.type === 'input' ? 'payload' : 'result')
											}
											value={config.output_property ?? ''}
											onChange={(event) =>
												patch({ output_property: event.currentTarget.value || undefined })
											}
											error={outputPropertyError}
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
										<>
											<InspectorStructuralFields node={node} />
											<InspectorSchemaFields key={node.id} node={node} keys={setupKeys} />
										</>
									)}

									{supportsFailure(config.type, catalog) && <FailureFields node={node} />}
								</>
							)}

							{tab === 'hooks' && (
								<InspectorSchemaFields
									key={node.id}
									node={node}
									keys={nodeFormKeys(schema, 'hooks', isReference)}
								/>
							)}

							{tab === 'json' && (
								<RawJsonField
									node={node}
									jsonSchema={
										schema
											? openNodeSchema(schema)
											: (isDefinitionRoot && nodeDefinition?.schema) || undefined
									}
								/>
							)}

							{tab === 'advanced' && (
								<>
									<InspectorSchemaFields
										key={node.id}
										node={node}
										keys={nodeFormKeys(schema, 'advanced', isReference)}
									/>
									{supportsStartDelay(config.type) && <StartDelayField node={node} />}
									<JsonField
										node={node}
										field="metadata"
										label={<SectionLabel>Metadata</SectionLabel>}
										description="Free-form JSON object stored with the node"
									/>
									{/* A node definition's own node has no id of its own: the workflow using it gives one. */}
									{!isDefinitionRoot && (
										<TextInput
											label={<SectionLabel>Node id</SectionLabel>}
											value={node.id}
											readOnly
											styles={{
												input: {
													fontFamily: 'var(--mantine-font-family-monospace)',
													fontSize: 12,
												},
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
									)}
								</>
							)}
						</Stack>
					</Fieldset>
				</ScrollArea>
			</ContextTypesProvider>

			{canEdit && !isDefinitionRoot && (
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
