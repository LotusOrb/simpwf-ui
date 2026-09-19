export interface WorkflowDefinitionPollerRedisConfig {
	method: 'GET' | 'SUB';
	key?: string;
	channel?: string;
	delay?: string;
	request_timeout?: string;
	max_attempts?: number;
	max_wait_time?: string;
	until: string;
}
