import { parseAsInteger, parseAsNumberLiteral, parseAsString, useQueryStates } from 'nuqs';

import { PER_PAGE_OPTIONS } from '@common/component/PaginationBar';

import { SCHEDULE_CREATE_PARAM } from '@module/schedule/constant';

const listParsers = {
	page: parseAsInteger.withDefault(1),
	perPage: parseAsNumberLiteral(PER_PAGE_OPTIONS).withDefault(PER_PAGE_OPTIONS[0]),
	/** A definition id to open the create form with; cleared once the form opens. */
	createFor: parseAsString,
};

const listUrlKeys = {
	perPage: 'per_page',
	createFor: SCHEDULE_CREATE_PARAM,
};

export const useScheduleListParams = () => useQueryStates(listParsers, { urlKeys: listUrlKeys, history: 'replace' });
