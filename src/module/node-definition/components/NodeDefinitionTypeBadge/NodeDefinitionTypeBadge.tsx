import React from 'react';

import { Badge, type BadgeProps } from '@mantine/core';

import { isBuiltinNodeType, nodeDefinitionTypeMeta } from '@module/node-definition/data';

interface NodeDefinitionTypeBadgeProps {
	type: string;
	size?: BadgeProps['size'];
}

export const NodeDefinitionTypeBadge: React.FC<NodeDefinitionTypeBadgeProps> = ({ type, size = 'sm' }) => {
	const meta = nodeDefinitionTypeMeta(type);
	return (
		<Badge
			size={size}
			color={meta.color}
			variant="light"
			tt="none"
			leftSection={<meta.icon size={11} />}
			title={isBuiltinNodeType(type) ? undefined : 'Custom node type'}
		>
			{meta.label}
		</Badge>
	);
};
