import type { WorkflowDefinitionHTTPConfig } from './WorkflowDefinitionHTTPConfig';

export interface WorkflowDefinitionPollerHTTPConfig extends WorkflowDefinitionHTTPConfig {
	delay?: string;
	request_timeout?: string;
	max_attempts?: number;
	until: string;
}
