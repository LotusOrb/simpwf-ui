import type { coreReducer } from '@config/reducer.config';

import type { coreStore } from './core.store';

export type CoreStore = typeof coreStore;

export type CoreState = ReturnType<typeof coreReducer>;

export type CoreDispatch = CoreStore['dispatch'];

export interface CoreThunkConfig {
	state: CoreState;
	dispatch: CoreDispatch;
}
