import React, { useState } from 'react';

import { ActionIcon, Button, Group, ScrollArea, Stack, Text, ThemeIcon, Title, Tooltip } from '@mantine/core';
import { LuCalendarClock, LuCircleAlert, LuPlus, LuRefreshCw } from 'react-icons/lu';

import type { CoreQueryError } from '@core/api/core.baseQuery';
import { Can, Permission, useCan } from '@core/auth/authorization';

import { PaginationBar } from '@common/component/PaginationBar';

import { useNotify } from '@module/notification/hooks';
import { ScheduleDeleteModal } from '@module/schedule/components/ScheduleDeleteModal';
import { ScheduleFormModal, type ScheduleFormMode } from '@module/schedule/components/ScheduleFormModal';
import { ScheduleTable } from '@module/schedule/components/ScheduleTable';
import { describeScheduleError, SCHEDULE_REPLACE_REMOVED, type ScheduleErrorCopy } from '@module/schedule/data';
import { scheduleFromDto, type ScheduleDto } from '@module/schedule/dto';
import {
	useCreateScheduleMutation,
	useDeleteScheduleMutation,
	useListSchedulesQuery,
	usePauseScheduleMutation,
	useReplaceScheduleMutation,
	useResumeScheduleMutation,
	useScheduleDefinition,
	useScheduleListParams,
} from '@module/schedule/hooks';
import type { Schedule } from '@module/schedule/types/Schedule';

import classes from './ScheduleListPage.module.scss';

const errorMessage = (error: unknown, fallback: string) => {
	const message = error && typeof error === 'object' && 'message' in error ? error.message : null;
	return typeof message === 'string' && message ? message : fallback;
};

const errorCode = (error: unknown) =>
	error && typeof error === 'object' && 'code' in error ? (error as CoreQueryError).code : null;

export const ScheduleListPage: React.FC = () => {
	const [params, setParams] = useScheduleListParams();
	const { page, perPage, createFor } = params;
	const setPage = (next: number) => setParams({ page: next });
	const canWrite = useCan(Permission.SchedulesWrite);

	const [formMode, setFormMode] = useState<ScheduleFormMode | null>(null);
	const [formError, setFormError] = useState<ScheduleErrorCopy | null>(null);
	const [pendingDelete, setPendingDelete] = useState<Schedule | null>(null);
	const [deleteError, setDeleteError] = useState<string | null>(null);
	const pendingDefinition = useScheduleDefinition(pendingDelete?.workflow_definition_id);

	const { data: result, isFetching, isError, refetch } = useListSchedulesQuery({ page, perPage });
	const [createSchedule, createState] = useCreateScheduleMutation();
	const [replaceSchedule, replaceState] = useReplaceScheduleMutation();
	const [deleteSchedule, deleteState] = useDeleteScheduleMutation();
	const [pauseSchedule] = usePauseScheduleMutation();
	const [resumeSchedule] = useResumeScheduleMutation();
	const notify = useNotify();

	const openForm = (mode: ScheduleFormMode) => {
		setFormError(null);
		setFormMode(mode);
	};

	// `?new=<definition id>` (from the workflow definition editor) opens the create form prefilled until it closes.
	const shownMode: ScheduleFormMode | null =
		formMode ?? (createFor && canWrite ? { type: 'create', definitionId: createFor } : null);

	const closeForm = () => {
		setFormMode(null);
		setFormError(null);
		if (createFor) setParams({ createFor: null });
	};

	const handleSubmit = async (values: ScheduleDto) => {
		setFormError(null);
		const payload = scheduleFromDto(values);
		const mode = shownMode;
		const replacing = mode?.type === 'edit' && !mode.removed;
		try {
			if (replacing) {
				await replaceSchedule({ id: mode.schedule.id, payload }).unwrap();
				notify.success({
					title: 'Schedule replaced',
					message: `Schedule ${payload.crontab} saved with a new id`,
				});
			} else {
				await createSchedule(payload).unwrap();
				notify.success({ title: 'Schedule created', message: `Schedule ${payload.crontab} created` });
			}
			closeForm();
		} catch (error) {
			// The old schedule is gone; keep the form open in a mode where saving creates it again.
			if (replacing && (error as CoreQueryError).explain === SCHEDULE_REPLACE_REMOVED) {
				setFormMode({ ...mode, removed: true });
			}
			setFormError(describeScheduleError(error, 'Failed to save schedule'));
		}
	};

	const handleToggle = async (schedule: Schedule, enabled: boolean) => {
		try {
			await (enabled ? resumeSchedule : pauseSchedule)(schedule.id).unwrap();
		} catch (error) {
			notify.error({
				title: enabled ? "Couldn't resume schedule" : "Couldn't pause schedule",
				message: errorMessage(error, 'Something went wrong'),
				toastOnly: true,
			});
			if (errorCode(error) === 404) refetch();
		}
	};

	const openDelete = (schedule: Schedule) => {
		setDeleteError(null);
		setPendingDelete(schedule);
	};

	const handleDelete = async (schedule: Schedule) => {
		setDeleteError(null);
		try {
			await deleteSchedule(schedule.id).unwrap();
			setPendingDelete(null);
			// Step back when the last row of a trailing page is removed.
			if (result && result.items.length === 1 && page > 1) setPage(page - 1);
		} catch (error) {
			if (errorCode(error) === 404) {
				setPendingDelete(null);
				refetch();
			} else {
				setDeleteError(errorMessage(error, 'Failed to delete schedule'));
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
					<Text fw={600}>Couldn't load schedules</Text>
					<Button variant="default" size="xs" mt={4} onClick={refetch}>
						Try again
					</Button>
				</Stack>
			);
		}

		if (!result) {
			return (
				<ScheduleTable
					schedules={[]}
					onToggle={() => {}}
					onEdit={() => {}}
					onDelete={() => {}}
					skeletonRows={perPage}
				/>
			);
		}

		if (result.items.length === 0) {
			return (
				<Stack align="center" gap="xs" py={48}>
					<ThemeIcon size={48} radius="xl" variant="light" color="gray">
						<LuCalendarClock size={22} />
					</ThemeIcon>
					<Text fw={600}>No schedules yet</Text>
					<Text fz="sm" c="dimmed" ta="center" maw={380}>
						Start a workflow on a cron timetable, like every weekday at 09:00 or every 15 minutes.
					</Text>
					<Can rule={Permission.SchedulesWrite}>
						<Button
							size="xs"
							mt={4}
							leftSection={<LuPlus size={14} />}
							onClick={() => openForm({ type: 'create' })}
						>
							New schedule
						</Button>
					</Can>
				</Stack>
			);
		}

		return (
			<div className={classes.results} data-loading={isFetching || undefined} aria-busy={isFetching}>
				<ScheduleTable
					schedules={result.items}
					onToggle={handleToggle}
					onEdit={(schedule) => openForm({ type: 'edit', schedule })}
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
							Schedules
						</Title>
						<Text fz="sm" c="dimmed">
							Cron timetables that start workflow runs
						</Text>
					</div>
					<Group gap="xs">
						{result && (
							<Text fz="sm" c="dimmed">
								{result.total} {result.total === 1 ? 'schedule' : 'schedules'}
							</Text>
						)}
						<Tooltip label="Refresh">
							<ActionIcon
								variant="default"
								size={36}
								aria-label="Refresh schedules"
								onClick={refetch}
								loading={isFetching && !!result}
							>
								<LuRefreshCw size={16} />
							</ActionIcon>
						</Tooltip>
						<Can rule={Permission.SchedulesWrite}>
							<Button leftSection={<LuPlus size={16} />} onClick={() => openForm({ type: 'create' })}>
								New schedule
							</Button>
						</Can>
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
						onPerPageChange={(value) => setParams({ perPage: value, page: null })}
					/>
				)}
			</Stack>

			<ScheduleFormModal
				mode={shownMode}
				loading={createState.isLoading || replaceState.isLoading}
				error={formError}
				onClose={closeForm}
				onSubmit={handleSubmit}
			/>

			<ScheduleDeleteModal
				schedule={pendingDelete}
				workflowLabel={pendingDefinition.label}
				loading={deleteState.isLoading}
				error={deleteError}
				onClose={() => setPendingDelete(null)}
				onConfirm={handleDelete}
			/>
		</ScrollArea>
	);
};
