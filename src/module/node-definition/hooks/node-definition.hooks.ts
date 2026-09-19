import { nodeDefinitionApi } from '@module/node-definition/api';

export const { useListNodeDefinitionsQuery, useGetNodeDefinitionQuery, useLazyGetNodeDefinitionQuery } =
	nodeDefinitionApi;
