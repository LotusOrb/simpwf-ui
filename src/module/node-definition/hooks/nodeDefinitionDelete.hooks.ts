import { useState } from 'react';

import { describeNodeDefinitionDeleteError } from '@module/node-definition/data';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';

import { useDeleteNodeDefinitionMutation } from './node-definition.hooks';

// Owns the pending-delete state for a `NodeDefinitionDeleteModal`. Deletes one version only.
export const useNodeDefinitionDelete = (onDeleted?: (definition: NodeDefinition) => void) => {
	const [pending, setPending] = useState<NodeDefinition | null>(null);
	const [deleteDefinition, state] = useDeleteNodeDefinitionMutation();

	const close = () => {
		setPending(null);
		state.reset();
	};

	const confirm = async (definition: NodeDefinition) => {
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
		error: describeNodeDefinitionDeleteError(state.error),
	};
};
