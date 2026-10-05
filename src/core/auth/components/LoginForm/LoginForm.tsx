import React from 'react';

import { Button, PasswordInput, Stack } from '@mantine/core';
import { useForm } from '@mantine/form';

import { loginInitialValues, loginSchema, type LoginDto } from '../../dto';

interface LoginFormProps {
	loading?: boolean;
	error?: string | null;
	onSubmit?: (values: LoginDto) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ loading, error, onSubmit }) => {
	const form = useForm<LoginDto>({
		mode: 'uncontrolled',
		initialValues: loginInitialValues,
		validate: (values) => {
			const result = loginSchema.safeParse(values);
			if (result.success) return {};

			return Object.fromEntries(result.error.issues.map((issue) => [issue.path.join('.'), issue.message]));
		},
	});

	return (
		<form onSubmit={form.onSubmit((values) => onSubmit?.(values))} noValidate>
			<Stack gap="md">
				<PasswordInput
					label="API Key"
					placeholder="sk-..."
					size="md"
					autoComplete="off"
					key={form.key('apiKey')}
					{...form.getInputProps('apiKey')}
					error={form.errors.apiKey ?? error}
				/>

				<Button type="submit" size="md" fullWidth loading={loading}>
					Log In
				</Button>
			</Stack>
		</form>
	);
};
