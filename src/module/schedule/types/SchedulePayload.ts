export interface SchedulePayload {
	workflow_definition_id: string;
	crontab: string;
	/** IANA zone; the engine defaults an empty one to UTC. */
	timezone?: string;
	context?: Record<string, unknown>;
	/** The engine starts an omitted one enabled. */
	enabled?: boolean;
}
