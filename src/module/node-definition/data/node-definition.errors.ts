import type { CoreQueryError } from '@core/api';

import type { NodeDefinitionPayload } from '@module/node-definition/types/NodeDefinitionPayload';

export interface NodeDefinitionErrorCopy {
	title: string;
	detail: string | null;
	/** Set when the engine's reason is about one field, so the form can show it inline. */
	field?: keyof NodeDefinitionPayload | null;
}

const readError = (error: unknown): Partial<CoreQueryError> =>
	error && typeof error === 'object' ? (error as Partial<CoreQueryError>) : {};

// The engine's 422 reasons come from service/node_definition.go and model.ParseNodeContent.
const fieldOf = (message: string): keyof NodeDefinitionPayload => {
	if (/definition name is required/i.test(message)) return 'name';
	if (/node type .* is not supported/i.test(message)) return 'type';
	return 'content';
};

export const describeNodeDefinitionSaveError = (error: unknown): NodeDefinitionErrorCopy => {
	const { code, explain, message } = readError(error);

	if (code === 422 && message) {
		return { title: 'The engine rejected this node definition', detail: message, field: fieldOf(message) };
	}
	if (code === 409) {
		return {
			title: 'Version conflict',
			detail: message ?? null,
			field: null,
		};
	}
	return {
		title: "Couldn't save node definition",
		detail: message || explain || 'Something went wrong while saving',
		field: null,
	};
};

export const describeNodeDefinitionDeleteError = (error: unknown): NodeDefinitionErrorCopy | null => {
	if (!error) return null;
	const { code, explain, message } = readError(error);

	if (code === 409) {
		return {
			title: 'Used by workflow definitions or runs; delete those first.',
			detail: message ?? null,
		};
	}
	return {
		title: explain || "Couldn't delete node definition",
		detail: message && message !== explain ? message : null,
	};
};
