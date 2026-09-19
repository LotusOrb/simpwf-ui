import { coreApi } from '@core/api';

import type { AppHealth } from '@module/app/types/AppHealth';

const RESOURCE = '/health';

export const appApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		getHealthLive: build.query<AppHealth, void>({
			query: () => ({ method: 'get', url: `${RESOURCE}/live` }),
			extraOptions: { anonymous: true },
		}),

		getHealthReady: build.query<AppHealth, void>({
			query: () => ({ method: 'get', url: `${RESOURCE}/ready` }),
			extraOptions: { anonymous: true },
		}),
	}),
});
