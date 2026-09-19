import React from 'react';

import { Text, ThemeIcon, Tooltip } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuCircleAlert, LuLibrary } from 'react-icons/lu';

import {
	branchHandle,
	HANDLE_FAILURE,
	HANDLE_NEXT,
	isInlineGroup,
	nodeTypeMeta,
	supportsFailure,
} from '@module/workflow-definition/data';
import type { WorkflowDefinitionNodeConfig } from '@module/workflow-definition/types/WorkflowDefinitionNodeConfig';

import classes from './WorkflowDefinitionCanvas.module.scss';
import type { WorkflowDefinitionStepFlowNode } from './WorkflowDefinitionCanvas.types';

const summarize = (config: WorkflowDefinitionNodeConfig, childCount: number): string | null => {
	switch (config.type) {
		case 'script':
			return config.input_data ? `input ← ${config.input_data}` : null;
		case 'input':
			return config.context_path ? `${config.channel} → ${config.context_path}` : (config.channel ?? null);
		case 'output':
			return config.context_path ? `${config.context_path} → ${config.channel}` : (config.channel ?? null);
		case 'external_call':
			if (config.execution_config) return `$ ${config.execution_config.command.join(' ')}`.trim();
			return config.http_config?.url ? `${config.http_config.method || 'GET'} ${config.http_config.url}` : null;
		case 'poller':
			if (config.redis)
				return `redis ${config.redis.method} ${config.redis.key ?? config.redis.channel ?? ''}`.trim();
			if (config.rabbitmq) return config.rabbitmq.queue ? `queue ${config.rabbitmq.queue}` : 'rabbitmq';
			return config.http?.url ? `${config.http.method || 'GET'} ${config.http.url}` : null;
		case 'group':
			return `${childCount} ${childCount === 1 ? 'node' : 'nodes'} · double-click to open`;
		default:
			return null;
	}
};

export const WorkflowDefinitionStepNode: React.FC<NodeProps<WorkflowDefinitionStepFlowNode>> = ({ data, selected }) => {
	const { node, issueCount, childCount, branchTargets } = data;
	const { config } = node;
	const meta = nodeTypeMeta[config.type];
	const summary = node.reference ? null : summarize(config, childCount);
	const isConditions = config.type === 'conditions';

	return (
		<div
			className={classes.node}
			data-selected={selected || undefined}
			data-invalid={issueCount > 0 || undefined}
			data-group={isInlineGroup(node) || undefined}
		>
			<Handle type="target" position={Position.Left} className={classes.handle} />

			<div className={classes.nodeHeader}>
				<ThemeIcon size={32} variant="light" color={meta.color} radius="sm">
					<meta.icon size={16} />
				</ThemeIcon>
				<div className={classes.nodeTitle}>
					<Text fz="sm" fw={600} truncate title={config.name}>
						{config.name || 'Untitled'}
					</Text>
					<Text fz="xs" c="dimmed" truncate>
						{meta.label}
					</Text>
				</div>
				{issueCount > 0 && (
					<Tooltip label={`${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} to fix`}>
						<span className={classes.issue}>
							<LuCircleAlert size={16} />
						</span>
					</Tooltip>
				)}
			</div>

			{node.reference && (
				<div className={classes.reference}>
					<LuLibrary size={12} aria-hidden />
					<Text fz={11} truncate>
						{node.reference.name} v{node.reference.version}
					</Text>
				</div>
			)}

			{summary && (
				<Text className={classes.summary} truncate title={summary}>
					{summary}
				</Text>
			)}

			{isConditions ? (
				<div className={classes.branches}>
					{node.branches.map((branch, index) => (
						<div key={branch.id} className={classes.branch}>
							<Text fz={11} fw={500} truncate c={branchTargets[branch.id] ? 'dark.5' : 'dimmed'}>
								{branch.key || `Branch ${index + 1} (exit)`}
							</Text>
							<Handle
								type="source"
								id={branchHandle(branch.id)}
								position={Position.Right}
								className={classes.handle}
								data-kind="branch"
							/>
						</div>
					))}
				</div>
			) : (
				<Handle type="source" id={HANDLE_NEXT} position={Position.Right} className={classes.handle} />
			)}

			{supportsFailure(config.type) && (
				<>
					<Text className={classes.failureLabel}>on failure</Text>
					<Handle
						type="source"
						id={HANDLE_FAILURE}
						position={Position.Bottom}
						className={classes.handle}
						data-kind="failure"
					/>
				</>
			)}
		</div>
	);
};
