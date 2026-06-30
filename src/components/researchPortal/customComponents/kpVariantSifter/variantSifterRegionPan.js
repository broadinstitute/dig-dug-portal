import { clampRegionZoom, clampRegionViewArea } from "./variantSifterRegionZoom.js";

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
 * Genomic window on screen. Zoom magnifies within the active (shifted) search region.
 */
export function computeViewRegion(
    searchRegion,
    regionShiftBp = 0,
    regionZoom = 0,
    regionViewArea = 0
) {
    const activeRegion = computeActiveRegion(searchRegion, regionShiftBp);
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
