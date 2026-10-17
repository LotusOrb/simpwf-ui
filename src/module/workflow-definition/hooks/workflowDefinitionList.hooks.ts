import {
	debounce,
	parseAsInteger,
	parseAsNumberLiteral,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from 'nuqs';

import { PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { sortOrders } from '@module/workflow-definition/constant';
import type { WorkflowDefinitionSort } from '@module/workflow-definition/types/WorkflowDefinitionSort';

const listParsers = {
	name: parseAsString.withDefault(''),
	sort: parseAsStringLiteral(Object.keys(sortOrders) as WorkflowDefinitionSort[]).withDefault('latest'),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsNumberLiteral(PER_PAGE_OPTIONS).withDefault(PER_PAGE_OPTIONS[0]),
};

const listUrlKeys = {
	perPage: 'per_page',
};

export const useWorkflowDefinitionListParams = () =>
	useQueryStates(listParsers, { urlKeys: listUrlKeys, history: 'replace' });

export const NAME_URL_UPDATE = { limitUrlUpdates: debounce(300) };
