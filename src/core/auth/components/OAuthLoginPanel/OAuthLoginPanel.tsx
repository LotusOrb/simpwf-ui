import React from 'react';

import { Alert, Button, Stack, Text } from '@mantine/core';
import { LuLogIn, LuTriangleAlert } from 'react-icons/lu';

interface OAuthLoginPanelProps {
	loading?: boolean;
	error?: string | null;
	onStart?: () => void;
}

export const OAuthLoginPanel: React.FC<OAuthLoginPanelProps> = ({ loading, error, onStart }) => {
	return (
		<Stack gap="md">
			<Text c="dimmed" fz="sm" ta="center">
				You will be sent to your identity provider to sign in, then brought back here.
			</Text>

			{error && (
				<Alert variant="light" color="red" icon={<LuTriangleAlert size={16} aria-hidden />}>
					{error}
				</Alert>
			)}

			<Button size="md" fullWidth loading={loading} leftSection={<LuLogIn size={18} />} onClick={onStart}>
				Continue with SSO
			</Button>
		</Stack>
	);
};
