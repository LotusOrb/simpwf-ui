import { useDispatch, useSelector, useStore } from 'react-redux';

import type { CoreDispatch, CoreState, CoreStore } from './core.state';

/** Pre-typed `useDispatch`. Use this instead of the bare react-redux hook. */
export const useCoreDispatch = useDispatch.withTypes<CoreDispatch>();

/** Pre-typed `useSelector`. Use this instead of the bare react-redux hook. */
export const useCoreSelector = useSelector.withTypes<CoreState>();

/** Pre-typed `useStore`, for the rare read outside of render. */
export const useCoreStore = useStore.withTypes<CoreStore>();
