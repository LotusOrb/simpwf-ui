import { combineSlices, configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { coreApi } from '@core/api';
import { authSlice } from '@core/auth/store';

export const coreReducer = combineSlices(authSlice, coreApi);

export const createCoreStore = () => {
	const store = configureStore({
		reducer: coreReducer,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(coreApi.middleware),
	});

	setupListeners(store.dispatch);

	return store;
};

export const coreStore = createCoreStore();
