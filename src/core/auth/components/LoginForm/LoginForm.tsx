import React from 'react';

import { Button, PasswordInput, Stack, Text, Title } from '@mantine/core';
import { useForm } from '@mantine/form';

import { loginInitialValues, loginSchema, type LoginDto } from '../../dto';
import classes from './LoginForm.module.scss';

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
			<Stack gap={0}>
				<Title order={1} className={classes.title}>
					Welcome Back
				</Title>
				<Text c="dimmed" fz="sm" className={classes.subtitle}>
					Enter your credentials
				</Text>

				<Stack gap="md" className={classes.fields}>
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
			</Stack>
		</form>
	);
};
