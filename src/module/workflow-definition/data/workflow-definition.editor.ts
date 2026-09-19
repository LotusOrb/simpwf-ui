import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowDefinitionEditorDocument } from '@module/workflow-definition/types/WorkflowDefinitionEditorDocument';
import type { WorkflowDefinitionEditorEdge } from '@module/workflow-definition/types/WorkflowDefinitionEditorEdge';
import type { WorkflowDefinitionEditorIssue } from '@module/workflow-definition/types/WorkflowDefinitionEditorIssue';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import type { WorkflowDefinitionEditorPosition } from '@module/workflow-definition/types/WorkflowDefinitionEditorPosition';
import type { WorkflowDefinitionJsonField } from '@module/workflow-definition/types/WorkflowDefinitionJsonField';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowDefinitionNodeConfig } from '@module/workflow-definition/types/WorkflowDefinitionNodeConfig';
import type { WorkflowDefinitionNodeType } from '@module/workflow-definition/types/WorkflowDefinitionNodeType';

import { layoutGraph, nodeTypeMeta } from './workflow-definition.meta';

export const ROOT_SCOPE = 'root';
export const HANDLE_NEXT = 'next';
export const HANDLE_FAILURE = 'failure';
export const EDITOR_METADATA_KEY = 'editor';

const START_PREFIX = 'start:';
const COLUMN_WIDTH = 300;
const ROW_HEIGHT = 140;

export const scopeKey = (scope: string | null) => scope ?? ROOT_SCOPE;
export const startNodeId = (scope: string | null) => `${START_PREFIX}${scopeKey(scope)}`;
export const isStartNodeId = (id: string) => id.startsWith(START_PREFIX);
export const scopeOfStartNode = (id: string) => {
	const key = id.slice(START_PREFIX.length);
	return key === ROOT_SCOPE ? null : key;
};
export const branchHandle = (branchId: string) => `branch:${branchId}`;

export const uuidv7 = () => {
	const bytes = crypto.getRandomValues(new Uint8Array(16));
	const timestamp = BigInt(Date.now());
	for (let index = 0; index < 6; index++) bytes[index] = Number((timestamp >> BigInt(8 * (5 - index))) & 0xffn);
	bytes[6] = (bytes[6] & 0x0f) | 0x70;
	bytes[8] = (bytes[8] & 0x3f) | 0x80;
	const hex = Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
	return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
};

export const shortId = () => Math.random().toString(36).slice(2, 10);

export const supportsNext = (type: WorkflowDefinitionNodeType) => type !== 'conditions';
export const supportsFailure = (type: WorkflowDefinitionNodeType) => type === 'external_call' || type === 'poller';
export const supportsOutputProperty = (type: WorkflowDefinitionNodeType) =>
	type !== 'conditions' && type !== 'group' && type !== 'input';
export const supportsTimeout = (type: WorkflowDefinitionNodeType) =>
	type === 'script' || type === 'external_call' || type === 'output';
export const supportsRetryOnRecovery = supportsFailure;

export const isInlineGroup = (node: WorkflowDefinitionEditorNode) =>
	node.config.type === 'group' && !node.config.node_definition_id;

const defaultConfigs: Record<WorkflowDefinitionNodeType, Partial<WorkflowDefinitionNodeConfig>> = {
	script: { script: '' },
	conditions: {},
	input: { channel: 'http', context_path: '' },
	output: { channel: 'redis', context_path: '' },
	external_call: { http_config: { method: 'GET', url: '' } },
	poller: { http: { method: 'GET', url: '', until: '' } },
	group: {},
};

const scopeNodes = (nodes: Record<string, WorkflowDefinitionEditorNode>, scope: string | null) =>
	Object.values(nodes).filter((node) => node.parentId === scope);

export const nextBranchKeys = (
	nodes: Record<string, WorkflowDefinitionEditorNode>,
	scope: string | null,
	count: number,
	reserved: string[] = [],
) => {
	const used = new Set([
		...scopeNodes(nodes, scope).flatMap((node) => node.branches.map((branch) => branch.key)),
		...reserved,
	]);
	const keys: string[] = [];
	for (let index = 1; keys.length < count; index++) {
		if (!used.has(`branch_${index}`)) keys.push(`branch_${index}`);
	}
	return keys;
};

const nextNodeName = (nodes: Record<string, WorkflowDefinitionEditorNode>, scope: string | null, base: string) => {
	const used = new Set(scopeNodes(nodes, scope).map((node) => node.config.name));
	if (!used.has(base)) return base;
	let index = 2;
	while (used.has(`${base} ${index}`)) index++;
	return `${base} ${index}`;
};

export const createEditorNode = (
	nodes: Record<string, WorkflowDefinitionEditorNode>,
	scope: string | null,
	position: WorkflowDefinitionEditorPosition,
	source: { type: WorkflowDefinitionNodeType } | { definition: NodeDefinition },
): WorkflowDefinitionEditorNode => {
	const id = uuidv7();

	if ('definition' in source) {
		const { definition } = source;
		return {
			id,
			parentId: scope,
			position,
			config: {
				type: definition.type,
				name: nextNodeName(nodes, scope, definition.name),
				node_definition_id: definition.id,
			},
			branches: referenceBranches(definition),
			failureOutputProperty: '',
			jsonDrafts: {},
			reference: { name: definition.name, version: definition.version },
		};
	}

	const branches =
		source.type === 'conditions'
			? nextBranchKeys(nodes, scope, 2).map((key) => ({ id: shortId(), key, condition: '' }))
			: [];

	return {
		id,
		parentId: scope,
		position,
		config: {
			type: source.type,
			name: nextNodeName(nodes, scope, nodeTypeMeta[source.type].label),
			...structuredClone(defaultConfigs[source.type]),
		},
		branches,
		failureOutputProperty: '',
		jsonDrafts: {},
	};
};

const referenceBranches = (definition: NodeDefinition) =>
	(definition.content.conditions ?? []).map((condition) => ({
		id: shortId(),
		key: condition.key ?? '',
		condition: condition.condition,
	}));

export const readJsonField = (config: WorkflowDefinitionNodeConfig, field: WorkflowDefinitionJsonField): unknown => {
	switch (field) {
		case 'http_config.body':
			return config.http_config?.body;
		case 'http.body':
			return config.http?.body;
		case 'form.schema':
			return config.form?.schema;
		case 'form.ui':
			return config.form?.ui;
		case 'metadata': {
			if (!config.metadata) return undefined;
			const { [EDITOR_METADATA_KEY]: _editor, ...rest } = config.metadata;
			return Object.keys(rest).length > 0 ? rest : undefined;
		}
	}
};

export const formatJson = (value: unknown) => (value === undefined ? '' : JSON.stringify(value, null, 2));

export const parseJsonDraft = (text: string): { ok: true; value: unknown } | { ok: false } => {
	if (text.trim() === '') return { ok: true, value: undefined };
	try {
		return { ok: true, value: JSON.parse(text) };
	} catch {
		return { ok: false };
	}
};

const writeJsonField = (config: WorkflowDefinitionNodeConfig, field: WorkflowDefinitionJsonField, value: unknown) => {
	switch (field) {
		case 'http_config.body':
			if (config.http_config) config.http_config = { ...config.http_config, body: value };
			if (value === undefined) delete config.http_config?.body;
			return;
		case 'http.body':
			if (config.http) config.http = { ...config.http, body: value };
			if (value === undefined) delete config.http?.body;
			return;
		case 'form.schema':
			if (value === undefined) delete config.form;
			else config.form = { ...config.form, schema: value as Record<string, unknown> };
			return;
		case 'form.ui':
			if (!config.form) return;
			config.form = { ...config.form, ui: value as Record<string, unknown> };
			if (value === undefined) delete config.form.ui;
			return;
		case 'metadata':
			config.metadata = value as Record<string, unknown> | undefined;
			return;
	}
};

const resolveNodeConfig = (node: WorkflowDefinitionEditorNode) => {
	const config = structuredClone(node.config);
	for (const [field, text] of Object.entries(node.jsonDrafts)) {
		const parsed = parseJsonDraft(text);
		if (parsed.ok) writeJsonField(config, field as WorkflowDefinitionJsonField, parsed.value);
	}
	return config;
};

const RAW_ROUTING_FIELDS = ['id', 'next_node', 'on_failure', 'nodes', 'start_node_id'] as const;

const hasRawConditions = (node: WorkflowDefinitionEditorNode) =>
	node.config.type === 'conditions' && !node.config.node_definition_id;

export const formatRawNode = (node: WorkflowDefinitionEditorNode) => {
	const config = resolveNodeConfig(node);
	const metadata = readJsonField(config, 'metadata') as Record<string, unknown> | undefined;
	if (metadata) config.metadata = metadata;
	else delete config.metadata;

	const raw: Record<string, unknown> = { ...config };
	if (hasRawConditions(node)) {
		raw.conditions = node.branches.map((branch) =>
			branch.key ? { key: branch.key, condition: branch.condition } : { condition: branch.condition },
		);
	}
	return JSON.stringify(raw, null, 2);
};

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

export const parseRawNode = (
	node: WorkflowDefinitionEditorNode,
	text: string,
):
	| { ok: true; config: WorkflowDefinitionNodeConfig; branches?: WorkflowDefinitionEditorNode['branches'] }
	| { ok: false; error: string } => {
	let raw: unknown;
	try {
		raw = JSON.parse(text);
	} catch {
		return { ok: false, error: 'Not valid JSON' };
	}
	if (!isRecord(raw)) return { ok: false, error: 'Node must be a JSON object' };

	const routing = RAW_ROUTING_FIELDS.filter((field) => field in raw);
	if (routing.length > 0) return { ok: false, error: `${routing.join(', ')} are set on the canvas, not here` };
	if (raw.type !== node.config.type) return { ok: false, error: `type must stay "${node.config.type}"` };
	if (raw.node_definition_id !== node.config.node_definition_id) {
		return { ok: false, error: 'node_definition_id cannot be changed' };
	}
	if (typeof raw.name !== 'string') return { ok: false, error: 'name must be a string' };
	if (raw.metadata !== undefined && !isRecord(raw.metadata)) {
		return { ok: false, error: 'metadata must be a JSON object' };
	}

	const { conditions, ...config } = raw;
	if (!hasRawConditions(node)) {
		if (conditions !== undefined) return { ok: false, error: 'conditions only apply to inline conditions nodes' };
		return { ok: true, config: config as unknown as WorkflowDefinitionNodeConfig };
	}

	if (
		!Array.isArray(conditions) ||
		!conditions.every(
			(item) =>
				isRecord(item) &&
				typeof item.condition === 'string' &&
				(item.key === undefined || typeof item.key === 'string'),
		)
	) {
		return { ok: false, error: 'conditions must be a list of { key, condition }' };
	}

	// Branches are matched by position so existing canvas connections survive edits.
	const branches = (conditions as { key?: string; condition: string }[]).map((item, index) => ({
		id: node.branches[index]?.id ?? shortId(),
		key: item.key ?? '',
		condition: item.condition,
	}));
	return { ok: true, config: config as unknown as WorkflowDefinitionNodeConfig, branches };
};

const readPosition = (node: WorkflowDefinitionNode): WorkflowDefinitionEditorPosition | null => {
	const editor = node.metadata?.[EDITOR_METADATA_KEY] as { position?: WorkflowDefinitionEditorPosition } | undefined;
	const position = editor?.position;
	return position && Number.isFinite(position.x) && Number.isFinite(position.y) ? position : null;
};

export const toEditorDocument = (
	definition: WorkflowDefinition | null,
	references: Record<string, NodeDefinition>,
): WorkflowDefinitionEditorDocument => {
	const document: WorkflowDefinitionEditorDocument = {
		sourceId: definition?.id ?? null,
		sourceVersion: definition?.version ?? null,
		name: definition?.name ?? '',
		contextMode: definition?.content.context_mode ?? null,
		statusUpdate: definition?.content.status_update ?? null,
		nodes: {},
		starts: { [ROOT_SCOPE]: { position: { x: 0, y: 0 } } },
		edges: [],
	};
	if (!definition) return document;

	const addEdge = (source: string, sourceHandle: string, target: string | null | undefined) => {
		if (target) document.edges.push({ id: `${source}:${sourceHandle}`, source, sourceHandle, target });
	};

	const readScope = (
		scope: string | null,
		startId: string | undefined,
		nodes: WorkflowDefinitionNode[],
		keys: Record<string, string | null> | undefined,
	) => {
		const layout = layoutGraph({ start_node_id: startId ?? '', nodes, keys });
		const columnRows = new Map<number, number>();
		for (const node of layout.nodes) columnRows.set(node.column, (columnRows.get(node.column) ?? 0) + 1);
		const autoPositions = new Map(
			layout.nodes.map((node) => {
				const offset = (layout.rows - (columnRows.get(node.column) ?? 1)) / 2;
				return [node.id, { x: (node.column + 1) * COLUMN_WIDTH, y: (node.row + offset) * ROW_HEIGHT }];
			}),
		);
		let orphanColumn = 0;

		for (const node of nodes) {
			const {
				id,
				next_node,
				on_failure,
				conditions,
				nodes: children,
				start_node_id,
				keys: childKeys,
				...config
			} = node;
			const reference = config.node_definition_id ? references[config.node_definition_id] : undefined;
			// References may omit `type`; it is implied by the referenced node definition.
			if (!config.type && reference) config.type = reference.type;
			const inlineGroup = config.type === 'group' && !config.node_definition_id;

			if (!inlineGroup && childKeys) (config as WorkflowDefinitionNodeConfig).keys = childKeys;

			const position = readPosition(node) ??
				autoPositions.get(id) ?? {
					x: (orphanColumn++ + 1) * COLUMN_WIDTH,
					y: (layout.rows + 1) * ROW_HEIGHT,
				};

			const branches = (conditions ?? (reference ? reference.content.conditions : undefined) ?? []).map(
				(condition) => ({ id: shortId(), key: condition.key ?? '', condition: condition.condition }),
			);

			document.nodes[id] = {
				id,
				parentId: scope,
				position,
				config,
				branches,
				failureOutputProperty: on_failure?.output_property ?? '',
				jsonDrafts: {},
				reference: reference ? { name: reference.name, version: reference.version } : undefined,
			};

			addEdge(id, HANDLE_NEXT, next_node);
			addEdge(id, HANDLE_FAILURE, on_failure?.next_node);
			for (const branch of branches) {
				if (branch.key) addEdge(id, branchHandle(branch.id), keys?.[branch.key]);
			}

			if (inlineGroup) readScope(id, start_node_id, children ?? [], childKeys);
		}

		const startNode = startId ? document.nodes[startId] : undefined;
		const startPosition = startNode
			? { x: startNode.position.x - COLUMN_WIDTH + 80, y: startNode.position.y + 12 }
			: { x: 0, y: 0 };
		document.starts[scopeKey(scope)] = { position: startPosition };
		addEdge(startNodeId(scope), HANDLE_NEXT, startId);
	};

	readScope(null, definition.content.start_node_id, definition.content.nodes, definition.content.keys);
	return document;
};

export const outgoingTarget = (edges: WorkflowDefinitionEditorEdge[], source: string, sourceHandle: string) =>
	edges.find((edge) => edge.source === source && edge.sourceHandle === sourceHandle)?.target ?? null;

export const toWorkflowDefinitionContent = (document: WorkflowDefinitionEditorDocument): WorkflowDefinitionContent => {
	const writeScope = (scope: string | null) => {
		const keys: Record<string, string | null> = {};

		const nodes = scopeNodes(document.nodes, scope).map((editorNode) => {
			const config = resolveNodeConfig(editorNode);
			config.metadata = {
				...config.metadata,
				[EDITOR_METADATA_KEY]: {
					position: { x: Math.round(editorNode.position.x), y: Math.round(editorNode.position.y) },
				},
			};

			const node: WorkflowDefinitionNode = { id: editorNode.id, ...config };
			const { type } = config;

			const next = outgoingTarget(document.edges, editorNode.id, HANDLE_NEXT);
			if (supportsNext(type) && next) node.next_node = next;

			const failure = outgoingTarget(document.edges, editorNode.id, HANDLE_FAILURE);
			if (supportsFailure(type) && failure) {
				node.on_failure = { next_node: failure, output_property: editorNode.failureOutputProperty.trim() };
			}

			if (type === 'conditions') {
				const conditions = editorNode.branches.map((branch) => {
					const key = branch.key.trim();
					if (key) keys[key] = outgoingTarget(document.edges, editorNode.id, branchHandle(branch.id));
					return key ? { key, condition: branch.condition } : { condition: branch.condition };
				});
				if (!config.node_definition_id) node.conditions = conditions;
			}

			if (isInlineGroup(editorNode)) {
				const inner = writeScope(editorNode.id);
				node.start_node_id = inner.start_node_id;
				node.nodes = inner.nodes;
				if (inner.keys) node.keys = inner.keys;
			}

			return node;
		});

		return {
			start_node_id: outgoingTarget(document.edges, startNodeId(scope), HANDLE_NEXT) ?? '',
			nodes,
			keys: Object.keys(keys).length > 0 ? keys : undefined,
		};
	};

	const root = writeScope(null);
	const content: WorkflowDefinitionContent = { start_node_id: root.start_node_id, nodes: root.nodes };
	if (root.keys) content.keys = root.keys;
	if (document.contextMode) content.context_mode = document.contextMode;
	if (document.statusUpdate) content.status_update = document.statusUpdate;
	return content;
};

const CONTEXT_PATH = /^[A-Za-z_]\w*(\[\d+\])*(\.[A-Za-z_]\w*(\[\d+\])*)*$/;
const DURATION = /^(\d+(\.\d+)?(ns|us|µs|ms|s|m|h))+$/;

export const isContextPath = (value: string) => CONTEXT_PATH.test(value);
export const isDuration = (value: string) => DURATION.test(value) && !/^(0+(\.0+)?[a-zµ]+)+$/.test(value);

const jsonFieldLabels: Record<WorkflowDefinitionJsonField, string> = {
	'http_config.body': 'Request body',
	'http.body': 'Request body',
	'form.schema': 'Form schema',
	'form.ui': 'Form UI hints',
	metadata: 'Metadata',
};

export const validateEditorDocument = (document: WorkflowDefinitionEditorDocument): WorkflowDefinitionEditorIssue[] => {
	const issues: WorkflowDefinitionEditorIssue[] = [];
	const nodeIssue = (node: WorkflowDefinitionEditorNode, message: string) =>
		issues.push({ nodeId: node.id, scope: node.parentId, message });
	const requireText = (node: WorkflowDefinitionEditorNode, value: string | undefined, label: string) => {
		if (!value?.trim()) nodeIssue(node, `${label} is required`);
	};
	const checkDuration = (node: WorkflowDefinitionEditorNode, value: string | null | undefined, label: string) => {
		if (value && !isDuration(value)) nodeIssue(node, `${label} must be a duration like 30s or 5m`);
	};
	const checkContextPath = (node: WorkflowDefinitionEditorNode, value: string | undefined, label: string) => {
		if (!value?.trim()) nodeIssue(node, `${label} is required`);
		else if (!isContextPath(value)) nodeIssue(node, `${label} must be a path like user.name or items[0]`);
	};

	if (!document.name.trim()) issues.push({ nodeId: null, scope: null, message: 'Workflow name is required' });

	const checkScope = (scope: string | null, label: string) => {
		if (scopeNodes(document.nodes, scope).length === 0) {
			issues.push({ nodeId: scope, scope, message: `${label} needs at least one node` });
		} else if (!outgoingTarget(document.edges, startNodeId(scope), HANDLE_NEXT)) {
			issues.push({ nodeId: scope, scope, message: `Connect Start to the first node of ${label.toLowerCase()}` });
		}

		const keyTargets = new Map<string, string | null>();
		for (const node of scopeNodes(document.nodes, scope)) {
			for (const branch of node.branches) {
				const key = branch.key.trim();
				const target = outgoingTarget(document.edges, node.id, branchHandle(branch.id));
				if (!key) {
					if (target) nodeIssue(node, 'Name every branch key that leads to a node');
					continue;
				}
				if (keyTargets.has(key) && keyTargets.get(key) !== target) {
					nodeIssue(node, `Branch key "${key}" already routes somewhere else in this scope`);
				}
				keyTargets.set(key, target);
			}
		}
	};
	checkScope(null, 'The workflow');

	for (const node of Object.values(document.nodes)) {
		const { config } = node;
		requireText(node, config.name, 'Name');

		for (const [field, text] of Object.entries(node.jsonDrafts)) {
			if (!parseJsonDraft(text).ok) {
				nodeIssue(node, `${jsonFieldLabels[field as WorkflowDefinitionJsonField]} is not valid JSON`);
			}
		}

		if (supportsFailure(config.type) && outgoingTarget(document.edges, node.id, HANDLE_FAILURE)) {
			requireText(node, node.failureOutputProperty, 'Failure output property');
		}
		checkDuration(node, config.timeout, 'Timeout');
		checkDuration(node, config.pre_script?.timeout, 'Pre-script timeout');
		checkDuration(node, config.post_script?.timeout, 'Post-script timeout');
		if (config.pre_script) requireText(node, config.pre_script.script, 'Pre-script');
		if (config.post_script) requireText(node, config.post_script.script, 'Post-script');

		if (config.node_definition_id) continue;

		switch (config.type) {
			case 'script':
				requireText(node, config.script, 'Script');
				if (config.input_data && !isContextPath(config.input_data)) {
					nodeIssue(node, 'Input data must be a path like user.name or items[0]');
				}
				break;
			case 'conditions':
				if (node.branches.length < 2) nodeIssue(node, 'Conditions need at least two branches');
				if (node.branches.some((branch) => !branch.condition.trim())) {
					nodeIssue(node, 'Every branch needs a condition script');
				}
				break;
			case 'input':
			case 'output':
				checkContextPath(node, config.context_path, 'Context path');
				if (config.type === 'input' && config.validation) {
					requireText(node, config.validation.script, 'Validation script');
				}
				break;
			case 'external_call':
				if (config.execution_config) {
					if (config.execution_config.command.length === 0) nodeIssue(node, 'Command is required');
				} else {
					requireText(node, config.http_config?.url, 'URL');
				}
				break;
			case 'poller':
				if (config.redis) {
					requireText(node, config.redis.until, 'Until predicate');
					if (config.redis.method === 'SUB') requireText(node, config.redis.channel, 'Channel');
					else requireText(node, config.redis.key, 'Key');
					checkDuration(node, config.redis.delay, 'Delay');
					checkDuration(node, config.redis.request_timeout, 'Request timeout');
					checkDuration(node, config.redis.max_wait_time, 'Max wait time');
				} else if (config.rabbitmq) {
					requireText(node, config.rabbitmq.until, 'Until predicate');
					requireText(node, config.rabbitmq.queue, 'Queue');
					checkDuration(node, config.rabbitmq.max_wait_time, 'Max wait time');
				} else {
					requireText(node, config.http?.until, 'Until predicate');
					requireText(node, config.http?.url, 'URL');
					checkDuration(node, config.http?.delay, 'Delay');
					checkDuration(node, config.http?.request_timeout, 'Request timeout');
				}
				break;
			case 'group':
				checkScope(node.id, `Group "${config.name}"`);
				break;
		}
	}

	return issues;
};

export const collectReferenceIds = (nodes: WorkflowDefinitionNode[]): string[] =>
	nodes.flatMap((node) => [
		...(node.node_definition_id ? [node.node_definition_id] : []),
		...collectReferenceIds(node.nodes ?? []),
	]);

export const descendantIds = (nodes: Record<string, WorkflowDefinitionEditorNode>, id: string): string[] =>
	scopeNodes(nodes, id).flatMap((child) => [child.id, ...descendantIds(nodes, child.id)]);

export const scopeTrail = (nodes: Record<string, WorkflowDefinitionEditorNode>, scope: string | null) => {
	const trail: WorkflowDefinitionEditorNode[] = [];
	let current = scope ? nodes[scope] : undefined;
	while (current) {
		trail.unshift(current);
		current = current.parentId ? nodes[current.parentId] : undefined;
	}
	return trail;
};
