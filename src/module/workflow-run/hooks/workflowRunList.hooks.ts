import {
	debounce,
	parseAsBoolean,
	parseAsInteger,
	parseAsNumberLiteral,
	parseAsString,
	parseAsStringLiteral,
	useQueryStates,
} from 'nuqs';

import { PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { runSortOrders, runStatusTabOrder } from '@module/workflow-run/constant';
import type { WorkflowRunSort } from '@module/workflow-run/types/WorkflowRunSort';

const listParsers = {
	search: parseAsString.withDefault(''),
	definitionId: parseAsString,
	status: parseAsStringLiteral(runStatusTabOrder).withDefault('all'),
	// Absent = every run, `true` = step-through runs only, `false` = normal runs only.
	debug: parseAsBoolean,
	sort: parseAsStringLiteral(Object.keys(runSortOrders) as WorkflowRunSort[]).withDefault('newest'),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsNumberLiteral(PER_PAGE_OPTIONS).withDefault(PER_PAGE_OPTIONS[0]),
};

const listUrlKeys = {
	search: 'q',
	definitionId: 'definition',
	perPage: 'per_page',
};

export const useWorkflowRunListParams = () => useQueryStates(listParsers, { urlKeys: listUrlKeys, history: 'replace' });

export const SEARCH_URL_UPDATE = { limitUrlUpdates: debounce(300) };
