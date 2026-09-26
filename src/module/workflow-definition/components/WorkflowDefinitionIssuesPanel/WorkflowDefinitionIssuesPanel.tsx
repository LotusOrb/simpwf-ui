import React from 'react';

import { Badge, ScrollArea, Text, UnstyledButton } from '@mantine/core';
import { LuCircleAlert, LuCircleCheck } from 'react-icons/lu';

import { useCoreSelector } from '@core/store';

import { MainLayoutPanelBar } from '@module/app/components/AppMainLayout';
import { useFocusEditorIssue } from '@module/workflow-definition/hooks';
import { selectEditorIssues, selectEditorNodes } from '@module/workflow-definition/store';

import classes from './WorkflowDefinitionIssuesPanel.module.scss';

const MAX_HEIGHT = 200;

export const WorkflowDefinitionIssuesPanel: React.FC = () => {
	const issues = useCoreSelector(selectEditorIssues);
	const nodes = useCoreSelector(selectEditorNodes);
	const focusIssue = useFocusEditorIssue();

	return (
		<MainLayoutPanelBar
			title="Issues"
			meta={
				issues.length > 0 ? (
					<Badge size="sm" color="red" variant="light">
						{issues.length}
					</Badge>
				) : (
					<span className={classes.check} aria-label="No issues">
						<LuCircleCheck size={14} />
					</span>
				)
			}
		>
			{issues.length === 0 ? (
				<div className={classes.ready}>
					<LuCircleCheck size={16} />
					<Text fz="sm">Ready to save</Text>
				</div>
			) : (
				<ScrollArea.Autosize mah={MAX_HEIGHT} type="auto" scrollbars="y">
					<div className={classes.list}>
						{issues.map((issue, index) => (
							<UnstyledButton
								key={`${issue.nodeId}-${index}`}
								className={classes.issue}
								onClick={() => focusIssue(issue)}
							>
								<LuCircleAlert size={14} className={classes.issueIcon} />
								<div className={classes.issueBody}>
									{issue.nodeId && nodes[issue.nodeId] && (
										<Text fz="xs" fw={600} truncate>
											{nodes[issue.nodeId].config.name || 'Untitled'}
										</Text>
									)}
									<Text fz="xs" c="dark.4">
										{issue.message}
									</Text>
								</div>
							</UnstyledButton>
						))}
					</div>
				</ScrollArea.Autosize>
			)}
		</MainLayoutPanelBar>
	);
};
