import { apiTagConfig } from '@config/apiTag.config';

import { coreApi } from '@core/api';

import type { Role } from '@module/role/types/Role';
import type { RoleList } from '@module/role/types/RoleList';

const RESOURCE = 'v1/roles';

// Read-only: roles come from configuration/OIDC, so the engine has no role-write API.
export const roleApi = coreApi.injectEndpoints({
	endpoints: (build) => ({
		listRoles: build.query<RoleList, void>({
			query: () => ({ method: 'get', url: RESOURCE }),
			providesTags: (result) => [
				{ type: apiTagConfig.role },
				...(result?.items ?? []).map((item) => ({ type: apiTagConfig.role, id: item.name })),
			],
		}),

		getRole: build.query<Role, string>({
			query: (name) => ({ method: 'get', url: `${RESOURCE}/${encodeURIComponent(name)}` }),
			providesTags: (_result, _error, name) => [{ type: apiTagConfig.role, id: name }],
		}),
	}),
});
