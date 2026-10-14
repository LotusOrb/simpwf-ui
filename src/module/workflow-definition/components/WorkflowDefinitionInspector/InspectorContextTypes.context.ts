import { createContext, useContext, useMemo } from 'react';

import { contextPathsFromTypes } from '@module/workflow-definition/data';

export const ContextTypes = createContext<string | undefined>(undefined);

/** The `context` declaration from the editor's context source, for the script editors below it. */
export const useContextTypes = () => useContext(ContextTypes);

/** The loaded `context` declaration flattened to paths like `order.items[0].id`, for path and template inputs. */
export const useContextPaths = () => {
	const types = useContextTypes();
	return useMemo(() => contextPathsFromTypes(types), [types]);
};
