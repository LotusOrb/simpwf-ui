import React, { useState } from 'react';

import { Anchor, Box, Container, Flex, Group, Stack, Text } from '@mantine/core';
import { useNavigate } from 'react-router';

import { useVerifyApiTokenMutation } from '@core/auth/api';
import { LoginForm } from '@core/auth/components/LoginForm';
import { LoginHero } from '@core/auth/components/LoginHero';
import type { LoginDto } from '@core/auth/dto';
import { setToken } from '@core/auth/store';
import { useCoreDispatch } from '@core/store';

import { BrandMark } from '@common/component/BrandMark';

import classes from './LoginPage.module.scss';

export const LoginPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const [verifyApiToken, { isLoading }] = useVerifyApiTokenMutation();
	const [error, setError] = useState<string | null>(null);

	const handleSubmit = async ({ apiKey }: LoginDto) => {
		setError(null);
		const result = await verifyApiToken(apiKey);

		if ('error' in result && result.error) {
			const code = 'code' in result.error ? result.error.code : 0;
			setError(code === 401 || code === 403 ? 'Invalid API key' : 'Unable to reach the workflow engine');
			return;
		}

		dispatch(setToken(apiKey));
		navigate('/app', { replace: true });
	};
	return (
		<Flex p={{ base: 'md', md: 'lg' }} gap="lg" className={classes.root}>
			<Stack flex={1} gap="xl" className={classes.panel}>
				<BrandMark />

				<Container size={420} w="100%" flex={1} px={0}>
					<Flex className={classes.formWrapper}>
						<Box className={classes.form}>
							<LoginForm loading={isLoading} error={error} onSubmit={handleSubmit} />
						</Box>
					</Flex>
				</Container>

				<Group justify="space-between" wrap="wrap" gap="xs">
					<Text fz="xs" c="dimmed">
						Copyright &copy; {new Date().getFullYear()} simpwf Enterprises LTD.
					</Text>
					<Anchor component="button" type="button" fz="xs" c="dimmed">
						Privacy Policy
					</Anchor>
				</Group>
			</Stack>

			<Box flex={1} visibleFrom="md">
				<LoginHero />
			</Box>
		</Flex>
	);
};
