import React, { useState } from 'react';

import {
	ActionIcon,
	Badge,
	Button,
	CopyButton,
	Group,
	Paper,
	ScrollArea,
	Skeleton,
	Stack,
	Text,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import { LuArrowLeft, LuCheck, LuCircleAlert, LuCopy, LuGitBranchPlus, LuTrash2 } from 'react-icons/lu';
import { useNavigate, useParams } from 'react-router';

import { Permission, useCan } from '@core/auth/authorization';

import { CodeEditor } from '@common/component/CodeEditor';
import { useNavigateBack } from '@common/hooks/useNavigateBack';

import { NodeDefinitionDeleteModal } from '@module/node-definition/components/NodeDefinitionDeleteModal';
import {
	NodeDefinitionFormModal,
	type NodeDefinitionFormMode,
} from '@module/node-definition/components/NodeDefinitionFormModal';
import { NodeDefinitionTypeBadge } from '@module/node-definition/components/NodeDefinitionTypeBadge';
import { NodeDefinitionVersionHistory } from '@module/node-definition/components/NodeDefinitionVersionHistory';
import {
	describeNodeDefinitionSaveError,
	NODE_DEFINITION_ROUTE,
	nodeDefinitionLink,
	type NodeDefinitionErrorCopy,
} from '@module/node-definition/data';
import {
	useCreateNodeDefinitionMutation,
	useGetNodeDefinitionQuery,
	useListNodeDefinitionVersionPagesInfiniteQuery,
	useNodeDefinitionDelete,
} from '@module/node-definition/hooks';
import type { NodeDefinitionPayload } from '@module/node-definition/types/NodeDefinitionPayload';
import { useNotify } from '@module/notification/hooks';

import classes from './NodeDefinitionDetailPage.module.scss';

const VERSION_PAGE_SIZE = 20;

export const NodeDefinitionDetailPage: React.FC = () => {
	const { id = '' } = useParams<{ id: string }>();
	const navigate = useNavigate();
	const navigateBack = useNavigateBack(NODE_DEFINITION_ROUTE);
	const notify = useNotify();
	const canWrite = useCan(Permission.DefinitionsWrite);

	const { data, isError, refetch } = useGetNodeDefinitionQuery(id);
	const definition = data?.id === id ? data : null;
	// Same cache entry as the history list; its head is the lineage's latest.
	const versions = useListNodeDefinitionVersionPagesInfiniteQuery(
		{ lineageId: definition?.lineage_id ?? '', perPage: VERSION_PAGE_SIZE },
		{ skip: !definition },
	);
	const latest = versions.currentData?.pages[0]?.items[0];
	const isLatest = !!definition && !!latest && latest.id === definition.id;

	const [formMode, setFormMode] = useState<NodeDefinitionFormMode | null>(null);
	const [formError, setFormError] = useState<NodeDefinitionErrorCopy | null>(null);
	const [createDefinition, createState] = useCreateNodeDefinitionMutation();

	const deletion = useNodeDefinitionDelete((deleted) => {
		if (deleted.id !== id) return;
		// Fall back to another version of the lineage, or the library when this was the only one.
		const next = versions.currentData?.pages.flatMap((page) => page.items).find((item) => item.id !== id);
		navigate(next ? nodeDefinitionLink(next.id) : NODE_DEFINITION_ROUTE, { replace: true });
	});

	const handleSubmit = async (payload: NodeDefinitionPayload) => {
		setFormError(null);
		const response = await createDefinition(payload);
		if ('error' in response) {
			setFormError(describeNodeDefinitionSaveError(response.error));
			return;
		}
		setFormMode(null);
		notify.success({
			title: 'Node definition saved',
			message: `${response.data.name} v${response.data.version} saved`,
			link: nodeDefinitionLink(response.data.id),
		});
		navigate(nodeDefinitionLink(response.data.id));
	};

	if (isError && !definition) {
		return (
			<Stack align="center" justify="center" gap="xs" h="100%">
				<ThemeIcon size={48} radius="xl" variant="light" color="red">
					<LuCircleAlert size={22} />
				</ThemeIcon>
				<Text fw={600}>Couldn't load this node definition</Text>
				<Group gap="xs" mt={4}>
					<Button variant="default" size="xs" onClick={navigateBack}>
						Back to library
					</Button>
					<Button variant="default" size="xs" onClick={refetch}>
						Try again
					</Button>
				</Group>
			</Stack>
		);
	}

	return (
		<ScrollArea h="100%" className={classes.canvas}>
			<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1180} mx="auto">
				<Group justify="space-between" align="flex-start" gap="sm" wrap="nowrap">
					<Group gap="sm" align="flex-start" wrap="nowrap">
						<Tooltip label="Back to library">
							<ActionIcon
								variant="subtle"
								color="gray"
								size="lg"
								aria-label="Back to library"
								onClick={navigateBack}
							>
								<LuArrowLeft size={18} />
							</ActionIcon>
						</Tooltip>
						{definition ? (
							<div>
								<Group gap="xs">
									<Title order={2} fz={22}>
										{definition.name}
									</Title>
									<NodeDefinitionTypeBadge type={definition.type} size="md" />
									<Badge color="gray" variant="light" size="md">
										v{definition.version}
									</Badge>
									{isLatest && (
										<Badge color="green" variant="light" size="md">
											Latest
										</Badge>
									)}
								</Group>
								<Group gap={4} mt={2}>
									<Text fz="xs" c="dimmed">
										Lineage
									</Text>
									<Text fz="xs" c="dimmed" ff="monospace">
										{definition.lineage_id}
									</Text>
									<CopyButton value={definition.lineage_id} timeout={1500}>
										{({ copied, copy }) => (
											<Tooltip label={copied ? 'Copied' : 'Copy lineage id'}>
												<ActionIcon
													size="xs"
													variant="subtle"
													color={copied ? 'teal' : 'gray'}
													onClick={copy}
													aria-label="Copy lineage id"
												>
													{copied ? <LuCheck size={12} /> : <LuCopy size={12} />}
												</ActionIcon>
											</Tooltip>
										)}
									</CopyButton>
								</Group>
							</div>
						) : (
							<Stack gap={8} pt={6}>
								<Skeleton height={16} width={220} />
								<Skeleton height={10} width={280} />
							</Stack>
						)}
					</Group>
					{definition && canWrite && (
						<Group gap="xs" wrap="nowrap">
							<Tooltip
								label={
									latest
										? `v${definition.version + 1} already exists — open the latest version to extend it`
										: 'Loading versions…'
								}
								disabled={isLatest}
							>
								<Button
									leftSection={<LuGitBranchPlus size={16} />}
									disabled={!isLatest}
									onClick={() => {
										setFormError(null);
										setFormMode({ type: 'version', source: definition });
									}}
								>
									New version
								</Button>
							</Tooltip>
							<Tooltip label="Delete this version">
								<ActionIcon
									variant="default"
									color="red"
									size={36}
									aria-label="Delete this version"
									onClick={() => deletion.request(definition)}
								>
									<LuTrash2 size={16} />
								</ActionIcon>
							</Tooltip>
						</Group>
					)}
				</Group>

				<div className={classes.body}>
					<Paper withBorder radius="md" p="md">
						<Stack gap="xs">
							<Group justify="space-between">
								<Text fw={600}>Content</Text>
								{definition && !definition.schema && (
									<Tooltip label="The running engine has no schema for this type">
										<Badge color="yellow" variant="light" size="sm">
											No schema
										</Badge>
									</Tooltip>
								)}
							</Group>
							{definition ? (
								<CodeEditor
									language="json"
									readOnly
									height={420}
									value={JSON.stringify(definition.content, null, 2)}
								/>
							) : (
								<Skeleton height={420} />
							)}
						</Stack>
					</Paper>

					<Paper withBorder radius="md" p="md">
						<Text fw={600} mb="xs">
							Versions
						</Text>
						{definition ? (
							<NodeDefinitionVersionHistory
								lineageId={definition.lineage_id}
								viewingId={definition.id}
								onDelete={canWrite ? deletion.request : undefined}
							/>
						) : (
							<Skeleton height={120} />
						)}
					</Paper>
				</div>
			</Stack>

			<NodeDefinitionFormModal
				mode={formMode}
				loading={createState.isLoading}
				error={formError}
				onClose={() => setFormMode(null)}
				onSubmit={handleSubmit}
			/>

			<NodeDefinitionDeleteModal
				definition={deletion.pending}
				loading={deletion.loading}
				error={deletion.error}
				onClose={deletion.close}
				onConfirm={deletion.confirm}
			/>
		</ScrollArea>
	);
};
