import React, { useMemo, useState } from 'react';

import { Badge, Button, Group, Paper, Progress, Stack, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import { LuArrowRight, LuChevronDown, LuChevronRight, LuGitFork, LuHourglass } from 'react-icons/lu';

import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import {
	buildParallelTree,
	formatWaitingReason,
	parallelBranchStatusMeta,
	parallelExecutionStatusMeta,
	sortBranches,
	type WorkflowRunParallelTreeItem,
} from '@module/workflow-run/data';
import type { WorkflowRunParallelBranch } from '@module/workflow-run/types/WorkflowRunParallelBranch';
import type { WorkflowRunParallelExecution } from '@module/workflow-run/types/WorkflowRunParallelExecution';

import classes from './WorkflowRunParallelPanel.module.scss';

/** Indent per nesting level, on top of the panel padding. */
const DEPTH_INDENT = 14;

interface BranchActions {
	nodeName: (nodeId: string) => string;
	selectedNodeId: string | null;
	onSelectNode: (nodeId: string) => void;
	/** Branches a payload can be delivered to right now. */
	inputBranchIds: Set<string>;
	onProvideInput?: (branchId: string) => void;
}

const BranchRow: React.FC<BranchActions & { branch: WorkflowRunParallelBranch }> = ({
	branch,
	nodeName,
	selectedNodeId,
	onSelectNode,
	inputBranchIds,
	onProvideInput,
}) => {
	const meta = parallelBranchStatusMeta[branch.status];

	return (
		<div className={classes.branch} data-selected={branch.start_node_id === selectedNodeId || undefined}>
			<Stack gap={2} className={classes.branchName}>
				<UnstyledButton
					className={classes.branchSelect}
					title={`Show ${nodeName(branch.start_node_id)} on the graph`}
					onClick={() => onSelectNode(branch.start_node_id)}
				>
					<meta.icon
						size={13}
						className={classes.branchIcon}
						color={`var(--mantine-color-${meta.color}-6)`}
						aria-hidden
					/>
					<Text fz="xs" fw={600} truncate>
						{branch.name}
					</Text>
					<Badge size="xs" variant="light" color={meta.color} ml="auto">
						{meta.label}
					</Badge>
				</UnstyledButton>
				{branch.waiting_reason && (
					<Text fz={11} c="dimmed">
						{formatWaitingReason(branch.waiting_reason)}
					</Text>
				)}
				{branch.error && (
					<Text fz={11} c="red.7" className={classes.error}>
						{branch.error}
					</Text>
				)}
				{onProvideInput && inputBranchIds.has(branch.id) && (
					<Button
						size="compact-xs"
						variant="light"
						leftSection={<LuHourglass size={11} />}
						onClick={() => onProvideInput(branch.id)}
						w="fit-content"
					>
						Provide input
					</Button>
				)}
			</Stack>
		</div>
	);
};

const ExecutionProgress: React.FC<{ execution: WorkflowRunParallelExecution }> = ({ execution }) => {
	const meta = parallelExecutionStatusMeta[execution.status];
	const percent = execution.branch_count === 0 ? 0 : (execution.completed_count / execution.branch_count) * 100;

	return (
		<Group gap="xs" wrap="nowrap">
			<Progress value={percent} color={meta.color} size="sm" flex={1} />
			<Text fz={11} c="dimmed" style={{ fontVariantNumeric: 'tabular-nums' }}>
				{execution.completed_count}/{execution.branch_count} branches
			</Text>
		</Group>
	);
};

const ExecutionCard: React.FC<BranchActions & { item: WorkflowRunParallelTreeItem }> = ({ item, ...actions }) => {
	const [historyOpened, setHistoryOpened] = useState(false);
	const { execution, history, depth } = item;
	const meta = parallelExecutionStatusMeta[execution.status];

	return (
		<Paper withBorder p="sm" className={classes.card} ml={(depth - 1) * DEPTH_INDENT}>
			<Stack gap="xs">
				<Group gap="xs" wrap="nowrap">
					<ThemeIcon size={24} radius="sm" variant="light" color="indigo">
						<LuGitFork size={13} />
					</ThemeIcon>
					<Group gap={4} wrap="nowrap" className={classes.route}>
						<Text fz="xs" fw={600} truncate title={execution.start_node_id}>
							{actions.nodeName(execution.start_node_id)}
						</Text>
						<LuArrowRight size={11} aria-hidden />
						<Text fz="xs" fw={600} truncate title={execution.end_node_id}>
							{actions.nodeName(execution.end_node_id)}
						</Text>
					</Group>
					<Badge size="xs" variant="light" color={meta.color} leftSection={<meta.icon size={9} />}>
						{meta.label}
					</Badge>
				</Group>

				<ExecutionProgress execution={execution} />

				<Stack gap={0}>
					{sortBranches(execution.branches).map((branch) => (
						<BranchRow key={branch.id} branch={branch} {...actions} />
					))}
				</Stack>

				{history.length > 0 && (
					<Stack gap={6} className={classes.history}>
						<Button
							size="compact-xs"
							variant="subtle"
							color="gray"
							w="fit-content"
							leftSection={historyOpened ? <LuChevronDown size={12} /> : <LuChevronRight size={12} />}
							onClick={() => setHistoryOpened((opened) => !opened)}
						>
							History · {history.length} earlier {history.length === 1 ? 'fork' : 'forks'}
						</Button>
						{historyOpened &&
							history.map((past) => {
								const pastMeta = parallelExecutionStatusMeta[past.status];
								return (
									<Stack key={past.id} gap={4}>
										<Group gap="xs" justify="space-between">
											<Text fz={11} c="dimmed" ff="monospace" title={past.id}>
												{past.id.slice(-8)}
											</Text>
											<Badge size="xs" variant="light" color={pastMeta.color}>
												{pastMeta.label}
											</Badge>
										</Group>
										<ExecutionProgress execution={past} />
										<Stack gap={0}>
											{sortBranches(past.branches).map((branch) => (
												<BranchRow
													key={branch.id}
													branch={branch}
													{...actions}
													// A superseded fork takes no input.
													onProvideInput={undefined}
												/>
											))}
										</Stack>
									</Stack>
								);
							})}
					</Stack>
				)}
			</Stack>
		</Paper>
	);
};

interface WorkflowRunParallelPanelProps {
	executions: WorkflowRunParallelExecution[];
	nodesById: Map<string, WorkflowDefinitionNode>;
	selectedNodeId: string | null;
	/** Highlights a branch's first node on the run graph. */
	onSelectNode: (nodeId: string) => void;
	inputBranchIds: Set<string>;
	/** Omitted when the caller cannot deliver input. */
	onProvideInput?: (branchId: string) => void;
}

/** The run's fork/join executions, nested by the branch each nested fork runs in. */
export const WorkflowRunParallelPanel: React.FC<WorkflowRunParallelPanelProps> = ({
	executions,
	nodesById,
	...actions
}) => {
	const tree = useMemo(() => buildParallelTree(executions), [executions]);
	const nodeName = (nodeId: string) => nodesById.get(nodeId)?.name ?? nodeId;

	return (
		<Stack gap="sm" p="md">
			{tree.map((item) => (
				<ExecutionCard key={item.execution.id} item={item} nodeName={nodeName} {...actions} />
			))}
		</Stack>
	);
};
