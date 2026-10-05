import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

import { LocalKVStore } from '@core/localKVStore';

import { NOTIFICATION_LEVEL, NOTIFICATION_LIMIT } from '@module/notification/data';
import type { AppNotification } from '@module/notification/types/AppNotification';

const notificationStore = new LocalKVStore('notification');

const ITEMS_KEY = 'items';

const isNotification = (value: unknown): value is AppNotification => {
	if (!value || typeof value !== 'object') return false;
	const item = value as Record<string, unknown>;
	return (
		typeof item.id === 'string' &&
		typeof item.level === 'string' &&
		item.level in NOTIFICATION_LEVEL &&
		typeof item.message === 'string' &&
		typeof item.createdAt === 'number' &&
		typeof item.read === 'boolean'
	);
};

/** Reads the stored list, dropping entries that no longer match the shape. */
const loadItems = (): AppNotification[] => {
	const stored = notificationStore.get<unknown>(ITEMS_KEY);
	if (!Array.isArray(stored)) return [];
	return stored.filter(isNotification).slice(0, NOTIFICATION_LIMIT);
};

export interface NotificationState {
	/** Newest first. */
	items: AppNotification[];
}

const initialState: NotificationState = {
	items: loadItems(),
};

const persist = (state: NotificationState) => {
	notificationStore.set(ITEMS_KEY, state.items);
};

export const notificationSlice = createSlice({
	name: 'notification',
	initialState,
	reducers: {
		notificationAdded: (state, action: PayloadAction<AppNotification>) => {
			state.items.unshift(action.payload);
			state.items.splice(NOTIFICATION_LIMIT);
			persist(state);
		},
		notificationRead: (state, action: PayloadAction<string>) => {
			const item = state.items.find((it) => it.id === action.payload);
			if (item) item.read = true;
			persist(state);
		},
		notificationsAllRead: (state) => {
			for (const item of state.items) item.read = true;
			persist(state);
		},
		notificationDismissed: (state, action: PayloadAction<string>) => {
			state.items = state.items.filter((it) => it.id !== action.payload);
			persist(state);
		},
		notificationsCleared: (state) => {
			state.items = [];
			persist(state);
		},
	},
	selectors: {
		selectNotifications: (state) => state.items,
		selectUnreadNotificationCount: (state) => state.items.filter((it) => !it.read).length,
	},
});

export const {
	notificationAdded,
	notificationRead,
	notificationsAllRead,
	notificationDismissed,
	notificationsCleared,
} = notificationSlice.actions;
export const { selectNotifications, selectUnreadNotificationCount } = notificationSlice.selectors;
