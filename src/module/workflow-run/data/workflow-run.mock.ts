import type { WorkflowDefinitionContent } from '@module/workflow-definition/types/WorkflowDefinitionContent';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';
import type { WorkflowRunNodeStatus } from '@module/workflow-run/types/WorkflowRunNodeStatus';

/**
 * Mock fixtures for the workflow run detail screen. Nothing here talks to the API — the
 * screen drives a small in-memory engine (see `workflow-run.simulation.ts`) so the
 * visualisation can be reviewed end to end before the endpoints are wired up.
 */

export interface WorkflowRunMockDefinition {
	id: string;
	name: string;
	version: number;
	content: WorkflowDefinitionContent;
}

export const mockRunDefinition: WorkflowRunMockDefinition = {
	id: '0199aa01-0004-7000-8000-000000000001',
	name: 'Order Fulfilment',
	version: 4,
	content: {
		start_node_id: 'receive-order',
		context_mode: 'full',
		keys: { in_stock: 'reserve-stock', backorder: 'notify-backorder' },
		nodes: [
			{
				id: 'receive-order',
				type: 'input',
				name: 'Receive order',
				channel: 'http',
				context_path: 'order',
				next_node: 'validate-order',
			},
			{
				id: 'validate-order',
				type: 'script',
				name: 'Validate order',
				input_data: 'context.order',
				script: 'if (!input.items?.length) throw new Error("empty order");\nreturn { valid: true };',
				next_node: 'check-stock',
			},
			{
				id: 'check-stock',
				type: 'external_call',
				name: 'Check stock',
				http_config: { method: 'POST', url: 'https://inventory.internal/v1/stock/check' },
				output_property: 'stock',
				timeout: '10s',
				next_node: 'stock-route',
				on_failure: { next_node: 'handle-failure', output_property: 'stock_error' },
			},
			{
				id: 'stock-route',
				type: 'conditions',
				name: 'Stock available?',
				conditions: [
					{ key: 'in_stock', condition: 'context.stock.available >= context.order.quantity' },
					{ key: 'backorder', condition: 'true' },
				],
			},
			{
				id: 'reserve-stock',
				type: 'group',
				name: 'Reserve stock',
				start_node_id: 'lock-inventory',
				next_node: 'await-payment',
				nodes: [
					{
						id: 'lock-inventory',
						type: 'script',
						name: 'Lock inventory',
						script: 'context.reservation = { id: crypto.randomUUID() };',
						next_node: 'write-ledger',
					},
					{
						id: 'write-ledger',
						type: 'external_call',
						name: 'Write ledger entry',
						http_config: { method: 'POST', url: 'https://ledger.internal/v1/entries' },
						output_property: 'ledger',
					},
				],
			},
			{
				id: 'notify-backorder',
				type: 'output',
				name: 'Notify backorder',
				channel: 'rabbitmq',
				context_path: 'order',
			},
			{
				id: 'await-payment',
				type: 'poller',
				name: 'Await payment',
				http: {
					method: 'GET',
					url: 'https://payments.internal/v1/charges/{{context.order.id}}',
					delay: '15s',
					max_attempts: 120,
					until: 'response.body.status === "settled"',
				},
				output_property: 'payment',
				next_node: 'confirm-shipment',
				on_failure: { next_node: 'handle-failure', output_property: 'payment_error' },
			},
			{
				id: 'confirm-shipment',
				type: 'input',
				name: 'Confirm shipment',
				channel: 'http',
				context_path: 'shipment',
				next_node: 'notify-customer',
				form: {
					schema: {
						type: 'object',
						required: ['carrier', 'tracking_number'],
						properties: {
							carrier: { type: 'string', enum: ['JNE', 'SiCepat', 'AnterAja'] },
							tracking_number: { type: 'string' },
							notes: { type: 'string' },
						},
					},
				},
			},
			{
				id: 'notify-customer',
				type: 'output',
				name: 'Notify customer',
				channel: 'redis',
				context_path: 'shipment',
			},
			{
				id: 'handle-failure',
				type: 'script',
				name: 'Handle failure',
				script: 'context.alert = { severity: "high", stage: context.stock_error ? "stock" : "payment" };',
			},
		],
	},
};

/** Per-node knobs the simulated engine uses when it executes a node. */
export interface WorkflowRunMockNodeBehaviour {
	durationMs: number;
	/** Attempts that fail before the node settles. */
	failedAttempts?: number;
	error?: string;
	recoveryPolicy?: string;
	input?: unknown;
	output?: unknown;
	/** Merged into the context once the node succeeds. */
	contextPatch?: Record<string, unknown>;
}

export const mockNodeBehaviour: Record<string, WorkflowRunMockNodeBehaviour> = {
	'receive-order': {
		durationMs: 420,
		input: { channel: 'http', path: '/v1/workflow/instance/{id}/input' },
		output: { id: 'ORD-88142', quantity: 3, items: [{ sku: 'KB-87', qty: 3 }], total: 1_248_000 },
		contextPatch: { order: { id: 'ORD-88142', quantity: 3, total: 1_248_000 } },
	},
	'validate-order': {
		durationMs: 180,
		input: { id: 'ORD-88142', quantity: 3 },
		output: { valid: true },
		contextPatch: { validation: { valid: true } },
	},
	'check-stock': {
		durationMs: 2_140,
		failedAttempts: 1,
		error: 'POST https://inventory.internal/v1/stock/check: context deadline exceeded after 10s',
		recoveryPolicy: 'retry(max=3, backoff=exponential)',
		input: { sku: 'KB-87', quantity: 3, warehouse: 'JKT-01' },
		output: { available: 12, warehouse: 'JKT-01', reserved_until: '2026-09-21T15:10:00Z' },
		contextPatch: { stock: { available: 12, warehouse: 'JKT-01' } },
	},
	'stock-route': {
		durationMs: 12,
		input: { available: 12, quantity: 3 },
		output: { branch: 'in_stock' },
	},
	'reserve-stock': { durationMs: 40 },
	'lock-inventory': {
		durationMs: 260,
		output: { reservation_id: 'RSV-4471' },
		contextPatch: { reservation: { id: 'RSV-4471' } },
	},
	'write-ledger': {
		durationMs: 880,
		input: { reservation_id: 'RSV-4471', amount: 1_248_000 },
		output: { entry_id: 'LDG-99210', posted: true },
		contextPatch: { ledger: { entry_id: 'LDG-99210' } },
	},
	'await-payment': {
		durationMs: 96_000,
		recoveryPolicy: 'poll(interval=15s, timeout=30m)',
		input: { charge_id: 'CHG-20411', poll_interval: '15s' },
		output: { status: 'settled', paid_at: '2026-09-21T14:06:02Z', amount: 1_248_000 },
		contextPatch: { payment: { status: 'settled', amount: 1_248_000 } },
	},
	'confirm-shipment': {
		durationMs: 0,
		input: { channel: 'http', awaiting: true },
	},
	'notify-customer': {
		durationMs: 140,
		output: { published: true, channel: 'redis://notify.shipments' },
	},
	'notify-backorder': {
		durationMs: 150,
		output: { published: true, channel: 'amqp://orders.backorder' },
	},
	'handle-failure': {
		durationMs: 90,
		output: { severity: 'high', stage: 'stock' },
		contextPatch: { alert: { severity: 'high', stage: 'stock' } },
	},
};

export type WorkflowRunMockScenarioId = 'live' | 'awaiting-input' | 'failed';

export interface WorkflowRunMockScenario {
	id: WorkflowRunMockScenarioId;
	label: string;
	description: string;
	/** Nodes already executed when the screen opens, in execution order. */
	completed: string[];
	current: string | null;
	currentStatus: WorkflowRunNodeStatus;
	status: WorkflowRunDetail['status'];
	waitingReason?: string;
	error?: string;
	/** Nodes the engine never reached because another branch won. */
	skipped?: string[];
}

export const mockRunScenarios: Record<WorkflowRunMockScenarioId, WorkflowRunMockScenario> = {
	live: {
		id: 'live',
		label: 'Live run',
		description: 'Mid-flight, polling for payment settlement',
		completed: ['receive-order', 'validate-order', 'check-stock', 'stock-route', 'lock-inventory', 'write-ledger'],
		current: 'await-payment',
		currentStatus: 'running',
		status: 'running',
		skipped: ['notify-backorder'],
	},
	'awaiting-input': {
		id: 'awaiting-input',
		label: 'Awaiting input',
		description: 'Parked on a human input node',
		completed: [
			'receive-order',
			'validate-order',
			'check-stock',
			'stock-route',
			'lock-inventory',
			'write-ledger',
			'await-payment',
		],
		current: 'confirm-shipment',
		currentStatus: 'waiting',
		status: 'waiting',
		waitingReason: 'Waiting for shipment confirmation on channel http',
		skipped: ['notify-backorder'],
	},
	failed: {
		id: 'failed',
		label: 'Failed run',
		description: 'Stock check exhausted its retries',
		completed: ['receive-order', 'validate-order'],
		current: 'check-stock',
		currentStatus: 'failed',
		status: 'failed',
		error: 'POST https://inventory.internal/v1/stock/check: context deadline exceeded after 10s (attempt 3/3)',
	},
};

export const mockRunScenarioOrder: WorkflowRunMockScenarioId[] = ['live', 'awaiting-input', 'failed'];

/** Picks a stable scenario for a run id so any row in the list opens onto something plausible. */
export const scenarioForRunId = (runId: string): WorkflowRunMockScenarioId => {
	let hash = 0;
	for (const char of runId) hash = (hash * 31 + char.charCodeAt(0)) % 997;
	return mockRunScenarioOrder[hash % mockRunScenarioOrder.length];
};

export const mockRunId = '0199bb42-7c10-7000-8000-000000000042';
