import React from 'react';

import { BaseEdge, getSmoothStepPath, type EdgeProps } from '@xyflow/react';

/** The derived start → join link: it routes nothing, it only outlines the parallel block below its nodes. */
export const WorkflowDefinitionPairEdge: React.FC<EdgeProps> = ({
	sourceX,
	sourceY,
	sourcePosition,
	targetX,
	targetY,
	targetPosition,
}) => {
	const [path] = getSmoothStepPath({
		sourceX,
		sourceY,
		sourcePosition,
		targetX,
		targetY,
		targetPosition,
		offset: 28,
		borderRadius: 12,
	});
	return <BaseEdge path={path} interactionWidth={0} />;
};
