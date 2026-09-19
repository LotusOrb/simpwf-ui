import { useDispatch, useSelector, useStore } from 'react-redux';

import type { CoreDispatch, CoreState, CoreStore } from './core.state';

export const useCoreDispatch = useDispatch.withTypes<CoreDispatch>();

export const useCoreSelector = useSelector.withTypes<CoreState>();

export const useCoreStore = useStore.withTypes<CoreStore>();
