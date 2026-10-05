import React from 'react';

import { Alert, Button, Center, Loader, Stack, Text } from '@mantine/core';
import { LuRotateCw, LuTriangleAlert } from 'react-icons/lu';
import { Outlet } from 'react-router';

import type { PermissionRule } from '@core/auth/authorization/authorization';
import { useAuthorization } from '@core/auth/authorization/authorization.hooks';

import { Forbidden } from '@common/component/Forbidden';

export const AuthorizationLoading: React.FC = () => (
	<Center mih="60vh">
		<Loader size="sm" />
	</Center>
);

export const AuthorizationError: React.FC<{ onRetry: () => void }> = ({ onRetry }) => (
	<Center mih="60vh" p="md">
		<Alert
			variant="light"
			color="red"
			title="Unable to load your permissions"
			icon={<LuTriangleAlert size={18} aria-hidden />}
			maw={460}
			w="100%"
		>
			<Stack gap="sm" align="flex-start">
				<Text size="sm">The server did not say what your role allows, so this page stays closed.</Text>
				<Button
					size="xs"
					color="red"
					variant="light"
					leftSection={<LuRotateCw size={14} aria-hidden />}
					onClick={onRetry}
				>
					Retry
				</Button>
			</Stack>
		</Alert>
	</Center>
);

interface RequirePermissionProps {
	rule: PermissionRule;
}

/** Route layout element: the shell stays and the URL is kept when the caller is denied. */
export const RequirePermission: React.FC<RequirePermissionProps> = ({ rule }) => {
	const { authorization, status, refetch } = useAuthorization();

	if (status === 'loading') return <AuthorizationLoading />;
	if (status === 'error') return <AuthorizationError onRetry={refetch} />;
	return authorization.evaluate(rule) ? <Outlet /> : <Forbidden />;
};
