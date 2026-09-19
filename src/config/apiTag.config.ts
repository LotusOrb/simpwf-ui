export const apiTagConfig = {
	workflowDefinition: 'WorkflowDefinition',
	workflowRun: 'WorkflowRun',
} as const;

export type ApiTag = (typeof apiTagConfig)[keyof typeof apiTagConfig];

export const apiTagList = Object.values(apiTagConfig) as ApiTag[];

export const API_TAG_LIST_ID = 'LIST';
