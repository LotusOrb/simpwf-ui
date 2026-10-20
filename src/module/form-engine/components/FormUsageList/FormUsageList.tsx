import React, { useState } from 'react';

import { Alert, Anchor, Badge, Button, Center, Group, Loader, Pagination, Stack, Text } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';
import { Link } from 'react-router';

import { useGetFormUsageQuery } from '@module/form-engine/hooks';
import { runStatusMeta } from '@module/workflow-run/constant';
import type { WorkflowRunStatus } from '@module/workflow-run/types/WorkflowRunStatus';

const INSTANCES_PER_PAGE = 10;

const statusMeta = (status: string) =>
	status in runStatusMeta ? runStatusMeta[status as WorkflowRunStatus] : { label: status, color: 'gray' };

const Heading: React.FC<{ label: string; count: number }> = ({ label, count }) => (
	<Group gap={6}>
		<Text fz="xs" fw={700} tt="uppercase" c="dimmed">
			{label}
		</Text>
		<Badge size="xs" variant="light" color="gray">
			{count}
		</Badge>
	</Group>
);

interface FormUsageListProps {
	formId: string;
}

/** Workflow definitions, node definitions and runs that reference a form, each linked to its page. */
export const FormUsageList: React.FC<FormUsageListProps> = ({ formId }) => {
	const [page, setPage] = useState(1);
	const { data, isFetching, isError, refetch } = useGetFormUsageQuery(
		{ id: formId, page, perPage: INSTANCES_PER_PAGE },
		{ refetchOnMountOrArgChange: true },
	);

	if (isError && !isFetching) {
		return (
			<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />}>
				<Group justify="space-between" gap="xs">
					<Text fz="sm">Couldn't load where this form is used.</Text>
					<Button size="compact-xs" variant="default" onClick={refetch}>
						Try again
					</Button>
				</Group>
			</Alert>
		);
	}

	if (!data) {
		return (
			<Center py="lg">
				<Loader size="sm" />
			</Center>
		);
	}

	const totalPages = Math.max(1, Math.ceil(data.instance_total / data.per_page));
	const unused =
		data.workflow_definitions.length === 0 && data.node_definitions.length === 0 && data.instance_total === 0;

	if (unused) {
		return (
			<Text fz="sm" c="dimmed">
				Nothing references this form.
			</Text>
		);
	}

	return (
		<Stack gap="lg">
			<Stack gap={6}>
				<Heading label="Workflow definitions" count={data.workflow_definitions.length} />
				{data.workflow_definitions.length === 0 && (
					<Text fz="sm" c="dimmed">
						None
					</Text>
				)}
				{data.workflow_definitions.map((definition) => (
					<div key={definition.id}>
						<Group gap={6}>
							<Anchor component={Link} to={`/app/workflow-definition/${definition.id}`} fz="sm" fw={600}>
								{definition.name}
							</Anchor>
							<Badge size="xs" variant="light" color="gray">
								v{definition.version}
							</Badge>
						</Group>
						<Text fz="xs" c="dimmed">
							{definition.nodes
								.map((node) =>
									node.node_definition_id
										? `${node.node_name || node.node_id} (via node library)`
										: node.node_name || node.node_id,
								)
								.join(', ')}
						</Text>
					</div>
				))}
			</Stack>

			<Stack gap={6}>
				<Heading label="Node definitions" count={data.node_definitions.length} />
				{data.node_definitions.length === 0 && (
					<Text fz="sm" c="dimmed">
						None
					</Text>
				)}
				{data.node_definitions.map((definition) => (
					<Group key={definition.id} gap={6}>
						<Anchor component={Link} to={`/app/node-definition/${definition.id}`} fz="sm" fw={600}>
							{definition.name}
						</Anchor>
						<Badge size="xs" variant="light" color="gray">
							v{definition.version}
						</Badge>
						<Text fz="xs" c="dimmed">
							{definition.type}
						</Text>
					</Group>
				))}
			</Stack>

			<Stack gap={6}>
				<Heading label="Runs" count={data.instance_total} />
				{data.instance_total === 0 && (
					<Text fz="sm" c="dimmed">
						None
					</Text>
				)}
				{data.workflow_instances.map((instance) => {
					const meta = statusMeta(instance.status);
					return (
						<Group key={instance.id} gap={6} wrap="nowrap">
							<Anchor component={Link} to={`/app/workflow-run/${instance.id}`} fz="xs" ff="monospace">
								{instance.id.slice(0, 8)}
							</Anchor>
							<Badge size="xs" variant="light" color={meta.color}>
								{meta.label}
							</Badge>
							{instance.is_waiting_on_form && (
								<Badge size="xs" variant="outline" color="yellow">
									waiting on this form
								</Badge>
							)}
						</Group>
					);
				})}
				{totalPages > 1 && <Pagination size="xs" total={totalPages} value={page} onChange={setPage} mt={4} />}
			</Stack>
		</Stack>
	);
};
