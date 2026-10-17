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

import { nodeDefinitionSortOrders } from '@module/node-definition/constant';
import type { NodeDefinitionSort } from '@module/node-definition/types/NodeDefinitionSort';

const listParsers = {
	name: parseAsString.withDefault(''),
	type: parseAsString,
	latestOnly: parseAsBoolean.withDefault(true),
	sort: parseAsStringLiteral(Object.keys(nodeDefinitionSortOrders) as NodeDefinitionSort[]).withDefault('name-asc'),
	page: parseAsInteger.withDefault(1),
	perPage: parseAsNumberLiteral(PER_PAGE_OPTIONS).withDefault(PER_PAGE_OPTIONS[0]),
};

const listUrlKeys = {
	latestOnly: 'latest_only',
	perPage: 'per_page',
};

export const useNodeDefinitionListParams = () =>
	useQueryStates(listParsers, { urlKeys: listUrlKeys, history: 'replace' });

export const NAME_URL_UPDATE = { limitUrlUpdates: debounce(300) };
