export type NotificationLevel = 'success' | 'error' | 'info' | 'warning';

export interface AppNotification {
	id: string;
	level: NotificationLevel;
	title?: string;
	message: string;
	/** Router path to open when the item is clicked. */
	link?: string;
	/** Epoch ms, kept as a number so it serializes. */
	createdAt: number;
	read: boolean;
}
