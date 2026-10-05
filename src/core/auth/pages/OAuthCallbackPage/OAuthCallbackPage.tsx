import React, { useEffect, useState } from 'react';

import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { LuTriangleAlert } from 'react-icons/lu';
import { Link, useNavigate, useSearchParams } from 'react-router';

import { AUTH_LOGIN_PATH } from '@core/auth/auth.constants';
import { sanitizeReturnTo } from '@core/auth/auth.utils';
import { completeOAuthLogin } from '@core/auth/oauth';
import { setOAuthSession } from '@core/auth/store';
import { useCoreDispatch } from '@core/store';

export const OAuthCallbackPage: React.FC = () => {
	const navigate = useNavigate();
	const dispatch = useCoreDispatch();
	const [searchParams] = useSearchParams();
	const [error, setError] = useState<string | null>(null);

	useEffect(() => {
		let cancelled = false;

		completeOAuthLogin(searchParams)
			.then(({ tokens, returnTo }) => {
				if (cancelled) return;
				dispatch(setOAuthSession(tokens));
				navigate(sanitizeReturnTo(returnTo), { replace: true });
			})
			.catch((err: unknown) => {
				if (!cancelled) setError(err instanceof Error ? err.message : 'SSO login failed');
			});

		return () => {
			cancelled = true;
		};
	}, [searchParams, dispatch, navigate]);

	return (
		<Center mih="100dvh" p="md">
			{error ? (
				<Alert
					variant="light"
					color="red"
					title="SSO login failed"
					icon={<LuTriangleAlert size={18} aria-hidden />}
					maw={480}
					w="100%"
				>
					<Stack gap="sm" align="flex-start">
						<Text size="sm">{error}</Text>
						<Button size="xs" color="red" variant="light" component={Link} to={AUTH_LOGIN_PATH} replace>
							Back to login
						</Button>
					</Stack>
				</Alert>
			) : (
				<Stack align="center" gap="sm">
					<Loader size="sm" />
					<Text c="dimmed" fz="sm">
						Completing sign in…
					</Text>
				</Stack>
			)}
		</Center>
	);
};
