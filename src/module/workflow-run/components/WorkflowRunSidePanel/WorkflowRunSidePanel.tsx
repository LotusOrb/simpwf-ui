import React from 'react';

import { Stack, Tabs, Text } from '@mantine/core';

import type { WorkflowRunDetail } from '@module/workflow-run/types/WorkflowRunDetail';

import { WorkflowRunContextPanel } from '../WorkflowRunContextPanel';
import { WorkflowRunJsonView } from '../WorkflowRunJsonView';
import classes from './WorkflowRunSidePanel.module.scss';

interface WorkflowRunSidePanelProps {
	detail: WorkflowRunDetail;
	context: Record<string, unknown>;
	onReplaceContext: (context: Record<string, unknown>, reason: string) => void;
}

export const WorkflowRunSidePanel: React.FC<WorkflowRunSidePanelProps> = ({ detail, context, onReplaceContext }) => (
	<Tabs defaultValue="context" keepMounted={false} className={classes.root}>
		<Tabs.List className={classes.list}>
			<Tabs.Tab value="context">Context</Tabs.Tab>
			<Tabs.Tab value="raw">Raw status</Tabs.Tab>
		</Tabs.List>

		<Tabs.Panel value="context" className={classes.panel}>
			<WorkflowRunContextPanel
				context={context}
				editable={detail.status === 'paused'}
				onReplace={onReplaceContext}
			/>
		</Tabs.Panel>

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
