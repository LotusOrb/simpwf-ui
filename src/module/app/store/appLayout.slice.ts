import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

export type AppLayoutPanelSide = 'top' | 'right' | 'bottom' | 'left';

export type AppLayoutPanelRecord<T> = Record<AppLayoutPanelSide, T>;

export interface AppLayoutState {
	panels: AppLayoutPanelRecord<boolean>;
	slots: AppLayoutPanelRecord<boolean>;
	/** A collapsed panel shows only its title strip (used by the bottom panel). */
	collapsed: AppLayoutPanelRecord<boolean>;
	/** Distance in px from the surface edge to the inner edge of each floating panel; 0 when empty. */
	insets: AppLayoutPanelRecord<number>;
}

const initialState: AppLayoutState = {
	// Top and bottom only render when a page mounts a panel for them, so they default to shown.
	panels: { top: true, right: false, bottom: true, left: false },
	slots: { top: false, right: false, bottom: false, left: false },
	collapsed: { top: false, right: false, bottom: false, left: false },
	insets: { top: 0, right: 0, bottom: 0, left: 0 },
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
		setPanelCollapsed: (state, action: PayloadAction<{ side: AppLayoutPanelSide; collapsed: boolean }>) => {
			state.collapsed[action.payload.side] = action.payload.collapsed;
		},
		togglePanelCollapsed: (state, action: PayloadAction<AppLayoutPanelSide>) => {
			state.collapsed[action.payload] = !state.collapsed[action.payload];
		},
		setPanelInset: (state, action: PayloadAction<{ side: AppLayoutPanelSide; inset: number }>) => {
			state.insets[action.payload.side] = action.payload.inset;
		},
	},
	selectors: {
		selectPanelOpened: (state, side: AppLayoutPanelSide) => state.panels[side],
		selectPanelsOpened: (state) => state.panels,
		selectSlotMounted: (state, side: AppLayoutPanelSide) => state.slots[side],
		selectPanelCollapsed: (state, side: AppLayoutPanelSide) => state.collapsed[side],
		selectPanelsCollapsed: (state) => state.collapsed,
		selectPanelInsets: (state) => state.insets,
	},
});

export const { setPanelOpened, setSlotMounted, togglePanel, setPanelCollapsed, togglePanelCollapsed, setPanelInset } =
	appLayoutSlice.actions;
export const {
	selectPanelOpened,
	selectPanelsOpened,
	selectSlotMounted,
	selectPanelCollapsed,
	selectPanelsCollapsed,
	selectPanelInsets,
} = appLayoutSlice.selectors;
