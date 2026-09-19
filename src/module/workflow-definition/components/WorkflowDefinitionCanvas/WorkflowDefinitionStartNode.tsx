import React from 'react';

import { Text } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuPlay } from 'react-icons/lu';

import { HANDLE_NEXT } from '@module/workflow-definition/data';

import classes from './WorkflowDefinitionCanvas.module.scss';
import type { WorkflowDefinitionStartFlowNode } from './WorkflowDefinitionCanvas.types';

export const WorkflowDefinitionStartNode: React.FC<NodeProps<WorkflowDefinitionStartFlowNode>> = ({ data }) => (
	<div className={classes.start} data-connected={data.connected || undefined}>
		<LuPlay size={12} aria-hidden />
		<Text fz="xs" fw={600}>
			Start
		</Text>
		<Handle type="source" id={HANDLE_NEXT} position={Position.Right} className={classes.handle} />
	</div>
);
