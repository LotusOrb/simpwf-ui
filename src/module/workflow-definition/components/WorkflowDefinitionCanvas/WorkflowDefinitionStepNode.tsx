import React from 'react';

import { CopyButton, Text, ThemeIcon, Tooltip, UnstyledButton } from '@mantine/core';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { LuCheck, LuCircleAlert, LuCopy, LuTimer } from 'react-icons/lu';

import { useCoreSelector } from '@core/store';

import { nodeTypeMetaOf, selectNodeTypeCatalog } from '@module/node-type/utils';
import { HANDLE_FAILURE, HANDLE_NEXT, HANDLE_PAIR } from '@module/workflow-definition/constant';
import {
	branchHandle,
	defaultOutputProperty,
	hasBranches,
	isInlineGroup,
	nodeSubtitle,
	shownStartDelay,
	supportsFailure,
	supportsNext,
} from '@module/workflow-definition/utils';

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
	const { node, issueCount, branchTargets, pairedStart, pairedSelected, standalone } = data;
	const { config } = node;
	const catalog = useCoreSelector(selectNodeTypeCatalog);
	const meta = nodeTypeMetaOf(config.type, catalog.byType[config.type]);
	const isParallel = config.type === 'parallel_start';
	const hasFailure = supportsFailure(config.type, catalog);
	const startDelay = shownStartDelay(config);

	const outputProperty = config.output_property || defaultOutputProperty(config, catalog);
	const failureOutputProperty = hasFailure ? node.failureOutputProperty.trim() : '';
	const hasOutputs = Boolean(outputProperty || failureOutputProperty);

	return (
		<div className={classes.stepNode} data-selected={selected || undefined} data-outputs={hasOutputs || undefined}>
			<div
				className={classes.node}
				data-selected={selected || undefined}
				data-invalid={issueCount > 0 || undefined}
				data-group={isInlineGroup(node) || undefined}
				data-paired-selected={(pairedSelected && !selected) || undefined}
			>
				{!standalone && <Handle type="target" position={Position.Left} className={classes.handle} />}

				<div className={classes.nodeHeader}>
					<ThemeIcon size={44} variant="light" color={meta.color} radius="md">
						<meta.icon size={20} />
					</ThemeIcon>
					<div className={classes.nodeTitle}>
						<Text fz="sm" fw={600} truncate title={config.name}>
							{config.name || 'Untitled'}
						</Text>
						<Text fz="xs" c="dimmed" truncate>
							{nodeSubtitle(config, meta.label)}
						</Text>
					</div>
					{startDelay && (
						<Tooltip label={`Waits ${startDelay} on arrival`}>
							<span className={classes.startDelay}>
								<LuTimer size={11} aria-hidden />
								{startDelay}
							</span>
						</Tooltip>
					)}
					{issueCount > 0 && (
						<Tooltip label={`${issueCount} ${issueCount === 1 ? 'issue' : 'issues'} to fix`}>
							<span className={classes.issue}>
								<LuCircleAlert size={16} />
							</span>
						</Tooltip>
					)}
				</div>

				{pairedStart && (
					<Text className={classes.pairBadge} truncate title={pairedStart.name}>
						{pairedStart.name || 'Untitled'} · waits for {pairedStart.branchCount}{' '}
						{pairedStart.branchCount === 1 ? 'branch' : 'branches'}
					</Text>
				)}

				{hasBranches(config.type) && node.branches.length > 0 && (
					<div className={classes.branches}>
						{node.branches.map((branch, index) => (
							<div
								key={branch.id}
								className={classes.branch}
								data-kind={isParallel ? 'parallel' : undefined}
							>
								<Text fz={11} fw={500} truncate c={branchTargets[branch.id] ? 'dark.5' : 'dimmed'}>
									{isParallel
										? branch.key.trim() || 'Unnamed branch'
										: branch.key || `Branch ${index + 1} (exit)`}
								</Text>
								{!standalone && (
									<Handle
										type="source"
										id={branchHandle(branch.id)}
										position={Position.Right}
										className={classes.handle}
										data-kind={isParallel ? 'parallel' : 'branch'}
									/>
								)}
							</div>
						))}
					</div>
				)}
				{supportsNext(config.type, catalog) && !standalone && (
					<Handle type="source" id={HANDLE_NEXT} position={Position.Right} className={classes.handle} />
				)}

				{/* Anchors for the derived start → join edge, after the real handles so they are never the default. */}
				{isParallel && (
					<Handle
						type="source"
						id={HANDLE_PAIR}
						position={Position.Bottom}
						isConnectable={false}
						className={classes.pairHandle}
					/>
				)}
				{config.type === 'parallel_end' && (
					<Handle
						type="target"
						id={HANDLE_PAIR}
						position={Position.Bottom}
						isConnectable={false}
						className={classes.pairHandle}
					/>
				)}

				{hasFailure && !standalone && (
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
