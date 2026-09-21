import React from 'react';

import { Text } from '@mantine/core';
import type { NodeProps } from '@xyflow/react';
import { LuBoxes } from 'react-icons/lu';

import classes from './WorkflowRunGraph.module.scss';
import type { WorkflowRunGroupFlowNode } from './WorkflowRunGraph.types';

export const WorkflowRunGraphGroup: React.FC<NodeProps<WorkflowRunGroupFlowNode>> = ({ data }) => {
	const { name, reached } = data;

	return (
		<div className={classes.group} data-reached={reached || undefined}>
			<div className={classes.groupLabel}>
				<LuBoxes size={12} aria-hidden />
				<Text fz={11} fw={600} span>
					{name}
				</Text>
			</div>
		</div>
	);
};
