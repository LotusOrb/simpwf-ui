import { API_TAG_LIST_ID, apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';
import type { WorkflowDefinitionCreatePayload } from '@module/workflow-definition/types/WorkflowDefinitionCreatePayload';
import type { WorkflowDefinitionList } from '@module/workflow-definition/types/WorkflowDefinitionList';
import type { WorkflowDefinitionQuery } from '@module/workflow-definition/types/WorkflowDefinitionQuery';

const RESOURCE = 'v1/workflow/definition';

// Prefixed so it never collides with a definition id tag (a lineage id can equal its first version's id).
const lineageTag = (lineageId: string) => ({ type: apiTagConfig.workflowDefinition, id: `lineage:${lineageId}` });

export const workflowDefinitionApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listWorkflowDefinitions: build.query<WorkflowDefinitionList, WorkflowDefinitionQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: (result) => [
				{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowDefinition, id: item.id })),
			],
		}),

		listWorkflowDefinitionVersions: build.query<WorkflowDefinitionList, string>({
			query: (lineageId) => ({
				method: 'get',
				url: RESOURCE,
				qParam: {
					page: 1,
					perPage: 100,
					order: { by: 'version', direction: 'desc' },
					filter: {
						lineage_id: { op: '_eq', value: lineageId },
						latest_only: { op: '_eq', value: 'false' },
					},
				} satisfies WorkflowDefinitionQuery,
			}),
			providesTags: (result, _error, lineageId) => [
				lineageTag(lineageId),
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.workflowDefinition, id: item.id })),
			],
		}),

		getWorkflowDefinition: build.query<WorkflowDefinition, string>({
			query: (id) => ({ method: 'get', url: `${RESOURCE}/${id}` }),
			providesTags: (_result, _error, id) => [{ type: apiTagConfig.workflowDefinition, id }],
		}),

		// Definitions are immutable: there is no update endpoint. Editing POSTs a new version with
		// `previous_version_id` set, which lands in the same lineage.
		createWorkflowDefinition: build.mutation<WorkflowDefinition, WorkflowDefinitionCreatePayload>({
			query: (body) => ({ method: 'post', url: RESOURCE, body }),
			invalidatesTags: (result) => [
				{ type: apiTagConfig.workflowDefinition, id: API_TAG_LIST_ID },
				...(result ? [lineageTag(result.lineage_id)] : []),
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
