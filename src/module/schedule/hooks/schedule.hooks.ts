import { scheduleApi } from '@module/schedule/api';

export const {
	useListSchedulesQuery,
	useGetScheduleQuery,
	useCreateScheduleMutation,
	useReplaceScheduleMutation,
	useDeleteScheduleMutation,
	usePauseScheduleMutation,
	useResumeScheduleMutation,
} = scheduleApi;
