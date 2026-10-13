import { nodeDefinitionApi } from '@module/node-definition/api';

export const {
	useListNodeDefinitionsQuery,
	useListNodeDefinitionVersionPagesInfiniteQuery,
	useGetNodeDefinitionQuery,
	useLazyGetNodeDefinitionQuery,
	useCreateNodeDefinitionMutation,
	useDeleteNodeDefinitionMutation,
} = nodeDefinitionApi;
