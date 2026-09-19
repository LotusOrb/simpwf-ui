import React from 'react';

import { Alert, Button, Center, Code, MantineProvider, Stack, Text } from '@mantine/core';
import { LuRotateCw, LuTriangleAlert } from 'react-icons/lu';

interface FatalErrorProps {
	title?: string;
	error: unknown;
}

const describe = (error: unknown) => {
	if (error instanceof Error) return error.message;
	if (typeof error === 'string') return error;
	return 'Unknown error';
};

export const FatalError: React.FC<FatalErrorProps> = ({ title = 'Application failed to start', error }) => {
	return (
		<MantineProvider>
			<Center mih="100dvh" p="md">
				<Alert
					variant="light"
					color="red"
					title={title}
					icon={<LuTriangleAlert size={18} aria-hidden />}
					maw={520}
					w="100%"
				>
					<Stack gap="sm" align="flex-start">
						<Text size="sm">The app cannot continue. Fix the problem below, then reload the page.</Text>
						<Code block>{describe(error)}</Code>
						<Button
							size="xs"
							color="red"
							variant="light"
							leftSection={<LuRotateCw size={14} aria-hidden />}
							onClick={() => window.location.reload()}
						>
							Reload
						</Button>
					</Stack>
				</Alert>
			</Center>
		</MantineProvider>
	);
};
