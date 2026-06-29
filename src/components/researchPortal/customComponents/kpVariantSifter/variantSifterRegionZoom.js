/** Region zoom: 0 = full searched locus; 90 = 10% of locus width visible (GEM parity). */
export const VKS_REGION_ZOOM_MIN = 0;
export const VKS_REGION_ZOOM_MAX = 90;
export const VKS_REGION_ZOOM_STEP = 10;

export const VKS_REGION_VIEW_AREA_MIN = -100;
export const VKS_REGION_VIEW_AREA_MAX = 100;

/**
 * Compute the visible genomic window from search region + zoom/pan (ResearchRegionPlot formula).
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
 * Shift pan position from horizontal drag (pixels). Drag right increases view area.
 */
export function panRegionViewAreaFromDrag(currentViewArea, deltaXPixels, plotWidthPx) {
    if (!plotWidthPx || !Number.isFinite(deltaXPixels)) {
        return clampRegionViewArea(currentViewArea);
    }
    const delta = (deltaXPixels / plotWidthPx) * 200;
    return clampRegionViewArea(currentViewArea + delta);
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
