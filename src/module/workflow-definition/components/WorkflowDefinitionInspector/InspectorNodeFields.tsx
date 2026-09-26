import React from 'react';

import {
	ActionIcon,
	Button,
	Group,
	NumberInput,
	SegmentedControl,
	Select,
	Stack,
	Switch,
	TagsInput,
	Text,
	Textarea,
	TextInput,
	Tooltip,
} from '@mantine/core';
import { LuArrowRight, LuChevronsUpDown, LuPlus, LuTrash2 } from 'react-icons/lu';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import {
	branchHandle,
	HANDLE_FAILURE,
	isContextPath,
	nextBranchKeys,
	outgoingTarget,
	shortId,
} from '@module/workflow-definition/data';
import { useWorkflowDefinitionEditorNodeActions } from '@module/workflow-definition/hooks';
import {
	branchAdded,
	branchChanged,
	branchRemoved,
	failureOutputPropertyChanged,
	jsonDraftChanged,
	scopeEntered,
	selectEditorEdges,
	selectEditorNodes,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionPollerHTTPConfig } from '@module/workflow-definition/types/WorkflowDefinitionPollerHTTPConfig';
import type { WorkflowDefinitionPollerRabbitMQConfig } from '@module/workflow-definition/types/WorkflowDefinitionPollerRabbitMQConfig';
import type { WorkflowDefinitionPollerRedisConfig } from '@module/workflow-definition/types/WorkflowDefinitionPollerRedisConfig';

import { DurationInput, HeadersField, JsonField, SectionLabel } from './InspectorControls';

const HTTP_METHODS = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD'];
const selectIcon = <LuChevronsUpDown size={14} />;

interface FieldsProps {
	node: WorkflowDefinitionEditorNode;
}

const contextPathError = (value: string | undefined) =>
	value && !isContextPath(value) ? 'Use a path like user.name or items[0]' : undefined;

const ScriptFields: React.FC<FieldsProps> = ({ node }) => {
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const { config } = node;

	return (
		<>
			<CodeEditor
				label={<SectionLabel required>Script</SectionLabel>}
				description="Mutate context and return a value. The return value is stored at the output property."
				height={200}
				placeholder={'context.total = context.items.length;\nreturn context.total;'}
				value={config.script ?? ''}
				onChange={(script) => patch({ script })}
			/>
			<TextInput
				label={<SectionLabel>Input data</SectionLabel>}
				description="Context path exposed to the script as `input`"
				inputWrapperOrder={['label', 'input', 'description', 'error']}
				placeholder="order.items"
				value={config.input_data ?? ''}
				onChange={(event) => patch({ input_data: event.currentTarget.value || undefined })}
				error={contextPathError(config.input_data)}
			/>
		</>
	);
};

const ConditionsFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const nodes = useCoreSelector(selectEditorNodes);
	const edges = useCoreSelector(selectEditorEdges);
	const readOnly = !!node.config.node_definition_id;

	const addBranch = () => {
		const [key] = nextBranchKeys(nodes, node.parentId, 1);
		dispatch(branchAdded({ id: node.id, branch: { id: shortId(), key, condition: '' } }));
	};

	return (
		<Stack gap="sm">
			<div>
				<SectionLabel required>Branches</SectionLabel>
				<Text fz="xs" c="dimmed">
					Exactly one condition must return true. Connect each branch handle to its next node. A branch with
					no connection exits the {node.parentId ? 'group' : 'workflow'}.
				</Text>
			</div>

			{node.branches.map((branch, index) => {
				const target = outgoingTarget(edges, node.id, branchHandle(branch.id));
				return (
					<Stack key={branch.id} gap={6} p="xs" bd="1px solid gray.2" bdrs="md">
						<Group gap={6} wrap="nowrap" align="flex-end">
							<TextInput
								size="xs"
								flex={1}
								label="Key"
								placeholder={`branch_${index + 1}`}
								value={branch.key}
								readOnly={readOnly}
								onChange={(event) =>
									dispatch(
										branchChanged({
											id: node.id,
											branchId: branch.id,
											patch: { key: event.currentTarget.value },
										}),
									)
								}
							/>
							{!readOnly && (
								<Tooltip label="Remove branch">
									<ActionIcon
										size="md"
										color="red"
										aria-label={`Remove branch ${branch.key || index + 1}`}
										disabled={node.branches.length <= 2}
										onClick={() => dispatch(branchRemoved({ id: node.id, branchId: branch.id }))}
									>
										<LuTrash2 size={14} />
									</ActionIcon>
								</Tooltip>
							)}
						</Group>
						<Group gap={4} c="dimmed" wrap="nowrap">
							<LuArrowRight size={12} aria-hidden />
							<Text fz="xs" truncate>
								{target ? (nodes[target]?.config.name ?? 'Unknown node') : 'Exits scope'}
							</Text>
						</Group>
						<CodeEditor
							height={80}
							readOnly={readOnly}
							placeholder="return context.amount > 1000;"
							value={branch.condition}
							onChange={(condition) =>
								dispatch(branchChanged({ id: node.id, branchId: branch.id, patch: { condition } }))
							}
						/>
					</Stack>
				);
			})}

			{!readOnly && (
				<Button
					variant="default"
					size="xs"
					leftSection={<LuPlus size={14} />}
					w="fit-content"
					onClick={addBranch}
				>
					Add branch
				</Button>
			)}
		</Stack>
	);
};

const DEFAULT_FORM_SCHEMA = { type: 'object', properties: {} };

const InputFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const { config } = node;
	const hasForm = !!config.form || node.jsonDrafts['form.schema'] !== undefined;

	const toggleForm = (enabled: boolean) => {
		dispatch(jsonDraftChanged({ id: node.id, field: 'form.schema', text: null }));
		dispatch(jsonDraftChanged({ id: node.id, field: 'form.ui', text: null }));
		patch({ form: enabled ? { schema: DEFAULT_FORM_SCHEMA } : undefined });
	};

	return (
		<>
			<Select
				label={<SectionLabel required>Channel</SectionLabel>}
				description="Transport allowed to deliver the payload"
				inputWrapperOrder={['label', 'input', 'description']}
				data={[
					{ value: 'http', label: 'HTTP' },
					{ value: 'redis', label: 'Redis' },
					{ value: 'rabbitmq', label: 'RabbitMQ' },
				]}
				value={config.channel ?? 'http'}
				onChange={(channel) => channel && patch({ channel: channel as typeof config.channel })}
				rightSection={selectIcon}
				allowDeselect={false}
			/>

			<Stack gap="xs">
				<Group justify="space-between" wrap="nowrap" align="flex-start">
					<div>
						<SectionLabel>Validation script</SectionLabel>
						<Text fz="xs" c="dimmed">
							Return a non-empty string to reject the payload. `input` is the raw payload string.
						</Text>
					</div>
					<Switch
						aria-label="Validation script"
						checked={!!config.validation}
						onChange={(event) =>
							patch({ validation: event.currentTarget.checked ? { script: '' } : undefined })
						}
					/>
				</Group>
				{config.validation && (
					<CodeEditor
						height={120}
						placeholder={"const body = JSON.parse(input);\nif (!body.id) return 'id is required';"}
						value={config.validation.script}
						onChange={(script) => patch({ validation: { script } })}
					/>
				)}
			</Stack>

			<Stack gap="xs">
				<Group justify="space-between" wrap="nowrap" align="flex-start">
					<div>
						<SectionLabel>Dynamic form</SectionLabel>
						<Text fz="xs" c="dimmed">
							JSON Schema (2020-12) checked before the validation script runs
						</Text>
					</div>
					<Switch
						aria-label="Dynamic form"
						checked={hasForm}
						onChange={(event) => toggleForm(event.currentTarget.checked)}
					/>
				</Group>
				{hasForm && (
					<>
						<JsonField node={node} field="form.schema" label="Schema" required height={160} />
						<JsonField node={node} field="form.ui" label="UI hints" description="Optional render hints" />
					</>
				)}
			</Stack>
		</>
	);
};

const OutputFields: React.FC<FieldsProps> = ({ node }) => {
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const { config } = node;

	return (
		<>
			<Select
				label={<SectionLabel required>Channel</SectionLabel>}
				data={[
					{ value: 'redis', label: 'Redis' },
					{ value: 'rabbitmq', label: 'RabbitMQ' },
				]}
				value={config.channel ?? 'redis'}
				onChange={(channel) => channel && patch({ channel: channel as typeof config.channel })}
				rightSection={selectIcon}
				allowDeselect={false}
			/>
			<TextInput
				label={<SectionLabel required>Context path</SectionLabel>}
				description="The value at this path is published as-is"
				inputWrapperOrder={['label', 'input', 'description', 'error']}
				placeholder="result.summary"
				value={config.context_path ?? ''}
				onChange={(event) => patch({ context_path: event.currentTarget.value })}
				error={contextPathError(config.context_path)}
			/>
		</>
	);
};

const MethodUrlFields: React.FC<{
	method: string | undefined;
	url: string;
	onChange: (patch: { method?: string; url?: string }) => void;
}> = ({ method, url, onChange }) => (
	<Group gap="xs" wrap="nowrap" align="flex-end">
		<Select
			w={104}
			label={<SectionLabel>Method</SectionLabel>}
			data={HTTP_METHODS}
			value={method || 'GET'}
			onChange={(value) => value && onChange({ method: value })}
			rightSection={selectIcon}
			allowDeselect={false}
		/>
		<TextInput
			flex={1}
			label={<SectionLabel required>URL</SectionLabel>}
			placeholder="https://api.example.com/{{ order.id }}"
			value={url}
			onChange={(event) => onChange({ url: event.currentTarget.value })}
		/>
	</Group>
);

const ExternalCallFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const { config } = node;
	const mode = config.execution_config ? 'command' : 'http';

	const switchMode = (next: string) => {
		if (next === mode) return;
		dispatch(jsonDraftChanged({ id: node.id, field: 'http_config.body', text: null }));
		patch(
			next === 'command'
				? { execution_config: { command: [] }, http_config: undefined }
				: { http_config: { method: 'GET', url: '' }, execution_config: undefined },
		);
	};

	return (
		<>
			<SegmentedControl
				value={mode}
				onChange={switchMode}
				data={[
					{ value: 'http', label: 'HTTP request' },
					{ value: 'command', label: 'Command' },
				]}
			/>

			{config.http_config && (
				<>
					<MethodUrlFields
						method={config.http_config.method}
						url={config.http_config.url}
						onChange={(change) => patch({ http_config: { ...config.http_config!, ...change } })}
					/>
					<HeadersField
						key={`${node.id}-headers`}
						value={config.http_config.headers}
						onChange={(headers) => patch({ http_config: { ...config.http_config!, headers } })}
					/>
					<JsonField
						node={node}
						field="http_config.body"
						label="Body"
						description="JSON. String values support {{ path }} templates."
					/>
				</>
			)}

			{config.execution_config && (
				<>
					<TagsInput
						label={<SectionLabel required>Command</SectionLabel>}
						description="Allowlisted argv, run without a shell. Press Enter after each argument."
						inputWrapperOrder={['label', 'input', 'description']}
						placeholder="Add argument"
						value={config.execution_config.command}
						onChange={(command) => patch({ execution_config: { ...config.execution_config!, command } })}
						acceptValueOnBlur
						splitChars={[]}
					/>
					<Textarea
						label={<SectionLabel>Stdin</SectionLabel>}
						description="Supports {{ path }} templates"
						inputWrapperOrder={['label', 'input', 'description']}
						autosize
						minRows={2}
						styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
						value={config.execution_config.stdin ?? ''}
						onChange={(event) =>
							patch({
								execution_config: {
									...config.execution_config!,
									stdin: event.currentTarget.value || undefined,
								},
							})
						}
					/>
				</>
			)}
		</>
	);
};

type PollerSource = 'http' | 'redis' | 'rabbitmq';

const PollerFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const { patch } = useWorkflowDefinitionEditorNodeActions(node.id);
	const { config } = node;
	const source: PollerSource = config.redis ? 'redis' : config.rabbitmq ? 'rabbitmq' : 'http';
	const until = (config.redis ?? config.rabbitmq ?? config.http)?.until ?? '';

	const switchSource = (next: string) => {
		if (next === source) return;
		dispatch(jsonDraftChanged({ id: node.id, field: 'http.body', text: null }));
		patch({
			http: next === 'http' ? { method: 'GET', url: '', until } : undefined,
			redis: next === 'redis' ? { method: 'GET', key: '', until } : undefined,
			rabbitmq: next === 'rabbitmq' ? { queue: '', until } : undefined,
		});
	};

	const setHttp = (change: Partial<WorkflowDefinitionPollerHTTPConfig>) =>
		patch({ http: { ...config.http!, ...change } });
	const setRedis = (change: Partial<WorkflowDefinitionPollerRedisConfig>) =>
		patch({ redis: { ...config.redis!, ...change } });
	const setRabbitMQ = (change: Partial<WorkflowDefinitionPollerRabbitMQConfig>) =>
		patch({ rabbitmq: { ...config.rabbitmq!, ...change } });
	const setUntil = (value: string) => {
		if (source === 'redis') setRedis({ until: value });
		else if (source === 'rabbitmq') setRabbitMQ({ until: value });
		else setHttp({ until: value });
	};

	return (
		<>
			<SegmentedControl
				value={source}
				onChange={switchSource}
				data={[
					{ value: 'http', label: 'HTTP' },
					{ value: 'redis', label: 'Redis' },
					{ value: 'rabbitmq', label: 'RabbitMQ' },
				]}
			/>

			{config.http && (
				<>
					<MethodUrlFields method={config.http.method} url={config.http.url} onChange={setHttp} />
					<HeadersField
						key={`${node.id}-headers`}
						value={config.http.headers}
						onChange={(headers) => setHttp({ headers })}
					/>
					<JsonField node={node} field="http.body" label="Body" />
					<Group grow gap="xs">
						<DurationInput
							label="Delay"
							placeholder="5s"
							value={config.http.delay}
							onChange={(delay) => setHttp({ delay })}
						/>
						<DurationInput
							label="Request timeout"
							placeholder="30s"
							value={config.http.request_timeout}
							onChange={(request_timeout) => setHttp({ request_timeout })}
						/>
					</Group>
					<NumberInput
						label="Max attempts"
						placeholder="10"
						min={1}
						allowDecimal={false}
						value={config.http.max_attempts ?? ''}
						onChange={(value) => setHttp({ max_attempts: typeof value === 'number' ? value : undefined })}
					/>
				</>
			)}

			{config.redis && (
				<>
					<SegmentedControl
						size="xs"
						value={config.redis.method}
						onChange={(method) =>
							setRedis(
								method === 'SUB'
									? {
											method: 'SUB',
											key: undefined,
											channel: '',
											max_attempts: undefined,
											delay: undefined,
										}
									: { method: 'GET', channel: undefined, key: '' },
							)
						}
						data={[
							{ value: 'GET', label: 'GET key' },
							{ value: 'SUB', label: 'Subscribe' },
						]}
					/>
					{config.redis.method === 'SUB' ? (
						<TextInput
							label={<SectionLabel required>Channel</SectionLabel>}
							placeholder="events:{{ workflow_instance_id }}"
							value={config.redis.channel ?? ''}
							onChange={(event) => setRedis({ channel: event.currentTarget.value })}
						/>
					) : (
						<>
							<TextInput
								label={<SectionLabel required>Key</SectionLabel>}
								placeholder="job:{{ job.id }}:status"
								value={config.redis.key ?? ''}
								onChange={(event) => setRedis({ key: event.currentTarget.value })}
							/>
							<Group grow gap="xs">
								<DurationInput
									label="Delay"
									placeholder="5s"
									value={config.redis.delay}
									onChange={(delay) => setRedis({ delay })}
								/>
								<NumberInput
									label="Max attempts"
									placeholder="10"
									min={1}
									allowDecimal={false}
									value={config.redis.max_attempts ?? ''}
									onChange={(value) =>
										setRedis({ max_attempts: typeof value === 'number' ? value : undefined })
									}
								/>
							</Group>
						</>
					)}
					<Group grow gap="xs">
						<DurationInput
							label="Request timeout"
							placeholder="30s"
							value={config.redis.request_timeout}
							onChange={(request_timeout) => setRedis({ request_timeout })}
						/>
						<DurationInput
							label="Max wait time"
							placeholder="5m"
							value={config.redis.max_wait_time}
							onChange={(max_wait_time) => setRedis({ max_wait_time })}
						/>
					</Group>
				</>
			)}

			{config.rabbitmq && (
				<>
					<TextInput
						label={<SectionLabel required>Queue</SectionLabel>}
						description="Pre-provisioned queue, exclusive to one active poller"
						inputWrapperOrder={['label', 'input', 'description']}
						placeholder="payments.settled"
						value={config.rabbitmq.queue}
						onChange={(event) => setRabbitMQ({ queue: event.currentTarget.value })}
					/>
					<DurationInput
						label="Max wait time"
						placeholder="5m"
						value={config.rabbitmq.max_wait_time}
						onChange={(max_wait_time) => setRabbitMQ({ max_wait_time })}
					/>
				</>
			)}

			<CodeEditor
				label={<SectionLabel required>Until</SectionLabel>}
				description="Return true when `response` is the one you are waiting for"
				height={110}
				placeholder="return response.body.status === 'done';"
				value={until}
				onChange={setUntil}
			/>
		</>
	);
};

const GroupFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const nodes = useCoreSelector(selectEditorNodes);
	const childCount = Object.values(nodes).filter((child) => child.parentId === node.id).length;

	return (
		<Stack gap="xs">
			<SectionLabel>Contents</SectionLabel>
			<Text fz="sm" c="dimmed">
				{childCount === 0
					? 'This group is empty. Open it to add nodes and connect its Start.'
					: `${childCount} ${childCount === 1 ? 'node' : 'nodes'} inside. The group continues to its next node when its inner graph exits.`}
			</Text>
			<Button variant="default" w="fit-content" onClick={() => dispatch(scopeEntered(node.id))}>
				Open group
			</Button>
		</Stack>
	);
};

export const FailureFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const edges = useCoreSelector(selectEditorEdges);
	const nodes = useCoreSelector(selectEditorNodes);
	const target = outgoingTarget(edges, node.id, HANDLE_FAILURE);

	return (
		<Stack gap={6}>
			<SectionLabel required={!!target}>On failure</SectionLabel>
			<Text fz="xs" c="dimmed">
				{target
					? `Failures route to "${nodes[target]?.config.name ?? 'Unknown node'}" instead of failing the workflow.`
					: 'Connect the red handle to a fallback node to recover from failures.'}
			</Text>
			<TextInput
				placeholder="lookup_error"
				aria-label="Failure output property"
				description="Context key receiving { message, reason, result }"
				inputWrapperOrder={['input', 'description']}
				value={node.failureOutputProperty}
				onChange={(event) =>
					dispatch(failureOutputPropertyChanged({ id: node.id, value: event.currentTarget.value }))
				}
			/>
		</Stack>
	);
};

export const InspectorNodeFields: React.FC<FieldsProps> = ({ node }) => {
	switch (node.config.type) {
		case 'script':
			return <ScriptFields node={node} />;
		case 'conditions':
			return <ConditionsFields node={node} />;
		case 'input':
			return <InputFields node={node} />;
		case 'output':
			return <OutputFields node={node} />;
		case 'external_call':
			return <ExternalCallFields node={node} />;
		case 'poller':
			return <PollerFields node={node} />;
		case 'group':
			return <GroupFields node={node} />;
	}
};

export { ConditionsFields };
