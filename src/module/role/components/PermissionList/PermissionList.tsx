import React from 'react';

import { Alert, Badge, Group, Stack, Text } from '@mantine/core';
import { LuCheck, LuShieldAlert, LuTriangleAlert } from 'react-icons/lu';

import { PERMISSION_GROUPS, PERMISSION_META, hasWildcard, unrecognizedPermissions } from '@module/role/data';

interface PermissionListProps {
	permissions: string[];
	/** Shown when nothing is granted. */
	emptyText?: string;
}

/** The granted permissions grouped by resource, with anything the UI does not know listed apart. */
export const PermissionList: React.FC<PermissionListProps> = ({ permissions, emptyText = 'No permissions' }) => {
	const granted = new Set(permissions);
	const wildcard = hasWildcard(permissions);
	const unknown = unrecognizedPermissions(permissions);
	const groups = PERMISSION_GROUPS.map((group) => ({
		...group,
		permissions: group.permissions.filter((permission) => wildcard || granted.has(permission)),
	})).filter((group) => group.permissions.length > 0);

	if (groups.length === 0 && unknown.length === 0) {
		return (
			<Text fz="sm" c="dimmed">
				{emptyText}
			</Text>
		);
	}

	return (
		<Stack gap="sm">
			{wildcard && (
				<Alert color="violet" variant="light" icon={<LuShieldAlert size={16} />} p="xs">
					<Text fz="sm">
						Granted{' '}
						<Text span ff="monospace" fz="xs">
							*
						</Text>
						: every action, including ones added later.
					</Text>
				</Alert>
			)}
			{groups.map((group) => (
				<div key={group.id}>
					<Text fz="xs" fw={600} c="dimmed" tt="uppercase" mb={4}>
						{group.label}
					</Text>
					<Stack gap={4}>
						{group.permissions.map((permission) => (
							<Group key={permission} gap="xs" wrap="nowrap">
								<LuCheck size={14} color="var(--mantine-color-teal-6)" aria-hidden />
								<Text fz="sm">{PERMISSION_META[permission].label}</Text>
								<Text fz="xs" c="dimmed" ff="monospace">
									{permission}
								</Text>
							</Group>
						))}
					</Stack>
				</div>
			))}
			{unknown.length > 0 && (
				<div>
					<Group gap={6} mb={4}>
						<LuTriangleAlert size={14} color="var(--mantine-color-yellow-7)" aria-hidden />
						<Text fz="xs" fw={600} c="dimmed" tt="uppercase">
							Unrecognized
						</Text>
					</Group>
					<Text fz="xs" c="dimmed" mb={6}>
						The engine grants these but this UI doesn't know them yet, so nothing here is gated on them.
					</Text>
					<Group gap={4}>
						{unknown.map((permission) => (
							<Badge key={permission} color="yellow" variant="light" tt="none" ff="monospace">
								{permission}
							</Badge>
						))}
					</Group>
				</div>
			)}
		</Stack>
	);
};
