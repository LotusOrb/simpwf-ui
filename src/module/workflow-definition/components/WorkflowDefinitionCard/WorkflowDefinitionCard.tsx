import React from 'react';

import { Badge, Button, Card, Group, Skeleton, Text, ThemeIcon, Tooltip } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import { LuClock, LuLayers, LuZap } from 'react-icons/lu';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

import { complexityMeta, countNodes, getComplexity, getNodeTypes, getStartNode, nodeTypeMeta } from '../../data';
import { WorkflowDefinitionPreview } from '../WorkflowDefinitionPreview';
import classes from './WorkflowDefinitionCard.module.scss';

dayjs.extend(relativeTime);

interface WorkflowDefinitionCardProps {
	definition: WorkflowDefinition;
}

export const WorkflowDefinitionCard: React.FC<WorkflowDefinitionCardProps> = ({ definition }) => {
	const { content } = definition;
	const complexity = complexityMeta[getComplexity(content)];
	const startNode = getStartNode(content);
	const nodeCount = countNodes(content);

	return (
		<Card className={classes.root} padding="xs">
			<div className={classes.preview}>
				<WorkflowDefinitionPreview content={content} />
				<Badge color={complexity.color} variant="white" className={classes.complexity}>
					{complexity.label}
				</Badge>
			</div>

			<div className={classes.body}>
				<Group gap={6} wrap="nowrap">
					<Text fz="sm" fw={600} truncate title={definition.name}>
						{definition.name}
					</Text>
					<Badge size="xs" color="gray" className={classes.version}>
						v{definition.version}
					</Badge>
				</Group>

				<Group gap={6} mt={4} c="dimmed" wrap="nowrap" className={classes.meta}>
					<Group gap={3} wrap="nowrap">
						<LuZap size={11} aria-hidden />
						<span>{startNode ? nodeTypeMeta[startNode.type].label : 'Unknown'}</span>
					</Group>
					<span aria-hidden>/</span>
					<Group gap={3} wrap="nowrap">
						<LuLayers size={11} aria-hidden />
						<span>{nodeCount} nodes</span>
					</Group>
					<span aria-hidden>/</span>
					<Group gap={3} wrap="nowrap">
						<LuClock size={11} aria-hidden />
						<span title={dayjs(definition.updated_at).format('DD MMM YYYY HH:mm')}>
							{dayjs(definition.updated_at).fromNow()}
						</span>
					</Group>
				</Group>

				<Group justify="space-between" mt="sm" wrap="nowrap">
					<Group gap={4} wrap="nowrap">
						{getNodeTypes(content).map((type) => {
							const meta = nodeTypeMeta[type];
							return (
								<Tooltip key={type} label={meta.label}>
									<ThemeIcon size={24} variant="default" radius="sm" c={`${meta.color}.6`}>
										<meta.icon size={13} />
									</ThemeIcon>
								</Tooltip>
							);
						})}
					</Group>
					<Button size="compact-xs" radius="xl" px="sm">
						View detail
					</Button>
				</Group>
			</div>
		</Card>
	);
};

export const WorkflowDefinitionCardSkeleton: React.FC = () => (
	<Card className={classes.root} padding="xs">
		<Skeleton height={132} radius="sm" />
		<div className={classes.body}>
			<Skeleton height={12} width="60%" />
			<Skeleton height={8} width="80%" mt={10} />
			<Group justify="space-between" mt="sm">
				<Skeleton height={24} width={80} />
				<Skeleton height={22} width={72} radius="xl" />
			</Group>
		</div>
	</Card>
);
