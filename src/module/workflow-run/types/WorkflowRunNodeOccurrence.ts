import type { WorkflowRunNodeStatus } from './WorkflowRunNodeStatus';

export interface WorkflowRunNodeOccurrence {
	occurrence_id: string;
	status: WorkflowRunNodeStatus;
	attempt: number;
	rollbackable: boolean;
}
