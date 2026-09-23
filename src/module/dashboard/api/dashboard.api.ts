import { apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { DashboardStatistics } from '@module/dashboard/types/DashboardStatistics';
import type { DashboardStatisticsQuery } from '@module/dashboard/types/DashboardStatisticsQuery';

const RESOURCE = 'v1/statistics';

export const dashboardApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		getStatistics: build.query<DashboardStatistics, DashboardStatisticsQuery>({
			query: (param) => ({ method: 'get', url: RESOURCE, qParam: param }),
			providesTags: [{ type: apiTagConfig.statistics }],
		}),
	}),
});
