import React from 'react';

import { Button, Loader, Stack, Text, ThemeIcon } from '@mantine/core';
import { LuCircleAlert } from 'react-icons/lu';

import type { CoreQueryError } from '@core/api';

import { Forbidden } from '@common/component/Forbidden';

import { useNodeTypeCatalog } from '@module/node-type/hooks';

/**
 * Renders its children once the engine's node type catalog has loaded. Editing a definition needs it: it says which
 * node types exist and what each accepts, so nothing is edited against a guess.
 */
export const NodeTypeCatalogGate: React.FC<{ children: React.ReactNode }> = ({ children }) => {
	const { data, isLoading, isError, error, refetch, isFetching } = useNodeTypeCatalog();

	if (data) return <>{children}</>;

	if (isLoading) {
		return (
			<Stack align="center" justify="center" h="100%">
				<Loader size="sm" color="gray" />
			</Stack>
		);
	}

	const code = isError ? (error as Partial<CoreQueryError> | undefined)?.code : undefined;
	if (code === 403) return <Forbidden />;

	return (
		<Stack align="center" justify="center" gap="xs" h="100%" p="lg">
			<ThemeIcon size={48} radius="xl" variant="light" color="red">
				<LuCircleAlert size={22} />
			</ThemeIcon>
			<Text fw={600}>Node types unavailable</Text>
			<Text fz="sm" c="dimmed" ta="center" maw={420}>
				{code === 404
					? "This engine doesn't serve the node type catalog (GET /v1/node/types). Upgrade simpwf to edit definitions here."
					: "Couldn't load the node types this engine supports, so definitions can't be edited right now."}
			</Text>
			{code !== 404 && (
				<Button variant="default" size="xs" mt={4} loading={isFetching} onClick={refetch}>
					Try again
				</Button>
			)}
		</Stack>
	);
};
