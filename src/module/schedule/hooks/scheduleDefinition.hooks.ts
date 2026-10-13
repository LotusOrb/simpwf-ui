import { skipToken } from '@reduxjs/toolkit/query';

import type { CoreQueryError } from '@core/api';
import { Permission, useCan } from '@core/auth/authorization';

import { useGetWorkflowDefinitionQuery } from '@module/workflow-definition/hooks';

/**
 * The workflow definition a schedule starts, resolved through the shared definition cache. `deleted` is set when
 * the engine no longer has it; without definitions:read only the id is known.
 */
export const useScheduleDefinition = (definitionId: string | null | undefined) => {
	const canRead = useCan(Permission.DefinitionsRead);
	const { data, error, isLoading } = useGetWorkflowDefinitionQuery(
		canRead && definitionId ? definitionId : skipToken,
	);
	const deleted = (error as CoreQueryError | undefined)?.code === 404;

	return {
		definition: data && data.id === definitionId ? data : null,
		label: data && data.id === definitionId ? `${data.name} v${data.version}` : null,
		deleted,
		loading: isLoading,
		canRead,
	};
};
