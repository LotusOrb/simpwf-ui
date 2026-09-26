import React, { useEffect } from 'react';

import { Alert, Button, Group, Modal, PasswordInput, Stack, Text, TextInput } from '@mantine/core';
import { useForm } from '@mantine/form';
import { LuCircleAlert, LuTriangleAlert } from 'react-icons/lu';

import { SECRET_VALUE_MAX_LENGTH, secretReference } from '@module/secret/data';
import { secretInitialValues, secretSchema, type SecretDto } from '@module/secret/dto';

export type SecretFormMode = { type: 'create' } | { type: 'rotate'; key: string };

interface SecretFormModalProps {
	mode: SecretFormMode | null;
	loading: boolean;
	error: string | null;
	onClose: () => void;
	onSubmit: (values: SecretDto) => void;
}

export const SecretFormModal: React.FC<SecretFormModalProps> = ({ mode, loading, error, onClose, onSubmit }) => {
	const rotating = mode?.type === 'rotate';

	const form = useForm<SecretDto>({
		mode: 'controlled',
		initialValues: secretInitialValues,
		validate: (values) => {
			const result = secretSchema.safeParse(values);
			if (result.success) return {};

			return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
		},
	});

	// Reset on every open so a previous value never lingers in the form.
	useEffect(() => {
		if (!mode) return;
		form.setValues({ key: mode.type === 'rotate' ? mode.key : '', value: '' });
		form.resetDirty();
		form.clearErrors();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [mode]);

	const key = form.values.key;

	return (
		<Modal
			opened={!!mode}
			onClose={onClose}
			title={rotating ? 'Rotate secret' : 'New secret'}
			centered
			closeOnClickOutside={!loading}
			closeOnEscape={!loading}
			withCloseButton={!loading}
		>
			<form onSubmit={form.onSubmit(onSubmit)} noValidate>
				<Stack gap="md">
					{rotating && (
						<Alert color="yellow" variant="light" icon={<LuTriangleAlert size={16} />}>
							The current value is replaced and can't be recovered. Runs that start after this use the new
							value.
						</Alert>
					)}

					<TextInput
						label="Key"
						placeholder="SLACK_TOKEN"
						description={
							key ? (
								<>
									Reference as{' '}
									<Text span ff="monospace" fz="xs">
										{secretReference(key)}
									</Text>
								</>
							) : (
								'Letters, numbers and underscores'
							)
						}
						autoComplete="off"
						spellCheck={false}
						disabled={rotating}
						data-autofocus={!rotating || undefined}
						styles={{ input: { fontFamily: 'var(--mantine-font-family-monospace)' } }}
						{...form.getInputProps('key')}
					/>

					<PasswordInput
						label={rotating ? 'New value' : 'Value'}
						description={`Write-only. Up to ${SECRET_VALUE_MAX_LENGTH} characters.`}
						autoComplete="new-password"
						data-autofocus={rotating || undefined}
						{...form.getInputProps('value')}
					/>

					{error && (
						<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />}>
							{error}
						</Alert>
					)}

					<Group justify="flex-end" gap="xs">
						<Button variant="default" onClick={onClose} disabled={loading}>
							Cancel
						</Button>
						<Button type="submit" loading={loading}>
							{rotating ? 'Rotate' : 'Create'}
						</Button>
					</Group>
				</Stack>
			</form>
		</Modal>
	);
};
