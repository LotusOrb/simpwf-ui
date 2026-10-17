import React, { useState } from 'react';

import { ActionIcon, Anchor, Button, Collapse, Group, Stack, Text, TextInput, Tooltip } from '@mantine/core';
import { LuArrowRight, LuChevronDown, LuChevronRight, LuGitFork, LuGitMerge, LuPlus, LuTrash2 } from 'react-icons/lu';

import { useCoreDispatch, useCoreSelector } from '@core/store';

import { CodeEditor } from '@common/component/CodeEditor';

import { HANDLE_FAILURE, MAX_PARALLEL_BRANCHES, MIN_PARALLEL_BRANCHES } from '@module/workflow-definition/constant';
import {
	branchAdded,
	branchChanged,
	branchRemoved,
	failureOutputPropertyChanged,
	nodeSelected,
	scopeEntered,
	selectEditorEdges,
	selectEditorNodeDefinition,
	selectEditorNodes,
} from '@module/workflow-definition/store';
import type { WorkflowDefinitionEditorNode } from '@module/workflow-definition/types/WorkflowDefinitionEditorNode';
import {
	branchHandle,
	nextBranchKeys,
	nextParallelBranchNames,
	outgoingTarget,
	shortId,
} from '@module/workflow-definition/utils';

import { useContextTypes } from './InspectorContextTypes.context';
import { SectionLabel } from './InspectorControls';
import { usePartner } from './InspectorStructuralFields.utils';

/*
 * The fields the canvas owns: branches, the parallel pair, a group's contents and the failure route. They are drawn
 * as handles, edges and scopes, so they stay hand-built while every other node field is generated from the catalog.
 */

interface FieldsProps {
	node: WorkflowDefinitionEditorNode;
}

const ConditionsFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const nodes = useCoreSelector(selectEditorNodes);
	const edges = useCoreSelector(selectEditorEdges);
	const readOnly = !!node.config.node_definition_id;
	const contextTypes = useContextTypes();

	const addBranch = () => {
		const [key] = nextBranchKeys(nodes, node.parentId, 1);
		dispatch(branchAdded({ id: node.id, branch: { id: shortId(), key, condition: '' } }));
	};

	return (
		<Stack gap="sm">
			<div>
				<SectionLabel required>Branches</SectionLabel>
				<Text fz="xs" c="dimmed">
					Exactly one condition must return true. Connect each branch handle to its next node. A branch with
					no connection exits the {node.parentId ? 'group' : 'workflow'}.
				</Text>
			</div>

			{node.branches.map((branch, index) => {
				const target = outgoingTarget(edges, node.id, branchHandle(branch.id));
				return (
					<Stack key={branch.id} gap={6} p="xs" bd="1px solid gray.2" bdrs="md">
						<Group gap={6} wrap="nowrap" align="flex-end">
							<TextInput
								size="xs"
								flex={1}
								label="Key"
								placeholder={`branch_${index + 1}`}
								value={branch.key}
								readOnly={readOnly}
								onChange={(event) =>
									dispatch(
										branchChanged({
											id: node.id,
											branchId: branch.id,
											patch: { key: event.currentTarget.value },
										}),
									)
								}
							/>
							{!readOnly && (
								<Tooltip label="Remove branch">
									<ActionIcon
										size="md"
										color="red"
										aria-label={`Remove branch ${branch.key || index + 1}`}
										disabled={node.branches.length <= 2}
										onClick={() => dispatch(branchRemoved({ id: node.id, branchId: branch.id }))}
									>
										<LuTrash2 size={14} />
									</ActionIcon>
								</Tooltip>
							)}
						</Group>
						<Group gap={4} c="dimmed" wrap="nowrap">
							<LuArrowRight size={12} aria-hidden />
							<Text fz="xs" truncate>
								{target ? (nodes[target]?.config.name ?? 'Unknown node') : 'Exits scope'}
							</Text>
						</Group>
						<CodeEditor
							height={80}
							extraLib={contextTypes}
							readOnly={readOnly}
							placeholder="return context.amount > 1000;"
							value={branch.condition}
							onChange={(condition) =>
								dispatch(branchChanged({ id: node.id, branchId: branch.id, patch: { condition } }))
							}
						/>
					</Stack>
				);
			})}

			{!readOnly && (
				<Button
					variant="default"
					size="xs"
					leftSection={<LuPlus size={14} />}
					w="fit-content"
					onClick={addBranch}
				>
					Add branch
				</Button>
			)}
		</Stack>
	);
};

const PartnerLink: React.FC<{
	label: string;
	icon: React.ReactNode;
	partner: WorkflowDefinitionEditorNode | undefined;
	missing: string;
}> = ({ label, icon, partner, missing }) => {
	const dispatch = useCoreDispatch();
	return (
		<Group gap={6} wrap="nowrap">
			{icon}
			<Text fz="sm" c="dimmed">
				{label}:
			</Text>
			{partner ? (
				<Anchor component="button" type="button" fz="sm" onClick={() => dispatch(nodeSelected(partner.id))}>
					{partner.config.name || 'Untitled'}
				</Anchor>
			) : (
				<Text fz="sm" c="red.7">
					{missing}
				</Text>
			)}
		</Group>
	);
};

const ParallelStartFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const nodes = useCoreSelector(selectEditorNodes);
	const edges = useCoreSelector(selectEditorEdges);
	const join = usePartner(node);
	// A library parallel's branches come with the reference; only their routing is drawn here.
	const readOnly = !!node.config.node_definition_id;

	const addBranch = () => {
		const [key] = nextParallelBranchNames(node.branches, 1);
		dispatch(branchAdded({ id: node.id, branch: { id: shortId(), key, condition: '' } }));
	};

	return (
		<Stack gap="sm">
			<PartnerLink label="Joins at" icon={<LuGitMerge size={14} />} partner={join} missing="No join" />

			<div>
				<SectionLabel required>Branches</SectionLabel>
				<Text fz="xs" c="dimmed">
					Every branch runs at once on its own copy of the context. Connect each branch handle to the node it
					starts at; every path has to reach the join.
				</Text>
			</div>

			{node.branches.map((branch, index) => {
				const target = outgoingTarget(edges, node.id, branchHandle(branch.id));
				return (
					<Stack key={branch.id} gap={6} p="xs" bd="1px solid gray.2" bdrs="md">
						<Group gap={6} wrap="nowrap" align="flex-end">
							<TextInput
								size="xs"
								flex={1}
								label="Name"
								description={index === 0 ? 'Read in the join as branch["name"]' : undefined}
								inputWrapperOrder={['label', 'input', 'description']}
								placeholder={`branch_${index + 1}`}
								value={branch.key}
								readOnly={readOnly}
								onChange={(event) =>
									dispatch(
										branchChanged({
											id: node.id,
											branchId: branch.id,
											patch: { key: event.currentTarget.value },
										}),
									)
								}
							/>
							{!readOnly && (
								<Tooltip label="Remove branch">
									<ActionIcon
										size="md"
										color="red"
										aria-label={`Remove branch ${branch.key || index + 1}`}
										disabled={node.branches.length <= MIN_PARALLEL_BRANCHES}
										onClick={() => dispatch(branchRemoved({ id: node.id, branchId: branch.id }))}
									>
										<LuTrash2 size={14} />
									</ActionIcon>
								</Tooltip>
							)}
						</Group>
						<Group gap={4} c="dimmed" wrap="nowrap">
							<LuArrowRight size={12} aria-hidden />
							<Text fz="xs" truncate>
								{target ? (nodes[target]?.config.name ?? 'Unknown node') : 'Not connected'}
							</Text>
						</Group>
					</Stack>
				);
			})}

			{!readOnly && (
				<Button
					variant="default"
					size="xs"
					leftSection={<LuPlus size={14} />}
					w="fit-content"
					disabled={node.branches.length >= MAX_PARALLEL_BRANCHES}
					onClick={addBranch}
				>
					Add branch
				</Button>
			)}
		</Stack>
	);
};

/** The join's pair link and how combining works; its combining script is a generated field. */
const ParallelEndFields: React.FC<FieldsProps> = ({ node }) => {
	const start = usePartner(node);
	const [helpOpened, setHelpOpened] = useState(false);

	return (
		<>
			<PartnerLink label="Pairs with" icon={<LuGitFork size={14} />} partner={start} missing="No parallel" />
			<Stack gap={4}>
				<Button
					variant="subtle"
					color="gray"
					size="compact-xs"
					w="fit-content"
					leftSection={helpOpened ? <LuChevronDown size={12} /> : <LuChevronRight size={12} />}
					onClick={() => setHelpOpened((opened) => !opened)}
					aria-expanded={helpOpened}
				>
					How combining works
				</Button>
				<Collapse expanded={helpOpened}>
					<Stack gap={4}>
						<Text fz="xs" c="dimmed">
							`branch["name"]` holds each branch's `context`, `status`, `branch_id` and `start_node_id`.
							It is read-only.
						</Text>
						<Text fz="xs" c="dimmed">
							`context` starts as the context from before the fork. Whatever it holds when the script ends
							replaces the workflow context.
						</Text>
						<Text fz="xs" c="dimmed">
							Nothing is merged automatically: copy every branch value you want to keep. Renaming a branch
							doesn't update the combining script.
						</Text>
					</Stack>
				</Collapse>
			</Stack>
		</>
	);
};

const GroupFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const nodes = useCoreSelector(selectEditorNodes);
	const childCount = Object.values(nodes).filter((child) => child.parentId === node.id).length;
	// A group definition's canvas is always inside its group.
	const isOpen = useCoreSelector(selectEditorNodeDefinition)?.rootId === node.id;

	return (
		<Stack gap="xs">
			<SectionLabel>Contents</SectionLabel>
			<Text fz="sm" c="dimmed">
				{childCount === 0
					? `This group is empty. ${isOpen ? 'Add' : 'Open it to add'} nodes and connect its Start.`
					: `${childCount} ${childCount === 1 ? 'node' : 'nodes'} inside. The group continues to its next node when its inner graph exits.`}
			</Text>
			{!isOpen && (
				<Button variant="default" w="fit-content" onClick={() => dispatch(scopeEntered(node.id))}>
					Open group
				</Button>
			)}
		</Stack>
	);
};

export const FailureFields: React.FC<FieldsProps> = ({ node }) => {
	const dispatch = useCoreDispatch();
	const edges = useCoreSelector(selectEditorEdges);
	const nodes = useCoreSelector(selectEditorNodes);
	const target = outgoingTarget(edges, node.id, HANDLE_FAILURE);

	return (
		<Stack gap={6}>
			<SectionLabel required={!!target}>On failure</SectionLabel>
			<Text fz="xs" c="dimmed">
				{target
					? `Failures route to "${nodes[target]?.config.name ?? 'Unknown node'}" instead of failing the workflow.`
					: 'Connect the red handle to a fallback node to recover from failures.'}
			</Text>
			<TextInput
				placeholder="lookup_error"
				aria-label="Failure output property"
				description="Context key receiving { message, reason, result }"
				inputWrapperOrder={['input', 'description']}
				value={node.failureOutputProperty}
				onChange={(event) =>
					dispatch(failureOutputPropertyChanged({ id: node.id, value: event.currentTarget.value }))
				}
			/>
		</Stack>
	);
};

/** The hand-built part of a node's setup: only the types whose fields are graph structure have one. */
export const InspectorStructuralFields: React.FC<FieldsProps> = ({ node }) => {
	switch (node.config.type) {
		case 'conditions':
			return <ConditionsFields node={node} />;
		case 'parallel_start':
			return <ParallelStartFields node={node} />;
		case 'parallel_end':
			return <ParallelEndFields node={node} />;
		case 'group':
			return <GroupFields node={node} />;
		default:
			return null;
	}
};

export { ConditionsFields, ParallelStartFields };
