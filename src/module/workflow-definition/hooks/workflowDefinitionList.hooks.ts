import {
	debounce,
	parseAsInteger,
	parseAsNumberLiteral,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from 'nuqs';

import { PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { complexityMeta, nodeTypeOrder, sortOrders } from '@module/workflow-definition/data';
import type { WorkflowDefinitionComplexity } from '@module/workflow-definition/types/WorkflowDefinitionComplexity';
import type { WorkflowDefinitionSort } from '@module/workflow-definition/types/WorkflowDefinitionSort';

export const VERSION_SCOPES = ['latest', 'all'] as const;
export type WorkflowDefinitionVersionScope = (typeof VERSION_SCOPES)[number];

const listParsers = {
	scope: parseAsStringLiteral(VERSION_SCOPES).withDefault('latest'),
	search: parseAsString.withDefault(''),
	sort: parseAsStringLiteral(Object.keys(sortOrders) as WorkflowDefinitionSort[]).withDefault('latest'),
	startType: parseAsStringLiteral(nodeTypeOrder),
	complexity: parseAsStringLiteral(Object.keys(complexityMeta) as WorkflowDefinitionComplexity[]),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsNumberLiteral(PER_PAGE_OPTIONS).withDefault(PER_PAGE_OPTIONS[0]),
};

const listUrlKeys = {
	search: 'q',
	startType: 'start_type',
	perPage: 'per_page',
};

export const useWorkflowDefinitionListParams = () =>
	useQueryStates(listParsers, { urlKeys: listUrlKeys, history: 'replace' });

export const SEARCH_URL_UPDATE = { limitUrlUpdates: debounce(300) };
