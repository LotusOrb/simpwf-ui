import React from 'react';

import { CopyButton, Text, ThemeIcon, Tooltip, UnstyledButton } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuCheck, LuCircleAlert, LuCopy } from 'react-icons/lu';

import {
	branchHandle,
	defaultOutputProperty,
	HANDLE_FAILURE,
	HANDLE_NEXT,
	isInlineGroup,
	nodeTypeMeta,
	supportsFailure,
} from '@module/workflow-definition/data';

import classes from './WorkflowDefinitionCanvas.module.scss';
import type { WorkflowDefinitionStepFlowNode } from './WorkflowDefinitionCanvas.types';

type OutputRowProps = {
	label: string;
	property: string;
	isDefault?: boolean;
	kind?: 'failure';
};

const OutputRow: React.FC<OutputRowProps> = ({ label, property, isDefault, kind }) => {
	const reference = `context.${property}`;

	return (
		<CopyButton value={reference} timeout={1500}>
			{({ copied, copy }) => (
				<Tooltip label={copied ? 'Copied' : `Copy ${reference}`} position="bottom" withinPortal>
					<UnstyledButton
						className={`${classes.outputRow} nodrag nopan`}
						data-kind={kind}
						data-default={isDefault || undefined}
						onClick={(event) => {
							event.stopPropagation();
							copy();
						}}
					>
						<Text className={classes.outputLabel}>{label}</Text>
						<Text className={classes.outputProperty} truncate title={property}>
							{property}
						</Text>
						{isDefault && <Text className={classes.outputHint}>default</Text>}
						<span className={classes.outputCopy} data-copied={copied || undefined}>
							{copied ? <LuCheck size={12} /> : <LuCopy size={12} />}
						</span>
					</UnstyledButton>
				</Tooltip>
			)}
		</CopyButton>
	);
};

export const WorkflowDefinitionStepNode: React.FC<NodeProps<WorkflowDefinitionStepFlowNode>> = ({ data, selected }) => {
	const { node, issueCount, branchTargets } = data;
	const { config } = node;
	const meta = nodeTypeMeta[config.type];
	const isConditions = config.type === 'conditions';
	const hasFailure = supportsFailure(config.type);

	const outputProperty = config.output_property || defaultOutputProperty(config);
	const failureOutputProperty = hasFailure ? node.failureOutputProperty.trim() : '';
	const hasOutputs = Boolean(outputProperty || failureOutputProperty);

	return (
		<div className={classes.stepNode} data-selected={selected || undefined} data-outputs={hasOutputs || undefined}>
			<div
				className={classes.node}
				data-selected={selected || undefined}
				data-invalid={issueCount > 0 || undefined}
				data-group={isInlineGroup(node) || undefined}
			>
				<Handle type="target" position={Position.Left} className={classes.handle} />

				<div className={classes.nodeHeader}>
					<ThemeIcon size={44} variant="light" color={meta.color} radius="md">
						<meta.icon size={20} />
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

				{hasFailure && (
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

			{hasOutputs && (
				<div className={classes.outputTray}>
					{outputProperty && (
						<OutputRow label="output" property={outputProperty} isDefault={!config.output_property} />
					)}
					{failureOutputProperty && (
						<OutputRow label="on failure" property={failureOutputProperty} kind="failure" />
					)}
				</div>
			)}
		</div>
	);
};
