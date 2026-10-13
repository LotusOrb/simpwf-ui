import React, { useState } from 'react';

import { Button, Group, ScrollArea, Stack, Text, ThemeIcon, Title } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { LuBoxes, LuCircleAlert, LuPlus, LuSearchX } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { Can, Permission } from '@core/auth/authorization';

import { PaginationBar } from '@common/component/PaginationBar';

import { NodeDefinitionDeleteModal } from '@module/node-definition/components/NodeDefinitionDeleteModal';
import { NodeDefinitionFilters } from '@module/node-definition/components/NodeDefinitionFilters';
import {
	NodeDefinitionFormModal,
	type NodeDefinitionFormMode,
} from '@module/node-definition/components/NodeDefinitionFormModal';
import { NodeDefinitionTable } from '@module/node-definition/components/NodeDefinitionTable';
import {
	describeNodeDefinitionSaveError,
	nodeDefinitionLink,
	nodeDefinitionSortOrders,
	type NodeDefinitionErrorCopy,
} from '@module/node-definition/data';
import {
	NAME_URL_UPDATE,
	useCreateNodeDefinitionMutation,
	useListNodeDefinitionsQuery,
	useNodeDefinitionDelete,
	useNodeDefinitionLibrary,
	useNodeDefinitionListParams,
} from '@module/node-definition/hooks';
import type { NodeDefinitionPayload } from '@module/node-definition/types/NodeDefinitionPayload';
import { useNotify } from '@module/notification/hooks';

import classes from './NodeDefinitionListPage.module.scss';

export const NodeDefinitionListPage: React.FC = () => {
	const [params, setParams] = useNodeDefinitionListParams();
	const { name, type, latestOnly, sort, page, perPage } = params;
	const [debouncedName] = useDebouncedValue(name.trim(), 300);
	const setPage = (next: number) => setParams({ page: next });
	const navigate = useNavigate();
	const notify = useNotify();

	const [formMode, setFormMode] = useState<NodeDefinitionFormMode | null>(null);
	const [formError, setFormError] = useState<NodeDefinitionErrorCopy | null>(null);

	const { by, direction } = nodeDefinitionSortOrders[sort];
	const {
		data: result,
		isFetching,
		isError,
		refetch,
	} = useListNodeDefinitionsQuery({
		page,
		perPage,
		order: { by, direction },
		filter: {
			latest_only: { op: '_eq', value: String(latestOnly) },
			...(type ? { type: { op: '_eq' as const, value: type } } : {}),
			...(debouncedName ? { name: { op: '_eq' as const, value: debouncedName } } : {}),
		},
	});
	const { customTypes } = useNodeDefinitionLibrary();
	const [createDefinition, createState] = useCreateNodeDefinitionMutation();

	const deletion = useNodeDefinitionDelete((definition) => {
		const lastOnPage = result?.items.length === 1 && result.items[0].id === definition.id;
		if (lastOnPage && page > 1) setPage(page - 1);
	});

	const hasActiveFilters = !!name || !!type || !latestOnly;
	const clearFilters = () => setParams({ name: null, type: null, latestOnly: null, page: null });

	const openForm = (mode: NodeDefinitionFormMode) => {
		setFormError(null);
		setFormMode(mode);
	};

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

	const renderResults = () => {
		if (isError && !isFetching) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load node definitions</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!result) return <NodeDefinitionTable definitions={[]} onDelete={() => {}} skeletonRows={perPage} />;

		if (result.items.length === 0) {
			return hasActiveFilters ? (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuSearchX size={22} />
					</ThemeIcon>
					<Text fw={600}>No node definitions found</Text>
					<Text fz="sm" c="dimmed">
						The name filter matches whole names only. Try loosening the filters.
					</Text>
					<Button variant="default" size="xs" mt={4} onClick={clearFilters}>
						Clear filters
					</Button>
				</Stack>
			) : (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuBoxes size={22} />
					</ThemeIcon>
					<Text fw={600}>No node definitions yet</Text>
					<Text fz="sm" c="dimmed" ta="center" maw={380}>
						Save a configured node once and reuse it across workflows from the editor's node library.
					</Text>
					<Can rule={Permission.DefinitionsWrite}>
						<Button
							size="xs"
							mt={4}
							leftSection={<LuPlus size={14} />}
							onClick={() => openForm({ type: 'create' })}
						>
							New node definition
						</Button>
					</Can>
				</Stack>
			);
		}

		return (
			<div className={classes.results} data-loading={isFetching || undefined} aria-busy={isFetching}>
				<NodeDefinitionTable
					definitions={result.items}
					// With every version listed, a row may not be its lineage's latest, which the engine won't extend.
					onNewVersion={latestOnly ? (source) => openForm({ type: 'version', source }) : undefined}
					onDelete={deletion.request}
				/>
			</div>
		);
	};

	return (
		<ScrollArea h="100%" className={classes.canvas}>
			<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1180} mx="auto">
				<Group justify="space-between" align="flex-end" gap="sm">
					<div>
						<Title order={2} fz={22}>
							Node Library
						</Title>
						<Text fz="sm" c="dimmed">
							Reusable, versioned node definitions that workflows reference
						</Text>
					</div>
					<Can rule={Permission.DefinitionsWrite}>
						<Button leftSection={<LuPlus size={16} />} onClick={() => openForm({ type: 'create' })}>
							New node definition
						</Button>
					</Can>
				</Group>

				<Group justify="space-between" gap="sm">
					<NodeDefinitionFilters
						value={{ name, type, latestOnly, sort }}
						customTypes={customTypes}
						onChange={(value) =>
							setParams({ ...value, page: null }, 'name' in value ? NAME_URL_UPDATE : undefined)
						}
					/>
					{result && (
						<Text fz="sm" c="dimmed">
							{result.total} {result.total === 1 ? 'definition' : 'definitions'}
						</Text>
					)}
				</Group>

				{renderResults()}

				{result && result.total > 0 && (
					<PaginationBar
						page={result.page}
						perPage={result.per_page}
						total={result.total}
						totalPages={result.total_pages}
						onPageChange={setPage}
						onPerPageChange={(value) => setParams({ perPage: value, page: null })}
					/>
				)}
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
