import React from 'react';

import { Badge, Stack, Tabs, Text } from '@mantine/core';

import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';

import { WorkflowRunContextPanel } from '../WorkflowRunContextPanel';
import { WorkflowRunJsonView } from '../WorkflowRunJsonView';
import { WorkflowRunParallelPanel } from '../WorkflowRunParallelPanel';
import classes from './WorkflowRunSidePanel.module.scss';

interface WorkflowRunSidePanelProps {
	detail: WorkflowRunDetail;
	context: Record<string, unknown>;
	canEditContext: boolean;
	onReplaceContext: (context: Record<string, unknown>, reason: string) => void;
	/** Resolves start and end node names in the parallel tree. */
	nodesById: Map<string, WorkflowDefinitionNode>;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	/** Parked branches a payload can be delivered to. */
	inputBranchIds: Set<string>;
	/** Omitted when the caller cannot deliver input. */
	onProvideBranchInput?: (branchId: string) => void;
}

export const WorkflowRunSidePanel: React.FC<WorkflowRunSidePanelProps> = ({
	detail,
	context,
	canEditContext,
	onReplaceContext,
	nodesById,
	selectedNodeId,
	onSelectNode,
	inputBranchIds,
	onProvideBranchInput,
}) => (
	<Tabs defaultValue="context" keepMounted={false} className={classes.root}>
		<Tabs.List className={classes.list}>
			<Tabs.Tab value="context">Context</Tabs.Tab>
			{!!detail.parallel?.length && (
				<Tabs.Tab
					value="parallel"
					rightSection={
						<Badge size="xs" variant="light" color="indigo" circle>
							{detail.parallel.length}
						</Badge>
					}
				>
					Parallel
				</Tabs.Tab>
			)}
			<Tabs.Tab value="raw">Raw status</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="context" className={classes.panel}>
			<WorkflowRunContextPanel
				context={context}
				editable={canEditContext && detail.status === 'paused'}
				onReplace={onReplaceContext}
			/>
		</Tabs.Panel>

		{!!detail.parallel?.length && (
			<Tabs.Panel value="parallel" className={classes.panel}>
				<WorkflowRunParallelPanel
					executions={detail.parallel}
					nodesById={nodesById}
					selectedNodeId={selectedNodeId}
					onSelectNode={onSelectNode}
					inputBranchIds={inputBranchIds}
					onProvideInput={onProvideBranchInput}
				/>
			</Tabs.Panel>
		)}

		<Tabs.Panel value="raw" className={classes.panel}>
			<Stack gap="xs" p="md">
				<Text fz="xs" c="dimmed">
					GET /v1/workflow/instance/{detail.id}/status
				</Text>
				<WorkflowRunJsonView value={detail} maxHeight="none" />
			</Stack>
		</Tabs.Panel>
	</Tabs>
);
