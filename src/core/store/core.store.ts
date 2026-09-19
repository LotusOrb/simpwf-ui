import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { coreApi } from '@core/api';
import { authSlice } from '@core/auth/store';

/**
 * `combineSlices` lets a module attach its own slice later via
 * `coreReducer.inject(someSlice)` without this file having to know about it.
 */
export const coreReducer = combineSlices(authSlice, coreApi);

export const createCoreStore = () => {
	const store = configureStore({
		reducer: coreReducer,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(coreApi.middleware),
	});

	// Powers `refetchOnFocus` / `refetchOnReconnect` set on `coreApi`.
	setupListeners(store.dispatch);

	return store;
};

export const coreStore = createCoreStore();
