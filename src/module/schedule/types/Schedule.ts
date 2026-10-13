export interface Schedule {
	id: string;
	workflow_definition_id: string;
	/** As submitted; an inline TZ=/CRON_TZ= prefix is kept verbatim. */
	crontab: string;
	/** The effective zone: the inline prefix's when there is one. */
	timezone: string;
	context: Record<string, unknown>;
	enabled: boolean;
	created_by: string;
	updated_by: string;
	created_at: string;
	updated_at: string;
}
