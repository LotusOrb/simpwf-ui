import React, { useEffect } from 'react';

import { Alert, Autocomplete, Button, Group, Modal, Stack, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { LuCircleAlert, LuInfo } from 'react-icons/lu';

import { CodeEditor } from '@common/component/CodeEditor';

import { nodeDefinitionTemplate, type NodeDefinitionErrorCopy } from '@module/node-definition/data';
import { useNodeDefinitionLibrary } from '@module/node-definition/hooks';
import type { NodeDefinition } from '@module/node-definition/types/NodeDefinition';
import type { NodeDefinitionPayload } from '@module/node-definition/types/NodeDefinitionPayload';
import { nodeTypeOrder } from '@module/workflow-definition/data';

export type NodeDefinitionFormMode = { type: 'create' } | { type: 'version'; source: NodeDefinition };

interface NodeDefinitionFormValues {
	name: string;
	type: string;
	content: string;
}

interface NodeDefinitionFormModalProps {
	mode: NodeDefinitionFormMode | null;
	loading: boolean;
	error: NodeDefinitionErrorCopy | null;
	onClose: () => void;
	onSubmit: (payload: NodeDefinitionPayload) => void;
}

// Custom types are registered as lowercase identifiers (e.g. s3fetch).
const TYPE_PATTERN = /^[a-z][a-z0-9_]*$/;

const parseObject = (text: string): Record<string, unknown> | null => {
	try {
		const value: unknown = JSON.parse(text);
		return value && typeof value === 'object' && !Array.isArray(value) ? (value as Record<string, unknown>) : null;
	} catch {
		return null;
	}
};

const DEFAULT_TYPE = 'script';

export const NodeDefinitionFormModal: React.FC<NodeDefinitionFormModalProps> = ({
	mode,
	loading,
	error,
	onClose,
	onSubmit,
}) => {
	const versioning = mode?.type === 'version';
	const library = useNodeDefinitionLibrary({ skip: !mode });

	const form = useForm<NodeDefinitionFormValues>({
		mode: 'controlled',
		initialValues: { name: '', type: DEFAULT_TYPE, content: nodeDefinitionTemplate(DEFAULT_TYPE) },
		validate: {
			name: (value) => (value.trim() ? null : 'Enter a name'),
			type: (value) => (TYPE_PATTERN.test(value) ? null : 'Use a lowercase identifier, like script or s3fetch'),
			content: (value) => (parseObject(value) ? null : 'Content must be a JSON object'),
		},
	});

	// Reset on every open so a previous draft never lingers.
	const key = mode && (mode.type === 'version' ? `version:${mode.source.id}` : 'create');
	useEffect(() => {
		if (!mode) return;
		form.setValues(
			mode.type === 'version'
				? {
						name: mode.source.name,
						type: mode.source.type,
						content: JSON.stringify(mode.source.content, null, 2),
					}
				: { name: '', type: DEFAULT_TYPE, content: nodeDefinitionTemplate(DEFAULT_TYPE) },
		);
		form.resetDirty();
		form.clearErrors();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [key]);

	// A 422 that names a field is shown on that field.
	useEffect(() => {
		if (error?.field && error.detail) form.setFieldError(error.field, error.detail);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [error]);

	const { type } = form.values;
	// The engine serves a type's schema on definition reads, so it comes from the source or any definition of the type.
	const schema = (mode?.type === 'version' ? mode.source.schema : null) ?? library.schemaFor(type);

	const changeType = (next: string) => {
		// Untouched starting content follows the type; edited content is left alone.
		if (form.values.content === nodeDefinitionTemplate(form.values.type)) {
			form.setFieldValue('content', nodeDefinitionTemplate(next));
		}
		form.setFieldValue('type', next);
	};

	const submit = (values: NodeDefinitionFormValues) =>
		onSubmit({
			name: values.name.trim(),
			type: values.type,
			content: parseObject(values.content) ?? {},
			...(mode?.type === 'version' ? { previous_version_id: mode.source.id } : {}),
		});

	return (
		<Modal
			opened={!!mode}
			onClose={onClose}
			title={versioning ? `New version of ${mode.source.name}` : 'New node definition'}
			size="xl"
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<form onSubmit={form.onSubmit(submit)} noValidate>
				<Stack gap="md">
					{versioning && (
						<Alert color="blue" variant="light" icon={<LuInfo size={16} />} p="xs">
							Definitions are immutable: saving publishes v{mode.source.version + 1} in the same lineage.
							Workflows pinned to v{mode.source.version} keep using it.
						</Alert>
					)}

					<Group grow align="flex-start">
						<TextInput
							label="Name"
							placeholder="Fetch customer"
							data-autofocus
							{...form.getInputProps('name')}
						/>
						<Autocomplete
							label="Type"
							description={
								versioning ? 'Fixed for a lineage' : 'A built-in type or a registered custom one'
							}
							data={[...nodeTypeOrder, ...library.customTypes]}
							disabled={versioning}
							{...form.getInputProps('type')}
							onChange={changeType}
						/>
					</Group>

					<CodeEditor
						label="Content"
						description={
							schema
								? 'The node object, checked against the engine schema for this type as you type'
								: 'The node object. No schema is known for this type yet, so only JSON syntax is checked.'
						}
						language="json"
						height={320}
						value={form.values.content}
						onChange={(value) => form.setFieldValue('content', value)}
						error={form.errors.content}
						jsonSchema={schema ?? undefined}
					/>

					{error && !error.field && (
						<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />} title={error.title}>
							{error.detail}
						</Alert>
					)}

					<Group justify="flex-end" gap="xs">
						<Button variant="default" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							{versioning ? `Save as v${mode.source.version + 1}` : 'Create'}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};
