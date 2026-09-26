import React, { useState } from 'react';

import { ActionIcon, Button, Group, ScrollArea, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { LuCircleAlert, LuKeyRound, LuPlus, LuRefreshCw } from 'react-icons/lu';

import type { CoreQueryError } from '@core/api/core.baseQuery';

import { PaginationBar, PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { SecretDeleteModal } from '@module/secret/components/SecretDeleteModal';
import { SecretFormModal, type SecretFormMode } from '@module/secret/components/SecretFormModal';
import { SecretTable } from '@module/secret/components/SecretTable';
import type { SecretDto } from '@module/secret/dto';
import {
	useCreateSecretMutation,
	useDeleteSecretMutation,
	useListSecretsQuery,
	useRotateSecretMutation,
} from '@module/secret/hooks';
import type { Secret } from '@module/secret/types/Secret';

import classes from './SecretListPage.module.scss';

const errorMessage = (error: unknown, fallback: string) => {
	const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
	return typeof message === 'string' && message ? message : fallback;
};

const errorCode = (error: unknown) =>
	error && typeof error === 'object' && 'code' in error ? (error as CoreQueryError).code : null;

export const SecretListPage: React.FC = () => {
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
	const [formMode, setFormMode] = useState<SecretFormMode | null>(null);
	const [formError, setFormError] = useState<string | null>(null);
	const [pendingDelete, setPendingDelete] = useState<Secret | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const { data: result, isFetching, isError, refetch } = useListSecretsQuery({ page, perPage });
	const [createSecret, createState] = useCreateSecretMutation();
	const [rotateSecret, rotateState] = useRotateSecretMutation();
	const [deleteSecret, deleteState] = useDeleteSecretMutation();

	const openForm = (mode: SecretFormMode) => {
		setFormError(null);
		setFormMode(mode);
	};

	const handleSubmit = async (values: SecretDto) => {
		setFormError(null);
		try {
			if (formMode?.type === 'rotate') {
				await rotateSecret(values).unwrap();
			} else {
				await createSecret(values).unwrap();
			}
			setFormMode(null);
		} catch (error) {
			if (formMode?.type === 'create' && errorCode(error) === 409) {
				setFormError(`A secret named ${values.key} already exists. Rotate it from the list instead.`);
			} else {
				setFormError(errorMessage(error, 'Failed to save secret'));
			}
		}
	};

	const openDelete = (secret: Secret) => {
		setDeleteError(null);
		setPendingDelete(secret);
	};

	const handleDelete = async (secret: Secret) => {
		setDeleteError(null);
		try {
			await deleteSecret(secret.key).unwrap();
			setPendingDelete(null);
			// Step back when the last row of a trailing page is removed.
			if (result && result.items.length === 1 && page > 1) setPage(page - 1);
		} catch (error) {
			if (errorCode(error) === 404) {
				setPendingDelete(null);
				refetch();
			} else {
				setDeleteError(errorMessage(error, 'Failed to delete secret'));
			}
		}
	};

	const renderResults = () => {
		if (isError && !isFetching) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load secrets</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!result) {
			return <SecretTable secrets={[]} onRotate={() => {}} onDelete={() => {}} skeletonRows={perPage} />;
		}

		if (result.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuKeyRound size={22} />
					</ThemeIcon>
					<Text fw={600}>No secrets yet</Text>
					<Text fz="sm" c="dimmed" ta="center" maw={360}>
						Store API tokens and passwords here, then reference them in node config as{' '}
						<Text span ff="monospace" fz="xs">
							{'{{ secret.KEY }}'}
						</Text>
						.
					</Text>
					<Button
						size="xs"
						mt={4}
						leftSection={<LuPlus size={14} />}
						onClick={() => openForm({ type: 'create' })}
					>
						New secret
					</Button>
				</Stack>
			);
		}

		return (
			<div className={classes.results} data-loading={isFetching || undefined} aria-busy={isFetching}>
				<SecretTable
					secrets={result.items}
					onRotate={(secret) => openForm({ type: 'rotate', key: secret.key })}
					onDelete={openDelete}
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
							Secrets
						</Title>
						<Text fz="sm" c="dimmed">
							Write-only credentials that workflows read at run time
						</Text>
					</div>
					<Group gap="xs">
						{result && (
							<Text fz="sm" c="dimmed">
								{result.total} {result.total === 1 ? 'secret' : 'secrets'}
							</Text>
						)}
						<Tooltip label="Refresh">
							<ActionIcon
								variant="default"
								size={36}
								aria-label="Refresh secrets"
								onClick={refetch}
								loading={isFetching && !!result}
							>
								<LuRefreshCw size={16} />
							</ActionIcon>
						</Tooltip>
						<Button leftSection={<LuPlus size={16} />} onClick={() => openForm({ type: 'create' })}>
							New secret
						</Button>
					</Group>
				</Group>

				{renderResults()}

				{result && result.total > 0 && (
					<PaginationBar
						page={result.page}
						perPage={result.per_page}
						total={result.total}
						totalPages={result.total_pages}
						onPageChange={setPage}
						onPerPageChange={(value) => {
							setPerPage(value);
							setPage(1);
						}}
					/>
				)}
			</Stack>

			<SecretFormModal
				mode={formMode}
				loading={createState.isLoading || rotateState.isLoading}
				error={formError}
				onClose={() => setFormMode(null)}
				onSubmit={handleSubmit}
			/>

			<SecretDeleteModal
				secret={pendingDelete}
				loading={deleteState.isLoading}
				error={deleteError}
				onClose={() => setPendingDelete(null)}
				onConfirm={handleDelete}
			/>
		</ScrollArea>
	);
};
