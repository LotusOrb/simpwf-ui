export interface WorkflowDefinitionHTTPConfig {
	url: string;
	method?: string;
	headers?: Record<string, string>;
	body?: unknown;
}
