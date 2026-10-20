import React, { useState } from 'react';

import {
	ActionIcon,
	Button,
	Group,
	ScrollArea,
	Stack,
	Text,
	TextInput,
	ThemeIcon,
	Title,
	Tooltip,
} from '@mantine/core';
import { LuCircleAlert, LuClipboardList, LuPlus, LuRefreshCw, LuSearch } from 'react-icons/lu';
import { Link, useNavigate } from 'react-router';

import { Can, Permission } from '@core/auth/authorization';

import { PaginationBar, PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { FormDeleteModal } from '@module/form-engine/components/FormDeleteModal';
import { FormTable } from '@module/form-engine/components/FormTable';
import { FormUsageDrawer } from '@module/form-engine/components/FormUsageDrawer';
import { useDeleteFormMutation, useListFormsQuery } from '@module/form-engine/hooks';
import type { Form } from '@module/form-engine/types/Form';
import { formErrorCode, formErrorMessage, formLibraryPath } from '@module/form-engine/utils';
import { useNotify } from '@module/notification/hooks';

import classes from './FormListPage.module.scss';

export const FormListPage: React.FC = () => {
	const navigate = useNavigate();
	const [page, setPage] = useState(1);
	const [perPage, setPerPage] = useState(PER_PAGE_OPTIONS[0]);
	const [filter, setFilter] = useState('');
	const [usageOf, setUsageOf] = useState<Form | null>(null);
	const [pendingDelete, setPendingDelete] = useState<Form | null>(null);
	const [deleteInUse, setDeleteInUse] = useState(false);
	const [deleteError, setDeleteError] = useState<string | null>(null);

	const { data: result, isFetching, isError, refetch } = useListFormsQuery({ page, perPage });
	const [deleteForm, deleteState] = useDeleteFormMutation();
	const notify = useNotify();

	// The engine has no name filter, so this narrows the loaded page only.
	const needle = filter.trim().toLowerCase();
	const visible = result ? result.items.filter((form) => !needle || form.name.toLowerCase().includes(needle)) : [];

	const openDelete = (form: Form) => {
		setDeleteError(null);
		setDeleteInUse(false);
		setPendingDelete(form);
	};

	const handleDelete = async (form: Form) => {
		setDeleteError(null);
		try {
			await deleteForm(form.id).unwrap();
			setPendingDelete(null);
			notify.success({ title: 'Form deleted', message: `${form.name} deleted` });
			// Step back when the last row of a trailing page is removed.
			if (result && result.items.length === 1 && page > 1) setPage(page - 1);
		} catch (error) {
			const code = formErrorCode(error);
			if (code === 409) {
				setDeleteInUse(true);
			} else if (code === 404) {
				setPendingDelete(null);
				refetch();
			} else {
				setDeleteError(formErrorMessage(error, 'Failed to delete form'));
			}
		}
	};

	const duplicate = (form: Form) => navigate(`${formLibraryPath()}/new?from=${encodeURIComponent(form.id)}`);

	const renderResults = () => {
		if (isError && !isFetching) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="red">
						<LuCircleAlert size={22} />
					</ThemeIcon>
					<Text fw={600}>Couldn't load forms</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!result) {
			return (
				<FormTable
					forms={[]}
					onDuplicate={() => {}}
					onUsage={() => {}}
					onDelete={() => {}}
					skeletonRows={perPage}
				/>
			);
		}

		if (result.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuClipboardList size={22} />
					</ThemeIcon>
					<Text fw={600}>No forms yet</Text>
					<Text fz="sm" c="dimmed" ta="center" maw={360}>
						Build an input form once, then pick it on any input node. People delivering input fill it in
						instead of writing JSON.
					</Text>
					<Can rule={Permission.FormsWrite}>
						<Button
							size="xs"
							mt={4}
							leftSection={<LuPlus size={14} />}
							component={Link}
							to={`${formLibraryPath()}/new`}
						>
							New form
						</Button>
					</Can>
				</Stack>
			);
		}

		if (visible.length === 0) {
			return (
				<Text fz="sm" c="dimmed" ta="center" py={32}>
					No form on this page matches “{filter.trim()}”.
				</Text>
			);
		}

		return (
			<div className={classes.results} data-loading={isFetching || undefined} aria-busy={isFetching}>
				<FormTable forms={visible} onDuplicate={duplicate} onUsage={setUsageOf} onDelete={openDelete} />
			</div>
		);
	};

	return (
		<ScrollArea h="100%" className={classes.canvas}>
			<Stack gap="lg" p={{ base: 'md', md: 'xl' }} maw={1180} mx="auto">
				<Group justify="space-between" align="flex-end" gap="sm">
					<div>
						<Title order={2} fz={22}>
							Forms
						</Title>
						<Text fz="sm" c="dimmed">
							Reusable input forms for workflow input nodes
						</Text>
					</div>
					<Group gap="xs">
						{result && (
							<Text fz="sm" c="dimmed">
								{result.total} {result.total === 1 ? 'form' : 'forms'}
							</Text>
						)}
						<Tooltip label="Refresh">
							<ActionIcon
								variant="default"
								size={36}
								aria-label="Refresh forms"
								onClick={refetch}
								loading={isFetching && !!result}
							>
								<LuRefreshCw size={16} />
							</ActionIcon>
						</Tooltip>
						<Can rule={Permission.FormsWrite}>
							<Button leftSection={<LuPlus size={16} />} component={Link} to={`${formLibraryPath()}/new`}>
								New form
							</Button>
						</Can>
					</Group>
				</Group>

				{result && result.items.length > 0 && (
					<TextInput
						maw={360}
						leftSection={<LuSearch size={14} />}
						placeholder="Filter this page by name"
						description="Filters only the forms on the current page"
						inputWrapperOrder={['input', 'description']}
						value={filter}
						onChange={(event) => setFilter(event.currentTarget.value)}
					/>
				)}

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

			<FormUsageDrawer form={usageOf} onClose={() => setUsageOf(null)} />

			<FormDeleteModal
				form={pendingDelete}
				loading={deleteState.isLoading}
				inUse={deleteInUse}
				error={deleteError}
				onClose={() => setPendingDelete(null)}
				onConfirm={handleDelete}
			/>
		</ScrollArea>
	);
};
