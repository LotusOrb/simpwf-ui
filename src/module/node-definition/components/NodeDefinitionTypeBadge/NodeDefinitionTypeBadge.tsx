import React from 'react';

import { Badge, type BadgeProps } from '@mantine/core';

import { nodeTypeMetaOf } from '@module/node-type/data';
import { useNodeTypeCatalog } from '@module/node-type/hooks';

interface NodeDefinitionTypeBadgeProps {
	type: string;
	size?: BadgeProps['size'];
	className?: string;
}

export const NodeDefinitionTypeBadge: React.FC<NodeDefinitionTypeBadgeProps> = ({ type, size = 'sm', className }) => {
	const { catalog } = useNodeTypeCatalog();
	const item = catalog.byType[type];
	const meta = nodeTypeMetaOf(type, item);
	return (
		<Badge
			size={size}
			className={className}
			color={meta.color}
			variant="light"
			tt="none"
			leftSection={<meta.icon size={11} />}
			title={item?.builtin ? undefined : 'Custom node type'}
		>
			{meta.label}
		</Badge>
	);
};
