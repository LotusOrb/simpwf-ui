import React from 'react';

import { CloseButton, Text, ThemeIcon, UnstyledButton } from '@mantine/core';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';

import { NOTIFICATION_LEVEL } from '@module/notification/data';
import type { AppNotification } from '@module/notification/types/AppNotification';

import classes from './NotificationItem.module.scss';

dayjs.extend(relativeTime);

interface NotificationItemProps {
	item: AppNotification;
	onClick: (item: AppNotification) => void;
	onDismiss: (id: string) => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({ item, onClick, onDismiss }) => {
	const { color, icon: Icon } = NOTIFICATION_LEVEL[item.level];

	return (
		<div className={classes.root} data-read={item.read || undefined}>
			<UnstyledButton className={classes.body} onClick={() => onClick(item)}>
				<ThemeIcon variant="light" color={color} size={28} radius="xl">
					<Icon size={16} />
				</ThemeIcon>
				<div className={classes.text}>
					{item.title && (
						<Text fz="sm" fw={600} truncate>
							{item.title}
						</Text>
					)}
					<Text fz="sm" lineClamp={2}>
						{item.message}
					</Text>
					<Text fz="xs" c="dimmed">
						{dayjs(item.createdAt).fromNow()}
					</Text>
				</div>
				{!item.read && <span className={classes.unreadDot} />}
			</UnstyledButton>
			<CloseButton
				className={classes.dismiss}
				size="sm"
				aria-label="Dismiss notification"
				onClick={() => onDismiss(item.id)}
			/>
		</div>
	);
};
