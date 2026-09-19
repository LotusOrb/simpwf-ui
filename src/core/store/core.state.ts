import type { coreReducer, coreStore } from './core.store';

export type CoreStore = typeof coreStore;

/** Derived from the reducer rather than the store so injected slices show up. */
export type CoreState = ReturnType<typeof coreReducer>;

export type CoreDispatch = CoreStore['dispatch'];

/** Shape of a thunk written against this store. */
export interface CoreThunkConfig {
	state: CoreState;
	dispatch: CoreDispatch;
}
