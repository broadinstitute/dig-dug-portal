import { normalizePlotMargin } from "./variantSifterPlotShared.js";

/** Region zoom in: 0 = full active locus; 99 = ~1% of active width visible. */
export const VKS_REGION_ZOOM_MIN = 0;
export const VKS_REGION_ZOOM_MAX = 99;
export const VKS_REGION_ZOOM_STEP = 1;

/** Center-neutral slider: negative = zoom out, positive = zoom in. */
export const VKS_REGION_ZOOM_SLIDER_MIN = -100;
export const VKS_REGION_ZOOM_SLIDER_MAX = 100;

export const VKS_REGION_VIEW_AREA_MIN = -100;
export const VKS_REGION_VIEW_AREA_MAX = 100;

function clampSliderZoomOut(value) {
    const zoomOut = Number(value);
    if (!Number.isFinite(zoomOut)) {
        return 0;
    }
    return Math.max(0, Math.min(100, Math.round(zoomOut)));
}

export function zoomFromSliderValue(sliderValue) {
    const value = Math.round(Number(sliderValue) || 0);
    if (value < 0) {
        const magnitude = Math.min(100, Math.abs(value));
        return {
            regionZoom: VKS_REGION_ZOOM_MIN,
            regionZoomOut: clampSliderZoomOut(magnitude),
        };
    }

    if (value > 0) {
        return {
            regionZoom: clampRegionZoom(Math.round((value / 100) * VKS_REGION_ZOOM_MAX)),
            regionZoomOut: 0,
        };
    }

    return {
        regionZoom: VKS_REGION_ZOOM_MIN,
        regionZoomOut: 0,
    };
}

export function sliderValueFromZoom(regionZoom = 0, regionZoomOut = 0) {
    const zoomOut = clampSliderZoomOut(regionZoomOut);
    if (zoomOut > 0) {
        return -zoomOut;
    }

    const zoomIn = clampRegionZoom(regionZoom);
    if (zoomIn > 0) {
        return Math.round((zoomIn / VKS_REGION_ZOOM_MAX) * 100);
    }

    return 0;
}

/**
 * Legacy visible-region helper when shift/zoom-out props are unavailable.
 */
export function computeVisibleRegion(searchRegion, regionZoom = 0, regionViewArea = 0) {
    if (!searchRegion) {
        return null;
    }

    const chr = searchRegion.chr;
    const start = Number(searchRegion.start);
    const end = Number(searchRegion.end);
    const distance = end - start;

    if (!Number.isFinite(start) || !Number.isFinite(end) || distance <= 0) {
        return { chr, start, end };
    }

    const zoom = clampRegionZoom(regionZoom);
    if (zoom <= 0) {
        return { chr, start, end };
    }

    const zoomNum = Math.round(distance * (zoom / 200));
    const viewPointShift = Math.round(
        zoomNum * (clampRegionViewArea(regionViewArea) / 100)
    );

    return {
        chr,
        start: start + zoomNum + viewPointShift,
        end: end - zoomNum + viewPointShift,
    };
}

export function clampRegionZoom(value) {
    const zoom = Number(value);
    if (!Number.isFinite(zoom)) {
        return VKS_REGION_ZOOM_MIN;
    }
    return Math.max(VKS_REGION_ZOOM_MIN, Math.min(VKS_REGION_ZOOM_MAX, Math.round(zoom)));
}

export function clampRegionViewArea(value) {
    const viewArea = Number(value);
    if (!Number.isFinite(viewArea)) {
        return 0;
    }
    return Math.max(
        VKS_REGION_VIEW_AREA_MIN,
        Math.min(VKS_REGION_VIEW_AREA_MAX, Math.round(viewArea))
    );
}

/**
 * Shift pan position from horizontal drag (pixels).
 * Drag right moves plot content right (reveals lower coordinates on the left).
 */
export function panRegionViewAreaFromDrag(currentViewArea, deltaXPixels, plotWidthPx) {
    if (!plotWidthPx || !Number.isFinite(deltaXPixels)) {
        return clampRegionViewArea(currentViewArea);
    }
    const delta = (deltaXPixels / plotWidthPx) * 200;
    return clampRegionViewArea(currentViewArea - delta);
}

export function formatVisibleRegionLabel(searchRegion, visibleRegion) {
    if (!searchRegion || !visibleRegion) {
        return "";
    }
    const searchWidth = searchRegion.end - searchRegion.start;
    const visibleWidth = visibleRegion.end - visibleRegion.start;
    if (searchWidth <= 0 || visibleWidth <= 0) {
        return "";
    }
    const pct = Math.round((visibleWidth / searchWidth) * 100);
    return `${pct}% of locus (${visibleRegion.start.toLocaleString()}–${visibleRegion.end.toLocaleString()})`;
}

/** Map zoom-center marker position (0–1 across plot width) to regionViewArea. */
export function regionViewAreaFromPlotFraction(fraction) {
    return clampRegionViewArea(Math.round((Number(fraction) - 0.5) * 200));
}

/** Map regionViewArea (-100…100) to marker position (0–1 across plot width). */
export function plotFractionFromRegionViewArea(regionViewArea) {
    return 0.5 + clampRegionViewArea(regionViewArea) / 200;
}

/**
 * Layout for the draggable zoom-center triangle in CSS pixels.
 * Canvas uses 2× internal pixels; containerWidthPx is the display width.
 */
export function computeZoomCenterMarkerLayout(containerWidthPx, plotMargin, regionViewArea) {
    const margin = normalizePlotMargin(plotMargin);
    const left = margin.left / 2;
    const right = margin.right / 2;
    const plotWidth = Math.max(0, Number(containerWidthPx) - left - right);
    const fraction = plotFractionFromRegionViewArea(regionViewArea);
    return {
        marginLeftPx: left,
        plotWidthPx: plotWidth,
        markerXPx: left + plotWidth * fraction,
    };
}

export function regionViewAreaFromClientX(clientX, trackRect, plotMargin) {
    const layout = computeZoomCenterMarkerLayout(
        trackRect.width,
        plotMargin,
        0
    );
    const relativeX = clientX - trackRect.left;
    const fraction =
        layout.plotWidthPx > 0
            ? (relativeX - layout.marginLeftPx) / layout.plotWidthPx
            : 0.5;
    return regionViewAreaFromPlotFraction(fraction);
}

/** Display height of the zoom-center triangle (CSS px). */
export const VKS_ZOOM_CENTER_MARKER_HEIGHT_PX = 11;

/** Gap between triangle tip and the recomb axis “100” tick label (CSS px). */
export const VKS_ZOOM_CENTER_MARKER_GAP_ABOVE_RECOMB_100_PX = 10;

/**
 * Vertical position (CSS px from canvas top) for the zoom-center triangle.
 * Aligns the tip 10px above the right-axis “100” recomb tick (renderPlotAxis).
 */
export function computeZoomCenterMarkerTopPx(plotMargin) {
    const margin = normalizePlotMargin(plotMargin);
    const recomb100TickInternalY = margin.top + 5;
    const recomb100TickDisplayY = recomb100TickInternalY / 2;
    return (
        recomb100TickDisplayY -
        VKS_ZOOM_CENTER_MARKER_GAP_ABOVE_RECOMB_100_PX -
        VKS_ZOOM_CENTER_MARKER_HEIGHT_PX
    );
}
