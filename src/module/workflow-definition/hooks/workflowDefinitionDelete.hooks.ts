import { useState } from 'react';

import { describeDeleteError } from '@module/workflow-definition/data';
import type { WorkflowDefinition } from '@module/workflow-definition/types/WorkflowDefinition';

import { useDeleteWorkflowDefinitionMutation } from './workflow-definition.hooks';

// Owns the pending-delete state for a `WorkflowDefinitionDeleteModal`. Deletes one version only.
export const useWorkflowDefinitionDelete = (onDeleted?: (definition: WorkflowDefinition) => void) => {
	const [pending, setPending] = useState<WorkflowDefinition | null>(null);
	const [deleteDefinition, state] = useDeleteWorkflowDefinitionMutation();

	const close = () => {
		setPending(null);
		state.reset();
	};

	const confirm = async (definition: WorkflowDefinition) => {
		const response = await deleteDefinition(definition.id);
		if ('error' in response) return;

		close();
		onDeleted?.(definition);
	};

	return {
		pending,
		request: setPending,
		close,
		confirm,
		loading: state.isLoading,
		error: describeDeleteError(state.error),
	};
};
