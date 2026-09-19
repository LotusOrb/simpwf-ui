import React from 'react';

import { ScrollArea, UnstyledButton } from '@mantine/core';

import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

import { runStatusMeta, runStatusOrder } from '../../data';
import classes from './WorkflowRunStatusTabs.module.scss';

export type WorkflowRunStatusTab = WorkflowRunStatus | 'all';

interface WorkflowRunStatusTabsProps {
	value: WorkflowRunStatusTab;
	counts: Record<WorkflowRunStatusTab, number> | null;
	onChange: (value: WorkflowRunStatusTab) => void;
}

const tabs: { value: WorkflowRunStatusTab; label: string; color?: string }[] = [
	{ value: 'all', label: 'All runs' },
	...runStatusOrder.map((status) => ({
		value: status,
		label: runStatusMeta[status].label,
		color: runStatusMeta[status].color,
	})),
];

export const WorkflowRunStatusTabs: React.FC<WorkflowRunStatusTabsProps> = ({ value, counts, onChange }) => {
	return (
		<ScrollArea scrollbars="x" type="never">
			<div className={classes.root} role="tablist" aria-label="Filter runs by status">
				{tabs.map((tab) => (
					<UnstyledButton
						key={tab.value}
						role="tab"
						aria-selected={tab.value === value}
						className={classes.tab}
						data-active={tab.value === value || undefined}
						onClick={() => onChange(tab.value)}
					>
						{tab.color && (
							<span
								className={classes.dot}
								style={{ backgroundColor: `var(--mantine-color-${tab.color}-5)` }}
							/>
						)}
						{tab.label}
						<span className={classes.count}>{counts ? counts[tab.value] : '–'}</span>
					</UnstyledButton>
				))}
			</div>
		</ScrollArea>
	);
};
