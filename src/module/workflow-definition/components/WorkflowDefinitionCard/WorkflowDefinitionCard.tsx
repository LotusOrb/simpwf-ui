import React from 'react';

import { ActionIcon, Badge, Card, Group, Menu, Skeleton, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuEllipsisVertical, LuTrash2 } from 'react-icons/lu';
import { Link } from 'react-router';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

import { complexityMeta, countNodes, getComplexity, getNodeTypes, getStartNode, nodeTypeMeta } from '../../data';
import { WorkflowDefinitionPreview } from '../WorkflowDefinitionPreview';
import classes from './WorkflowDefinitionCard.module.scss';

dayjs.extend(relativeTime);

interface WorkflowDefinitionCardProps {
	definition: WorkflowDefinition;
	onDelete?: (definition: WorkflowDefinition) => void;
}

export const WorkflowDefinitionCard: React.FC<WorkflowDefinitionCardProps> = ({ definition, onDelete }) => {
	const { content } = definition;
	const complexity = complexityMeta[getComplexity(content)];
	const nodeCount = countNodes(content);
	const startNode = getStartNode(content);
	const startMeta = startNode && nodeTypeMeta[startNode.type];

	return (
		<Card className={classes.root} padding="xs">
			<div className={classes.preview}>
				<WorkflowDefinitionPreview content={content} />
				<Group gap={4} wrap="nowrap" className={classes.badges}>
					<Badge
						color={startMeta?.color ?? 'gray'}
						variant="white"
						leftSection={startMeta && <startMeta.icon size={11} />}
					>
						{startMeta?.label ?? 'Unknown'}
					</Badge>
					<Badge color="gray" variant="white">
						v{definition.version}
					</Badge>
				</Group>
				<Badge color={complexity.color} variant="white" className={classes.complexity}>
					{complexity.label}
				</Badge>
				{onDelete && (
					<Menu position="bottom-end" shadow="md" withinPortal>
						<Menu.Target>
							<ActionIcon
								size={26}
								variant="default"
								className={classes.menu}
								aria-label={`Actions for ${definition.name}`}
							>
								<LuEllipsisVertical size={14} />
							</ActionIcon>
						</Menu.Target>
						<Menu.Dropdown>
							<Menu.Item color="red" leftSection={<LuTrash2 size={14} />} onClick={() => onDelete(definition)}>
								Delete
							</Menu.Item>
						</Menu.Dropdown>
					</Menu>
				)}
			</div>

			<div className={classes.body}>
				<Text
					component={Link}
					to={definition.id}
					fz="sm"
					fw={600}
					lineClamp={2}
					title={definition.name}
					className={classes.link}
				>
					{definition.name}
				</Text>
				<Text fz="xs" c="dimmed" mt={2} title={dayjs(definition.created_at).format('DD MMM YYYY HH:mm')}>
					{dayjs(definition.created_at).fromNow()}
				</Text>

				<Text fz="xs" c="dimmed" mt={4}>
					{nodeCount} {nodeCount === 1 ? 'node' : 'nodes'}
				</Text>

				<Group gap={4} mt="xs" wrap="nowrap">
					{getNodeTypes(content).map((type) => {
						const meta = nodeTypeMeta[type];
						return (
							<Tooltip key={type} label={meta.label}>
								<ThemeIcon size={24} variant="default" radius="sm" c={`${meta.color}.6`} className={classes.nodeType}>
									<meta.icon size={13} />
								</ThemeIcon>
							</Tooltip>
						);
					})}
				</Group>
			</div>
		</Card>
	);
};

export const WorkflowDefinitionCardSkeleton: React.FC = () => (
	<Card className={classes.root} padding="xs">
		<Skeleton height={148} radius="sm" />
		<div className={classes.body}>
			<Skeleton height={12} width="60%" />
			<Skeleton height={8} width="25%" mt={8} />
			<Skeleton height={8} width="30%" mt={8} />
			<Group gap={4} mt="xs">
				<Skeleton height={24} width={24} />
				<Skeleton height={24} width={24} />
				<Skeleton height={24} width={24} />
			</Group>
		</div>
	</Card>
);
