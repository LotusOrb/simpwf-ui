import React from 'react';

import { Button, Center, Stack, Text, Title } from '@mantine/core';
import { LuArrowLeft } from 'react-icons/lu';
import { Link } from 'react-router';

interface NotFoundProps {
	homePath?: string;
	fullHeight?: boolean;
}

export const NotFound: React.FC<NotFoundProps> = ({ homePath = '/', fullHeight = true }) => {
	return (
		<Center mih={fullHeight ? '100dvh' : '60vh'} p="md">
			<Stack gap="xs" align="center" ta="center" maw={420}>
				<Text fz={72} fw={800} lh={1} c="dimmed">
					404
				</Text>
				<Title order={3}>Page not found</Title>
				<Text size="sm" c="dimmed">
					The page you are looking for does not exist or has been moved.
				</Text>
				<Button
					component={Link}
					to={homePath}
					mt="sm"
					variant="light"
					leftSection={<LuArrowLeft size={14} aria-hidden />}
				>
					Back to home
				</Button>
			</Stack>
		</Center>
	);
};
