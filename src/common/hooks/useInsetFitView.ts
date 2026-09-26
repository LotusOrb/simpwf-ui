import { useEffect, useEffectEvent, useRef } from 'react';

import { useReactFlow, useStore, useStoreApi, type OnMoveEnd, type OnMoveStart, type Viewport } from '@xyflow/react';

export type FlowInsets = Record<'top' | 'right' | 'bottom' | 'left', number>;

/** An inset change smaller than this (px) doesn't move the view. */
const REFIT_THRESHOLD = 24;

interface InsetFitViewOptions {
	/** Space in px covered by overlays on each side of the flow. */
	insets: FlowInsets;
	/** Breathing room in px between the fitted content and the insets. */
	margin: number;
	maxZoom?: number;
	duration?: number;
	/** Changing this re-fits and forgets any user pan, e.g. a new graph or a new scope. */
	refitKey: unknown;
}

const sameViewport = (a: Viewport, b: Viewport) =>
	Math.abs(a.x - b.x) < 1 && Math.abs(a.y - b.y) < 1 && Math.abs(a.zoom - b.zoom) < 0.001;

/**
 * Fits a React Flow view inside the area left visible by floating overlays. Re-fits when the
 * overlays change size noticeably, but only until the user pans or zooms themselves.
 *
 * React Flow's own per-side `padding` is only a minimum: content that fits is still centred in the
 * whole pane, i.e. partly under the overlays. So the viewport is computed here instead.
 */
export const useInsetFitView = ({ insets, margin, maxZoom = 1, duration = 200, refitKey }: InsetFitViewOptions) => {
	const flow = useReactFlow();
	const flowStore = useStoreApi();
	// Fitting needs both sized nodes and a measured pane; either can arrive last. Nodes with an
	// explicit size may never report handle bounds, so `useNodesInitialized` can't be used here.
	const ready = useStore((state) => {
		if (state.width <= 0 || state.height <= 0 || state.nodeLookup.size === 0) return false;
		for (const node of state.nodeLookup.values()) {
			if (!(node.measured.width ?? node.width) || !(node.measured.height ?? node.height)) return false;
		}
		return true;
	});
	const userMoved = useRef(false);
	const moveStart = useRef<Viewport | null>(null);
	const fittedInsets = useRef(insets);
	const fittedOnce = useRef(false);

	const fit = () => {
		const nodes = flow.getNodes();
		const { width, height, minZoom } = flowStore.getState();
		const visibleWidth = width - insets.left - insets.right - margin * 2;
		const visibleHeight = height - insets.top - insets.bottom - margin * 2;
		fittedInsets.current = insets;
		if (nodes.length === 0 || visibleWidth <= 0 || visibleHeight <= 0) return;

		const bounds = flow.getNodesBounds(nodes);
		const zoom = Math.min(
			Math.max(Math.min(visibleWidth / bounds.width, visibleHeight / bounds.height), minZoom),
			maxZoom,
		);
		const centerX = insets.left + margin + visibleWidth / 2;
		const centerY = insets.top + margin + visibleHeight / 2;
		flow.setViewport(
			{
				x: centerX - (bounds.x + bounds.width / 2) * zoom,
				y: centerY - (bounds.y + bounds.height / 2) * zoom,
				zoom,
			},
			// The first fit replaces the default viewport, so there's nothing to animate from.
			fittedOnce.current ? { duration } : undefined,
		);
		fittedOnce.current = true;
	};
	const fitFromEffect = useEffectEvent(fit);

	useEffect(() => {
		userMoved.current = false;
	}, [refitKey]);

	useEffect(() => {
		if (!ready) return;
		const frame = requestAnimationFrame(() => fitFromEffect());
		return () => cancelAnimationFrame(frame);
	}, [refitKey, ready]);

	const { top, right, bottom, left } = insets;
	useEffect(() => {
		if (userMoved.current || !ready) return;
		const previous = fittedInsets.current;
		const delta = Math.max(
			Math.abs(previous.top - top),
			Math.abs(previous.right - right),
			Math.abs(previous.bottom - bottom),
			Math.abs(previous.left - left),
		);
		if (delta < REFIT_THRESHOLD) return;

		const frame = requestAnimationFrame(() => fitFromEffect());
		return () => cancelAnimationFrame(frame);
	}, [top, right, bottom, left, ready]);

	// Only user gestures carry an event; programmatic moves (fits, the zoom buttons) don't. A plain
	// click on the pane also starts a "move", so only a changed viewport counts.
	const onMoveStart: OnMoveStart = (event, viewport) => {
		moveStart.current = event ? viewport : null;
	};
	const onMoveEnd: OnMoveEnd = (event, viewport) => {
		if (event && moveStart.current && !sameViewport(moveStart.current, viewport)) userMoved.current = true;
		moveStart.current = null;
	};

	return {
		onMoveStart,
		onMoveEnd,
		/** Fits now, e.g. from a "fit view" button; the view follows the panels again afterwards. */
		fitView: () => {
			userMoved.current = false;
			fit();
		},
	};
};
