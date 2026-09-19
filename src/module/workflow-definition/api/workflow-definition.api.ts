import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionList } from '@module/workflow-definition/types/WorkflowDefinitionList';
import type { WorkflowDefinitionQuery } from '@module/workflow-definition/types/WorkflowDefinitionQuery';

const RESOURCE = '/workflow-definitions';

export const workflowDefinitionApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listWorkflowDefinitions: build.query<WorkflowDefinitionList, WorkflowDefinitionQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowDefinition, id: item.id })),
			],
		}),

		getWorkflowDefinition: build.query<WorkflowDefinition, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowDefinition, id }],
		}),

		createWorkflowDefinition: build.mutation<WorkflowDefinition, Pick<WorkflowDefinition, 'name' | 'content'>>({
			query: (body) => ({ method: 'post', url: RESOURCE, body }),
			invalidatesTags: [{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID }],
		}),

		updateWorkflowDefinition: build.mutation<
			WorkflowDefinition,
			{ id: string } & Partial<Pick<WorkflowDefinition, 'name' | 'content'>>
		>({
			query: ({ id, ...body }) => ({ method: 'put', url: `${RESOURCE}/${id}`, body }),
			invalidatesTags: (_result, _error, { id }) => [
				{ type: apiTagConfig.workflowDefinition, id },
				{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID },
			],
		}),

		deleteWorkflowDefinition: build.mutation<void, string>({
			query: (id) => ({ method: 'delete', url: `${RESOURCE}/${id}` }),
			invalidatesTags: (_result, _error, id) => [
				{ type: apiTagConfig.workflowDefinition, id },
				{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID },
			],
		}),
	}),
});
