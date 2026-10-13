import { createContext, useContext } from 'react';

export const ContextTypes = createContext<string | undefined>(undefined);

/** The `context` declaration loaded from a debug run, for the script editors below it. */
export const useContextTypes = () => useContext(ContextTypes);
