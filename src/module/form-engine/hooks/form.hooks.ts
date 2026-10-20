import { formApi } from '@module/form-engine/api';

export const {
	useListFormsQuery,
	useGetFormQuery,
	useLazyGetFormQuery,
	useGetFormUsageQuery,
	useCreateFormMutation,
	useUpdateFormMutation,
	useDeleteFormMutation,
} = formApi;
