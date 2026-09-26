import type { AppLayoutPanelSide } from '@module/app/store';

export const MAIN_LAYOUT_PANEL_SIDES: AppLayoutPanelSide[] = ['top', 'right', 'bottom', 'left'];

export const MAIN_LAYOUT_SLOT_ID: Record<AppLayoutPanelSide, string> = {
	top: 'main-layout-slot-top',
	right: 'main-layout-slot-right',
	bottom: 'main-layout-slot-bottom',
	left: 'main-layout-slot-left',
};

/** Space in px between the floating panels, and between them and the surface edge. */
export const MAIN_LAYOUT_PANEL_GAP = 10;
