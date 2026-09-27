import React, { useState } from 'react';

import { ActionIcon, Button, Group, Indicator, Popover, ScrollArea, Stack, Text, Tooltip } from '@mantine/core';
import { LuBell, LuBellOff } from 'react-icons/lu';
import { useNavigate } from 'react-router';

import { NotificationItem } from '@module/notification/components/NotificationItem';
import { useNotificationList, useUnreadNotificationCount } from '@module/notification/hooks';
import type { AppNotification } from '@module/notification/types/AppNotification';

import classes from './NotificationBell.module.scss';

export const NotificationBell: React.FC = () => {
	const [opened, setOpened] = useState(false);
	const navigate = useNavigate();
	const { items, read, readAll, dismiss, clear } = useNotificationList();
	const unread = useUnreadNotificationCount();

	const handleClick = (item: AppNotification) => {
		read(item.id);
		if (item.link) {
			setOpened(false);
			navigate(item.link);
		}
	};

	return (
		<Popover opened={opened} onChange={setOpened} position="bottom-end" width={360} shadow="md" withinPortal>
			<Popover.Target>
				<Indicator
					color="red"
					size={14}
					offset={4}
					label={unread > 99 ? '99+' : unread}
					disabled={unread === 0}
				>
					<Tooltip label="Notifications" disabled={opened}>
						<ActionIcon size={32} aria-label="Notifications" onClick={() => setOpened((o) => !o)}>
							<LuBell size={18} />
						</ActionIcon>
					</Tooltip>
				</Indicator>
			</Popover.Target>
			<Popover.Dropdown p={0}>
				<Group className={classes.header} justify="space-between">
					<Text fz="sm" fw={600}>
						Notifications
					</Text>
					<Button variant="subtle" size="compact-xs" disabled={unread === 0} onClick={readAll}>
						Mark all read
					</Button>
				</Group>
				{items.length === 0 ? (
					<Stack className={classes.empty} align="center" gap={4}>
						<LuBellOff size={24} />
						<Text fz="sm">No notifications</Text>
					</Stack>
				) : (
					<ScrollArea.Autosize mah={400}>
						<Stack gap={2} p={4}>
							{items.map((item) => (
								<NotificationItem key={item.id} item={item} onClick={handleClick} onDismiss={dismiss} />
							))}
						</Stack>
					</ScrollArea.Autosize>
				)}
				<Group className={classes.footer} justify="center">
					<Button
						variant="subtle"
						color="gray"
						size="compact-xs"
						disabled={items.length === 0}
						onClick={clear}
					>
						Clear all
					</Button>
				</Group>
			</Popover.Dropdown>
		</Popover>
	);
};
