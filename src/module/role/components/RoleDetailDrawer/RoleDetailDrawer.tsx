import React from 'react';

import { Alert, Divider, Drawer, Group, Loader, Stack, Text } from '@mantine/core';
import { skipToken } from '@reduxjs/toolkit/query';
import dayjs from 'dayjs';
import { LuCircleAlert } from 'react-icons/lu';

import { PermissionList } from '@module/role/components/PermissionList';
import { useGetRoleQuery } from '@module/role/hooks';
import type { Role } from '@module/role/types/Role';

interface RoleDetailDrawerProps {
	/** The row the drawer was opened from; it is shown until the detail request lands. `null` closes it. */
	role: Role | null;
	onClose: () => void;
}

const formatTime = (value: string) => dayjs(value).format('DD MMM YYYY HH:mm');

export const RoleDetailDrawer: React.FC<RoleDetailDrawerProps> = ({ role, onClose }) => {
	const { data, isFetching, isError } = useGetRoleQuery(role?.name ?? skipToken);
	const detail = data && data.name === role?.name ? data : role;

	return (
		<Drawer
			opened={!!role}
			onClose={onClose}
			position="right"
			size="md"
			title={
				<Group gap="xs">
					<Text fw={600} ff="monospace">
						{role?.name}
					</Text>
					{isFetching && <Loader size={14} color="gray" />}
				</Group>
			}
		>
			{detail && (
				<Stack gap="md">
					<Text fz="sm" c={detail.description ? undefined : 'dimmed'}>
						{detail.description || 'No description in the role configuration.'}
					</Text>

					{isError && (
						<Alert color="red" variant="light" icon={<LuCircleAlert size={16} />} p="xs">
							Couldn't refresh this role; showing the catalog entry.
						</Alert>
					)}

					<Divider label="Permissions" labelPosition="left" />
					<PermissionList permissions={detail.permissions} emptyText="This role grants nothing." />

					<Divider />
					<Group gap="xl">
						<div>
							<Text fz="xs" c="dimmed">
								Created
							</Text>
							<Text fz="sm">{formatTime(detail.created_at)}</Text>
						</div>
						<div>
							<Text fz="xs" c="dimmed">
								Updated
							</Text>
							<Text fz="sm">{formatTime(detail.updated_at)}</Text>
						</div>
					</Group>
				</Stack>
			)}
		</Drawer>
	);
};
