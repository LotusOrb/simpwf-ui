import React from 'react';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { LuArrowLeft } from 'react-icons/lu';
import { Link } from 'react-router';

interface ForbiddenProps {
	homePath?: string;
	fullHeight?: boolean;
	showHomeLink?: boolean;
}

export const Forbidden: React.FC<ForbiddenProps> = ({ homePath = '/app', fullHeight = false, showHomeLink = true }) => {
	return (
		<Center mih={fullHeight ? '100dvh' : '60vh'} p="md">
			<Stack gap="xs" align="center" ta="center" maw={420}>
				<Text fz={72} fw={800} lh={1} c="dimmed">
					403
				</Text>
				<Title order={3}>Access denied</Title>
				<Text size="sm" c="dimmed">
					Your role does not grant access to this page. Ask an administrator if you need it.
				</Text>
				{showHomeLink && (
					<Button
						component={Link}
						to={homePath}
						mt="sm"
						variant="light"
						leftSection={<LuArrowLeft size={14} aria-hidden />}
					>
						Back to home
					</Button>
				)}
			</Stack>
		</Center>
	);
};
