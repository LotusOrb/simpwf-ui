import { createContext, useContext } from 'react';

/** The droppable under the pointer while dragging (a field id or a container id), for drop highlights. */
export const FormBuilderDndContext = createContext<string | null>(null);

export const useFormBuilderDropTarget = () => useContext(FormBuilderDndContext);

/** Palette entries are draggables with this id prefix; their data carries the widget. */
export const PALETTE_DRAG_PREFIX = 'palette:';
