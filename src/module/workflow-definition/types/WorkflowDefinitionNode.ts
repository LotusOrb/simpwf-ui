import type { WorkflowDefinitionExecutionConfig } from './WorkflowDefinitionExecutionConfig';
import type { WorkflowDefinitionFailureRoute } from './WorkflowDefinitionFailureRoute';
import type { WorkflowDefinitionHookScript } from './WorkflowDefinitionHookScript';
import type { WorkflowDefinitionHTTPConfig } from './WorkflowDefinitionHTTPConfig';
import type { WorkflowDefinitionInputChannel } from './WorkflowDefinitionInputChannel';
import type { WorkflowDefinitionInputForm } from './WorkflowDefinitionInputForm';
import type { WorkflowDefinitionNodeCondition } from './WorkflowDefinitionNodeCondition';
import type { WorkflowDefinitionNodeType } from './WorkflowDefinitionNodeType';
import type { WorkflowDefinitionPollerHTTPConfig } from './WorkflowDefinitionPollerHTTPConfig';
import type { WorkflowDefinitionPollerRabbitMQConfig } from './WorkflowDefinitionPollerRabbitMQConfig';
import type { WorkflowDefinitionPollerRedisConfig } from './WorkflowDefinitionPollerRedisConfig';

export interface WorkflowDefinitionNode {
	id: string;
	type: WorkflowDefinitionNodeType;
	name: string;
	node_definition_id?: string;
	next_node?: string | null;
	on_failure?: WorkflowDefinitionFailureRoute | null;
	output_property?: string;
	timeout?: string | null;
	retry_on_recovery?: boolean;
	metadata?: Record<string, unknown>;
	pre_script?: WorkflowDefinitionHookScript | null;
	post_script?: WorkflowDefinitionHookScript | null;

	script?: string;
	input_data?: string;

	conditions?: WorkflowDefinitionNodeCondition[];

	channel?: WorkflowDefinitionInputChannel;
	context_path?: string;
	validation?: { script: string };
	form?: WorkflowDefinitionInputForm;

	http_config?: WorkflowDefinitionHTTPConfig;
	execution_config?: WorkflowDefinitionExecutionConfig;

	http?: WorkflowDefinitionPollerHTTPConfig;
	redis?: WorkflowDefinitionPollerRedisConfig;
	rabbitmq?: WorkflowDefinitionPollerRabbitMQConfig;

	start_node_id?: string;
	keys?: Record<string, string | null>;
	nodes?: WorkflowDefinitionNode[];
}
