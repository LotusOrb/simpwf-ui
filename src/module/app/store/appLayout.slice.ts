import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppLayoutPanelSide = 'left' | 'right';

export interface AppLayoutState {
	panels: Record<AppLayoutPanelSide, boolean>;
	slots: Record<AppLayoutPanelSide, boolean>;
}

const initialState: AppLayoutState = {
	panels: { left: false, right: false },
	slots: { left: false, right: false },
};

export const appLayoutSlice = createSlice({
	name: 'appLayout',
	initialState,
	reducers: {
		setPanelOpened: (state, action: PayloadAction<{ side: AppLayoutPanelSide; opened: boolean }>) => {
			state.panels[action.payload.side] = action.payload.opened;
		},
		setSlotMounted: (state, action: PayloadAction<{ side: AppLayoutPanelSide; mounted: boolean }>) => {
			state.slots[action.payload.side] = action.payload.mounted;
		},
		togglePanel: (state, action: PayloadAction<AppLayoutPanelSide>) => {
			state.panels[action.payload] = !state.panels[action.payload];
		},
	},
	selectors: {
		selectPanelOpened: (state, side: AppLayoutPanelSide) => state.panels[side],
		selectSlotMounted: (state, side: AppLayoutPanelSide) => state.slots[side],
	},
});

export const { setPanelOpened, setSlotMounted, togglePanel } = appLayoutSlice.actions;
export const { selectPanelOpened, selectSlotMounted } = appLayoutSlice.selectors;
