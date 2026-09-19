import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';

import { coreReducer } from '@config/reducer.config';

import { coreApi } from '@core/api';

export const createCoreStore = () => {
	const store = configureStore({
		reducer: coreReducer,
		middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(coreApi.middleware),
	});

	setupListeners(store.dispatch);

	return store;
};

export const coreStore = createCoreStore();
