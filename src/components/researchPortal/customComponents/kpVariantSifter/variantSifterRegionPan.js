import { clampRegionZoom, clampRegionViewArea } from "./variantSifterRegionZoom.js";
import { applyRegionExpand } from "./variantSifterSearchUtils.js";

/**
 * Visible window width (bp) for a genomic region at the given zoom level.
 * Matches ResearchRegionPlot / GEM: zoom Z shows ~(100 − Z/2)% of locus width.
 */
export function computeRegionWidth(region) {
    if (!region) {
        return 0;
    }
    const start = Number(region.start);
    const end = Number(region.end);
    const distance = end - start;
    return Number.isFinite(distance) && distance > 0 ? distance : 0;
}

export function computeVisibleWindowWidth(region, regionZoom = 0) {
    const distance = computeRegionWidth(region);
    if (!distance) {
        return 0;
    }

    const zoom = clampRegionZoom(regionZoom);
    if (zoom <= 0) {
        return distance;
    }

    const zoomNum = Math.round(distance * (zoom / 200));
    return Math.max(1, distance - zoomNum * 2);
}

/** Default total expansion (bp) when search did not specify a region expand option. */
export const VKS_DEFAULT_ZOOM_OUT_EXPAND_BP = 150000;

/**
 * Maximum width (bp) of the active region used to load association rows.
 * Wider windows can exhaust browser memory in dense loci.
 */
export const VKS_MAX_ACTIVE_REGION_WIDTH_BP = 500000;

/** Region zoom out: 0 = search locus width; 100 = fully expanded to limit. */
export const VKS_REGION_ZOOM_OUT_MIN = 0;
export const VKS_REGION_ZOOM_OUT_MAX = 100;

export function formatMaxActiveRegionWidthBp(
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    if (maxWidthBp >= 1_000_000) {
        return `${maxWidthBp / 1_000_000} Mb`;
    }
    return `${Math.round(maxWidthBp / 1000)} kb`;
}

export function activeRegionDataLimitMessage(
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    return `That region is too large for association loading (maximum ${formatMaxActiveRegionWidthBp(
        maxWidthBp
    )}). Narrow the locus or choose a smaller region expand.`;
}

export function regionExceedsActiveDataLimit(
    region,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    return computeRegionWidth(region) > maxWidthBp;
}

/** Shrink a region to max width while preserving its center. */
export function clampRegionToMaxWidth(
    region,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    if (!region) {
        return null;
    }

    const width = computeRegionWidth(region);
    if (!width || width <= maxWidthBp) {
        return cloneGenomicRegion(region);
    }

    const center = Math.round((Number(region.start) + Number(region.end)) / 2);
    const half = Math.floor(maxWidthBp / 2);
    return {
        chr: region.chr,
        start: Math.max(0, center - half),
        end: center + half,
    };
}

function expandedActiveRegionWidth(
    searchRegion,
    regionShiftBp,
    regionZoomOut,
    limitRegion
) {
    return computeRegionWidth(
        computeExpandedActiveRegion(
            searchRegion,
            regionShiftBp,
            regionZoomOut,
            limitRegion
        )
    );
}

/** Largest zoom-out level that keeps the expanded active region within the data width cap. */
export function computeMaxRegionZoomOutForDataWidth(
    searchRegion,
    regionShiftBp = 0,
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    const shift = clampRegionShiftBp(searchRegion, regionShiftBp, limitRegion);
    let best = VKS_REGION_ZOOM_OUT_MIN;

    for (let zoomOut = VKS_REGION_ZOOM_OUT_MIN; zoomOut <= VKS_REGION_ZOOM_OUT_MAX; zoomOut++) {
        if (
            expandedActiveRegionWidth(searchRegion, shift, zoomOut, limitRegion) <=
            maxWidthBp
        ) {
            best = zoomOut;
        } else {
            break;
        }
    }

    return best;
}

export function clampRegionZoomOutForDataWidth(
    searchRegion,
    regionShiftBp,
    regionZoomOut,
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    const zoomOut = clampRegionZoomOut(regionZoomOut);
    const maxAllowed = computeMaxRegionZoomOutForDataWidth(
        searchRegion,
        regionShiftBp,
        limitRegion,
        maxWidthBp
    );
    return Math.min(zoomOut, maxAllowed);
}

/**
 * Clamp pan shift so the expanded active region stays within the association data width cap.
 */
export function clampRegionShiftBpForDataWidth(
    searchRegion,
    regionShiftBp = 0,
    regionZoomOut = 0,
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    let shift = clampRegionShiftBp(searchRegion, regionShiftBp, limitRegion);
    const zoomOut = clampRegionZoomOut(regionZoomOut);

    if (
        expandedActiveRegionWidth(searchRegion, shift, zoomOut, limitRegion) <= maxWidthBp
    ) {
        return shift;
    }

    const requested = shift;
    if (!requested) {
        return 0;
    }

    const step = Math.max(1, Math.floor(computeRegionWidth(searchRegion) / 200) || 1);
    const direction = requested > 0 ? -1 : 1;

    for (let test = requested; ; test += direction * step) {
        if ((direction > 0 && test < 0) || (direction < 0 && test > 0)) {
            return 0;
        }
        if (
            expandedActiveRegionWidth(searchRegion, test, zoomOut, limitRegion) <= maxWidthBp
        ) {
            return Math.round(test);
        }
        if (test === 0) {
            return 0;
        }
    }
}

/** Apply pan and zoom-out limits for both the visual boundary and association data width. */
export function clampRegionViewportForDataLimit(
    searchRegion,
    { regionShiftBp = 0, regionZoomOut = 0 } = {},
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    let shift = clampRegionShiftBp(searchRegion, regionShiftBp, limitRegion);
    let zoomOut = clampRegionZoomOut(regionZoomOut);

    zoomOut = clampRegionZoomOutForDataWidth(
        searchRegion,
        shift,
        zoomOut,
        limitRegion,
        maxWidthBp
    );
    shift = clampRegionShiftBpForDataWidth(
        searchRegion,
        shift,
        zoomOut,
        limitRegion,
        maxWidthBp
    );
    zoomOut = clampRegionZoomOutForDataWidth(
        searchRegion,
        shift,
        zoomOut,
        limitRegion,
        maxWidthBp
    );

    return {
        regionShiftBp: shift,
        regionZoomOut: zoomOut,
    };
}

/**
 * Active region used for association / gene / overlay data loading.
 * Falls back to center-clamping if viewport state ever exceeds the data cap.
 */
export function resolveActiveDataRegion(
    searchRegion,
    regionShiftBp = 0,
    regionZoomOut = 0,
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    const expanded = computeExpandedActiveRegion(
        searchRegion,
        regionShiftBp,
        regionZoomOut,
        limitRegion
    );
    if (!expanded) {
        return null;
    }

    return clampRegionToMaxWidth(expanded, maxWidthBp);
}

/** True when zoom-out cannot expand further (visual limit or association data width cap). */
export function isRegionZoomOutBlocked(
    searchRegion,
    regionShiftBp = 0,
    regionZoomOut = 0,
    limitRegion = null,
    maxWidthBp = VKS_MAX_ACTIVE_REGION_WIDTH_BP
) {
    const shift = clampRegionShiftBp(searchRegion, regionShiftBp, limitRegion);
    const zoomOut = clampRegionZoomOut(regionZoomOut);

    if (isRegionZoomOutAtLimit(searchRegion, shift, limitRegion)) {
        return true;
    }

    const maxAllowed = computeMaxRegionZoomOutForDataWidth(
        searchRegion,
        shift,
        limitRegion,
        maxWidthBp
    );
    return zoomOut >= maxAllowed;
}

export function resolveZoomOutLimitRegion(searchRegion, regionExpandBp = null) {
    if (!searchRegion) {
        return null;
    }

    const expandBp =
        regionExpandBp != null ? regionExpandBp : VKS_DEFAULT_ZOOM_OUT_EXPAND_BP;
    return applyRegionExpand(searchRegion, expandBp);
}

export function clampRegionZoomOut(value) {
    const zoomOut = Number(value);
    if (!Number.isFinite(zoomOut)) {
        return VKS_REGION_ZOOM_OUT_MIN;
    }
    return Math.max(
        VKS_REGION_ZOOM_OUT_MIN,
        Math.min(VKS_REGION_ZOOM_OUT_MAX, Math.round(zoomOut))
    );
}

/**
 * Expand the shifted search locus toward the zoom-out limit.
 * Speed scales with remaining headroom on each side.
 */
export function computeExpandedActiveRegion(
    searchRegion,
    regionShiftBp = 0,
    regionZoomOut = 0,
    limitRegion = null
) {
    const base = computeActiveRegion(searchRegion, regionShiftBp);
    if (!base) {
        return null;
    }

    const zoomOut = clampRegionZoomOut(regionZoomOut);
    if (zoomOut <= 0 || !limitRegion) {
        return base;
    }

    const fraction = zoomOut / VKS_REGION_ZOOM_OUT_MAX;
    const expandLeftAvailable = Math.max(0, base.start - limitRegion.start);
    const expandRightAvailable = Math.max(0, limitRegion.end - base.end);
    const extraLeft = Math.round(expandLeftAvailable * fraction);
    const extraRight = Math.round(expandRightAvailable * fraction);

    return {
        chr: base.chr,
        start: base.start - extraLeft,
        end: base.end + extraRight,
    };
}

/** True when the shifted locus already spans the zoom-out limit (no room to expand). */
export function isRegionZoomOutAtLimit(searchRegion, regionShiftBp = 0, limitRegion = null) {
    const base = computeActiveRegion(searchRegion, regionShiftBp);
    if (!base || !limitRegion) {
        return true;
    }

    return base.start <= limitRegion.start && base.end >= limitRegion.end;
}

/**
 * Keep the shifted search locus inside the zoom-out limit so panning cannot escape it.
 */
export function clampRegionShiftBp(searchRegion, regionShiftBp = 0, limitRegion = null) {
    if (!searchRegion || !limitRegion) {
        return Number(regionShiftBp) || 0;
    }

    const shift = Number(regionShiftBp) || 0;
    const minShift = limitRegion.start - Number(searchRegion.start);
    const maxShift = limitRegion.end - Number(searchRegion.end);
    return Math.round(Math.max(minShift, Math.min(maxShift, shift)));
}

/**
 * Move the searched locus left/right while keeping the same width.
 */
export function computeActiveRegion(searchRegion, regionShiftBp = 0) {
    if (!searchRegion) {
        return null;
    }

    const shift = Number(regionShiftBp) || 0;
    const start = Number(searchRegion.start);
    const end = Number(searchRegion.end);

    if (!Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }

    return {
        chr: searchRegion.chr,
        start: Math.round(start + shift),
        end: Math.round(end + shift),
    };
}

/**
 * Genomic window on screen. Zoom magnifies within the active (shifted, optionally expanded) locus.
 */
export function computeViewRegion(
    searchRegion,
    regionShiftBp = 0,
    regionZoom = 0,
    regionViewArea = 0,
    regionZoomOut = 0,
    limitRegion = null
) {
    const activeRegion = limitRegion
        ? computeExpandedActiveRegion(
              searchRegion,
              regionShiftBp,
              regionZoomOut,
              limitRegion
          )
        : computeActiveRegion(searchRegion, regionShiftBp);
    if (!activeRegion) {
        return null;
    }

    const zoom = clampRegionZoom(regionZoom);
    if (zoom <= 0) {
        return activeRegion;
    }

    const start = Number(activeRegion.start);
    const end = Number(activeRegion.end);
    const distance = end - start;
    const zoomNum = Math.round(distance * (zoom / 200));
    const viewPointShift = Math.round(
        zoomNum * (clampRegionViewArea(regionViewArea) / 100)
    );

    return {
        chr: activeRegion.chr,
        start: Math.round(start + zoomNum + viewPointShift),
        end: Math.round(end - zoomNum + viewPointShift),
    };
}

export function cloneGenomicRegion(region) {
    if (!region) {
        return null;
    }
    return {
        chr: region.chr,
        start: Number(region.start),
        end: Number(region.end),
    };
}

/** Union of two regions on the same chromosome (for incremental data loading). */
export function unionGenomicRegions(left, right) {
    if (!left) {
        return cloneGenomicRegion(right);
    }
    if (!right) {
        return cloneGenomicRegion(left);
    }
    if (left.chr !== right.chr) {
        return cloneGenomicRegion(left);
    }
    return {
        chr: left.chr,
        start: Math.min(Number(left.start), Number(right.start)),
        end: Math.max(Number(left.end), Number(right.end)),
    };
}

export function genomicRegionsEqual(left, right) {
    if (!left || !right) {
        return false;
    }
    return (
        left.chr === right.chr &&
        Number(left.start) === Number(right.start) &&
        Number(left.end) === Number(right.end)
    );
}

/**
 * Strips that must be fetched when the active search region moves.
 */
export function computeFetchGaps(loadedRegion, activeRegion) {
    if (!loadedRegion || !activeRegion) {
        return [];
    }

    const gaps = [];

    if (activeRegion.start < loadedRegion.start) {
        gaps.push({
            start: activeRegion.start,
            end: loadedRegion.start - 1,
        });
    }

    if (activeRegion.end > loadedRegion.end) {
        gaps.push({
            start: loadedRegion.end + 1,
            end: activeRegion.end,
        });
    }

    return gaps.filter((gap) => gap.end >= gap.start);
}

/**
 * Drag right reveals higher coordinates → shift the search region right.
 */
export function panRegionShiftFromDrag(
    currentShiftBp,
    deltaXPixels,
    plotWidthPx,
    visibleWidthBp
) {
    if (!plotWidthPx || !visibleWidthBp) {
        return currentShiftBp;
    }

    const bpPerPixel = visibleWidthBp / plotWidthPx;
    const deltaBp = deltaXPixels * bpPerPixel;
    return currentShiftBp - deltaBp;
}

export function filterAssociationRowsInRegion(rows, region) {
    if (!Array.isArray(rows) || !region) {
        return rows || [];
    }

    return rows.filter((row) => {
        const position = Number(row.Position);
        return (
            Number.isFinite(position) &&
            position >= region.start &&
            position <= region.end
        );
    });
}

export function mergeAssociationRowsByVariantId(existingRows, incomingRows) {
    const byVariantId = new Map();

    (existingRows || []).forEach((row) => {
        const id = row?.["Variant ID"] || row?.varId;
        if (id) {
            byVariantId.set(id, row);
        }
    });

    (incomingRows || []).forEach((row) => {
        const id = row?.["Variant ID"] || row?.varId;
        if (id) {
            byVariantId.set(id, row);
        }
    });

    return Array.from(byVariantId.values()).sort((left, right) => {
        const pLeft = left?.["P-Value"] ?? 1;
        const pRight = right?.["P-Value"] ?? 1;
        return pLeft - pRight;
    });
}

export function filterGenesInRegion(genes, region) {
    if (!Array.isArray(genes) || !region) {
        return genes || [];
    }

    return genes.filter(
        (gene) => gene.start <= region.end && gene.end >= region.start
    );
}

export function mergeGenesByName(existingGenes, incomingGenes) {
    const byName = new Map();

    (existingGenes || []).forEach((gene) => {
        const name = gene?.gene_name;
        if (name) {
            byName.set(name, gene);
        }
    });

    (incomingGenes || []).forEach((gene) => {
        const name = gene?.gene_name;
        if (name) {
            byName.set(name, gene);
        }
    });

    return Array.from(byName.values()).sort(
        (left, right) => Number(left.start) - Number(right.start)
    );
}

export function mergeRecombData(left, right) {
    if (!left?.position?.length) {
        return right || null;
    }
    if (!right?.position?.length) {
        return left || null;
    }

    const rateByPosition = new Map();
    left.position.forEach((position, index) => {
        rateByPosition.set(position, left.recomb_rate[index]);
    });
    right.position.forEach((position, index) => {
        rateByPosition.set(position, right.recomb_rate[index]);
    });

    const positions = Array.from(rateByPosition.keys()).sort((a, b) => a - b);
    return {
        position: positions,
        recomb_rate: positions.map((position) => rateByPosition.get(position)),
    };
}

export function trimRecombData(recombData, region) {
    if (!recombData?.position?.length || !region) {
        return recombData || null;
    }

    const positions = [];
    const rates = [];

    recombData.position.forEach((position, index) => {
        if (position >= region.start && position <= region.end) {
            positions.push(position);
            rates.push(recombData.recomb_rate[index]);
        }
    });

    if (!positions.length) {
        return null;
    }

    return { position: positions, recomb_rate: rates };
}

/** Legacy session import: viewOffsetBp ≈ regionShiftBp at zoom 0. */
export function regionShiftBpFromLegacyViewArea(
    searchRegion,
    regionZoom,
    regionViewArea
) {
    if (!searchRegion || clampRegionZoom(regionZoom) <= 0) {
        return Number(regionViewArea) || 0;
    }

    const start = Number(searchRegion.start);
    const end = Number(searchRegion.end);
    const distance = end - start;
    const zoomNum = Math.round(distance * (clampRegionZoom(regionZoom) / 200));
    const viewPointShift = Math.round(zoomNum * (Number(regionViewArea) / 100));
    const visibleWidth = Math.max(1, distance - zoomNum * 2);
    const searchCenter = (start + end) / 2;
    const viewStart = start + zoomNum + viewPointShift;
    const viewCenter = viewStart + visibleWidth / 2;

    return Math.round(viewCenter - searchCenter);
}

/** @deprecated Use regionShiftBpFromLegacyViewArea */
export function viewOffsetBpFromLegacyViewArea(
    searchRegion,
    regionZoom,
    regionViewArea
) {
    return regionShiftBpFromLegacyViewArea(searchRegion, regionZoom, regionViewArea);
}
