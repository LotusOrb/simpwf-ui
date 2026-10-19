import React, { useMemo, useState } from 'react';

import {
	Alert,
	Badge,
	Button,
	Center,
	Group,
	List,
	Loader,
	Modal,
	Radio,
	ScrollArea,
	Select,
	SimpleGrid,
	Stack,
	Stepper,
	Switch,
	Text,
	Textarea,
} from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import dayjs from 'dayjs';
import { LuGitBranchPlus, LuInfo, LuTriangleAlert } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { CodeEditor } from '@common/component/CodeEditor';

import { useNotify } from '@module/notification/hooks';
import {
	useGetWorkflowDefinitionQuery,
	useListWorkflowDefinitionVersionsQuery,
} from '@module/workflow-definition/hooks';
import type { WorkflowDefinitionNode } from '@module/workflow-definition/types/WorkflowDefinitionNode';
import { parallelInterior } from '@module/workflow-definition/utils';
import {
	useGetWorkflowRunContextQuery,
	useGetWorkflowRunQuery,
	useMigrateWorkflowRunMutation,
} from '@module/workflow-run/hooks';
import type { WorkflowRunMigrateStep } from '@module/workflow-run/types/WorkflowRunMigrateStep';
import {
	buildRunGraph,
	describeMigrateError,
	diffDefinitionNodes,
	indexDefinitionNodes,
	migrateSourceNodeId,
	type WorkflowRunMigrateErrorCopy,
} from '@module/workflow-run/utils';

import { WorkflowRunMigrateGraph } from './WorkflowRunMigrateGraph';
import classes from './WorkflowRunMigrateModal.module.scss';

const RUN_ROUTE = '/app/workflow-run';

const STEPS: WorkflowRunMigrateStep[] = ['version', 'start', 'context', 'confirm'];

const DIFF_PREVIEW = 6;

const parsePatch = (text: string): { ok: true; value: Record<string, unknown> } | { ok: false; error: string } => {
	try {
		const value: unknown = JSON.parse(text || '{}');
		if (!value || typeof value !== 'object' || Array.isArray(value)) {
			return { ok: false, error: 'The patch must be a JSON object' };
		}
		return { ok: true, value: value as Record<string, unknown> };
	} catch {
		return { ok: false, error: 'Not valid JSON' };
	}
};

const DiffLine: React.FC<{ label: string; color: string; nodes: WorkflowDefinitionNode[] }> = ({
	label,
	color,
	nodes,
}) => (
	<Group gap={6} wrap="nowrap" align="flex-start">
		<Badge size="sm" variant="light" color={color} miw={92}>
			{nodes.length} {label}
		</Badge>
		<Text fz="xs" c="dimmed" lineClamp={2}>
			{nodes.length === 0
				? '—'
				: nodes
						.slice(0, DIFF_PREVIEW)
						.map((node) => node.name || node.id)
						.join(', ') + (nodes.length > DIFF_PREVIEW ? ` and ${nodes.length - DIFF_PREVIEW} more` : '')}
		</Text>
	</Group>
);

const StepError: React.FC<{ error: WorkflowRunMigrateErrorCopy | undefined }> = ({ error }) =>
	error ? (
		<Alert color="red" icon={<LuTriangleAlert size={16} />} p="sm" title={error.title}>
			{error.detail && <Text fz="xs">{error.detail}</Text>}
		</Alert>
	) : null;

interface WorkflowRunMigrateModalProps {
	/** The run to migrate; null keeps the modal closed. */
	runId: string | null;
	onClose: () => void;
}

/**
 * Moves a paused, failed or input-parked run onto a newer version of its workflow: pick the version,
 * the node to start from, an optional context patch, then confirm. The engine stops the source and
 * creates a replacement in one transaction.
 */
export const WorkflowRunMigrateModal: React.FC<WorkflowRunMigrateModalProps> = ({ runId, onClose }) => {
	const navigate = useNavigate();
	const notify = useNotify();

	const [active, setActive] = useState(0);
	const [pickedTargetId, setPickedTargetId] = useState<string | null>(null);
	const [pickedStartId, setPickedStartId] = useState<string | null>(null);
	const [patchText, setPatchText] = useState('{}');
	const [startPaused, setStartPaused] = useState(true);
	const [reason, setReason] = useState('');
	const [errors, setErrors] = useState<Partial<Record<WorkflowRunMigrateStep, WorkflowRunMigrateErrorCopy>>>({});

	const run = useGetWorkflowRunQuery(runId ?? skipToken);
	const detail = run.data;
	const source = useGetWorkflowDefinitionQuery(detail?.workflow_definition_id ?? skipToken);
	const versions = useListWorkflowDefinitionVersionsQuery(source.data?.lineage_id ?? skipToken);
	const context = useGetWorkflowRunContextQuery(runId ?? skipToken);
	const [migrate, migrateState] = useMigrateWorkflowRunMutation();

	// Listed newest first, so the head is the latest.
	const newer = useMemo(
		() => (versions.data?.items ?? []).filter((item) => !!source.data && item.version > source.data.version),
		[versions.data, source.data],
	);
	const targetId = pickedTargetId ?? newer[0]?.id ?? null;
	const target = useGetWorkflowDefinitionQuery(targetId ?? skipToken);
	const targetContent = target.data?.id === targetId ? target.data?.content : undefined;

	const diff = useMemo(
		() => (source.data && targetContent ? diffDefinitionNodes(source.data.content, targetContent) : null),
		[source.data, targetContent],
	);
	const interior = useMemo(
		() => (targetContent ? parallelInterior(targetContent) : new Set<string>()),
		[targetContent],
	);
	// Groups are entered through their start node, so only steps are offered.
	const startOptions = useMemo(
		() => (targetContent ? buildRunGraph(targetContent).nodes.map((item) => item.node) : []),
		[targetContent],
	);
	const targetNodes = useMemo(
		() => (targetContent ? indexDefinitionNodes(targetContent) : new Map<string, WorkflowDefinitionNode>()),
		[targetContent],
	);

	const isStartable = (nodeId: string | null | undefined): nodeId is string =>
		!!nodeId && startOptions.some((node) => node.id === nodeId) && !interior.has(nodeId);

	const sourceNodeId = detail ? migrateSourceNodeId(detail) : null;
	const defaultStartId = (() => {
		if (isStartable(sourceNodeId)) return sourceNodeId;
		const entry = targetContent ? buildRunGraph(targetContent).nodes.find((item) => item.column === 0) : null;
		return isStartable(entry?.node.id) ? entry.node.id : null;
	})();
	// A pick made against another target version no longer applies.
	const startNodeId = isStartable(pickedStartId) ? pickedStartId : defaultStartId;
	const startNode = startNodeId ? (targetNodes.get(startNodeId) ?? null) : null;

	const patch = parsePatch(patchText);

	const close = () => {
		setActive(0);
		setPickedTargetId(null);
		setPickedStartId(null);
		setPatchText('{}');
		setStartPaused(true);
		setReason('');
		setErrors({});
		onClose();
	};

	const canAdvance = [!!targetId && !!targetContent, !!startNodeId, patch.ok, true][active];

	const submit = async () => {
		if (!detail || !targetId || !startNodeId || !patch.ok) return;
		setErrors({});
		try {
			const result = await migrate({
				id: detail.id,
				workflow_definition_id: targetId,
				start_node_id: startNodeId,
				context_patch: Object.keys(patch.value).length > 0 ? patch.value : undefined,
				start_paused: startPaused,
				reason: reason.trim() || undefined,
			}).unwrap();

			const link = `${RUN_ROUTE}/${result.instance.id}`;
			notify.success({
				title: 'Run migrated',
				message: `Migrated from ${result.source_instance_id.slice(0, 8)}, source stopped`,
				link,
			});
			close();
			navigate(link);
		} catch (error) {
			const copy = describeMigrateError(error);
			setErrors({ [copy.step]: copy });
			setActive(STEPS.indexOf(copy.step));
		}
	};

	const loading = run.isLoading || source.isLoading || versions.isLoading;
	const loadError = run.error ?? source.error ?? versions.error;

	const renderBody = () => {
		if (loading) {
			return (
				<Center h={240}>
					<Loader size="sm" />
				</Center>
			);
		}
		if (loadError || !detail || !source.data) {
			return (
				<Alert color="red" icon={<LuTriangleAlert size={16} />} p="sm">
					<Text fz="xs">Couldn't load this run or its workflow definition.</Text>
				</Alert>
			);
		}
		if (newer.length === 0) {
			return (
				<Stack align="center" gap="xs" py="xl">
					<LuInfo size={22} />
					<Text fw={600} fz="sm">
						No newer version to migrate to
					</Text>
					<Text fz="xs" c="dimmed" ta="center" maw={380}>
						{source.data.name} v{source.data.version} is the latest version. Save a new version of the
						workflow first, then migrate this run onto it.
					</Text>
				</Stack>
			);
		}

		return (
			<Stepper active={active} onStepClick={setActive} allowNextStepsSelect={false} size="sm" iconSize={28}>
				<Stepper.Step label="Target version" description={target.data ? `v${target.data.version}` : undefined}>
					<Stack gap="md" mt="md">
						<StepError error={errors.version} />
						<Radio.Group
							label={`Newer versions of ${source.data.name} (running v${source.data.version})`}
							value={targetId}
							onChange={setPickedTargetId}
						>
							<ScrollArea.Autosize mah={200} type="auto" mt="xs">
								<Stack gap={6} pr="sm">
									{newer.map((item, index) => (
										<Radio
											key={item.id}
											value={item.id}
											label={
												<Group gap={8} wrap="nowrap">
													<Text fz="sm">v{item.version}</Text>
													{index === 0 && (
														<Badge size="xs" color="green">
															Latest
														</Badge>
													)}
													<Text fz="xs" c="dimmed">
														saved {dayjs(item.created_at).format('DD MMM YYYY HH:mm')}
													</Text>
												</Group>
											}
										/>
									))}
								</Stack>
							</ScrollArea.Autosize>
						</Radio.Group>

						<Stack gap={6}>
							<Text fz="sm" fw={600}>
								Changes from v{source.data.version}
							</Text>
							{diff ? (
								<>
									<DiffLine label="added" color="teal" nodes={diff.added} />
									<DiffLine label="removed" color="red" nodes={diff.removed} />
									<DiffLine label="changed" color="yellow" nodes={diff.changed} />
								</>
							) : (
								<Loader size="xs" />
							)}
						</Stack>
					</Stack>
				</Stepper.Step>

				<Stepper.Step label="Start node" description={startNode?.name}>
					<Stack gap="sm" mt="md">
						<StepError error={errors.start} />
						<Text fz="xs" c="dimmed">
							The replacement run starts at this node of v{target.data?.version}. Nodes inside a parallel
							region can't be picked; start at its fork or after its join instead.
						</Text>
						<Select
							label="Start node"
							placeholder="Pick a node"
							searchable
							nothingFoundMessage="No node found"
							data={startOptions.map((node) => ({
								value: node.id,
								label: node.name || node.id,
								disabled: interior.has(node.id),
							}))}
							value={startNodeId}
							onChange={(value) => value && setPickedStartId(value)}
							allowDeselect={false}
							comboboxProps={{ withinPortal: false }}
						/>
						{targetContent && (
							<WorkflowRunMigrateGraph
								content={targetContent}
								disabled={interior}
								value={startNodeId}
								sourceNodeId={sourceNodeId && targetNodes.has(sourceNodeId) ? sourceNodeId : null}
								onChange={setPickedStartId}
							/>
						)}
					</Stack>
				</Stepper.Step>

				<Stepper.Step label="Context & options">
					<Stack gap="md" mt="md">
						<StepError error={errors.context} />
						<SimpleGrid cols={{ base: 1, sm: 2 }} spacing="sm">
							<CodeEditor
								language="json"
								label="Context patch"
								description="Deep-merged over the carried context; arrays are replaced"
								height={240}
								value={patchText}
								onChange={setPatchText}
								error={patch.ok ? undefined : patch.error}
							/>
							<CodeEditor
								language="json"
								label="Source context"
								description="Read-only, as carried over before the patch"
								height={240}
								readOnly
								value={JSON.stringify(context.data ?? {}, null, 2)}
							/>
						</SimpleGrid>
						<Switch
							label="Start paused"
							description="Park the replacement paused so it can be inspected before resuming"
							checked={startPaused}
							onChange={(event) => setStartPaused(event.currentTarget.checked)}
						/>
						<Textarea
							label="Audit reason"
							placeholder="Why is this run being migrated?"
							autosize
							minRows={2}
							value={reason}
							onChange={(event) => setReason(event.currentTarget.value)}
						/>
					</Stack>
				</Stepper.Step>

				<Stepper.Step label="Confirm">
					<Stack gap="md" mt="md">
						<StepError error={errors.confirm} />
						<Alert color="yellow" icon={<LuTriangleAlert size={16} />} p="sm">
							<Text fz="xs">
								This run is stopped and a new run is created on the target version. History is not
								copied; the two runs link to each other.
							</Text>
						</Alert>
						<List size="sm" spacing={4}>
							<List.Item>
								Source run{' '}
								<Text span fz="sm" className={classes.mono}>
									{detail.id.slice(0, 8)}
								</Text>{' '}
								on v{source.data.version}
							</List.Item>
							<List.Item>
								Target {target.data?.name} v{target.data?.version}
							</List.Item>
							<List.Item>Start at {startNode?.name ?? startNodeId}</List.Item>
							<List.Item>
								{patch.ok && Object.keys(patch.value).length > 0
									? `Context patch with ${Object.keys(patch.value).length} top-level key(s)`
									: 'No context patch'}
							</List.Item>
							<List.Item>{startPaused ? 'Starts paused' : 'Starts running'}</List.Item>
							{reason.trim() && <List.Item>Reason: {reason.trim()}</List.Item>}
						</List>
					</Stack>
				</Stepper.Step>
			</Stepper>
		);
	};

	const ready = !loading && !loadError && !!detail && newer.length > 0;
	const last = active === STEPS.length - 1;

	return (
		<Modal opened={!!runId} onClose={close} title="Migrate run to a newer version" centered size="xl">
			<Stack gap="md">
				{renderBody()}

				<Group justify="flex-end" gap="xs">
					<Button variant="default" onClick={active > 0 && ready ? () => setActive(active - 1) : close}>
						{active > 0 && ready ? 'Back' : 'Cancel'}
					</Button>
					{ready &&
						(last ? (
							<Button
								leftSection={<LuGitBranchPlus size={15} />}
								loading={migrateState.isLoading}
								disabled={!targetId || !startNodeId || !patch.ok}
								onClick={submit}
							>
								Migrate run
							</Button>
						) : (
							<Button disabled={!canAdvance} onClick={() => setActive(active + 1)}>
								Next
							</Button>
						))}
				</Group>
			</Stack>
		</Modal>
	);
};
