/**
 * 3-Tier Association Plot Downsampling Utility for GP2 Browser
 *
 * Tier 1 — Raw data (`rawRows`):
 *   Every association variant in the loaded locus, pre-sorted once by genomic Position.
 *
 * Tier 2 — Permanent 0% zoom data (`zoom0Rows`):
 *   Calculated once for the searching region (`region`):
 *   - Keeps all variants with p <= 0.05 (plus any reference / starred variants).
 *   - Counts every n = 40 variants with p > 0.05 from the starting region in
 *     genomic position order and keeps the two variants with lowest p and highest p.
 *   - Used when at 0% zoom AND while actively panning/dragging the viewing region.
 *
 * Tier 3 — Zoomed-in viewing region data (`zoomedViewRows`):
 *   Calculated from Tier 1 (`rawRows`) only after movement/zooming settles:
 *   - Rounds the zoom level to the nearest 10 (e.g. 13 -> 10, 16 -> 20).
 *   - Maps rounded zoom to bucket size n:
 *     0% -> 40, 10% -> 36, 20% -> 32, ..., 90% -> 4, 100% -> 1.
 *   - Keeps all variants with p <= 0.05 (plus pinned variants) and recounts
 *     variants with p > 0.05 inside the settled viewing region (`viewRegion`)
 *     by bucket size n (keeping lowest p and highest p per bucket).
 */

export const GP2_ASSOC_DOWNSAMPLE_P_THRESHOLD = 0.05;
export const GP2_ASSOC_DOWNSAMPLE_BASE_N = 40;
export const GP2_ASSOC_DOWNSAMPLE_STEP_PER_10_PCT = 4;

/**
 * Round regionZoom (0..99) to the nearest 10 (e.g. 13 -> 10, 16 -> 20).
 */
export function roundZoomLevelBy10(regionZoom = 0) {
    const zoom = Number(regionZoom);
    if (!Number.isFinite(zoom) || zoom <= 0) {
        return 0;
    }
    return Math.min(100, Math.max(0, Math.round(zoom / 10) * 10));
}

/**
 * Compute bucket size n for a given zoom level:
 * - zoom 0%   -> n = 40
 * - zoom 10%  -> n = 36
 * - zoom 20%  -> n = 32
 * ...
 * - zoom 90%  -> n = 4
 * - zoom 100% -> n = 1 (keep all)
 */
export function resolveDownsampleBucketSize(regionZoom = 0) {
    const roundedZoom = roundZoomLevelBy10(regionZoom);
    if (roundedZoom <= 0) {
        return GP2_ASSOC_DOWNSAMPLE_BASE_N;
    }
    const n =
        GP2_ASSOC_DOWNSAMPLE_BASE_N -
        (roundedZoom / 10) * GP2_ASSOC_DOWNSAMPLE_STEP_PER_10_PCT;
    return Math.max(1, n);
}

function getRowPValue(row) {
    const p = Number(row?.["P-Value"] ?? row?.pValue);
    if (Number.isFinite(p) && p >= 0) {
        return p;
    }
    const negLog10 = Number(row?.["-log10(P-Value)"]);
    if (Number.isFinite(negLog10)) {
        return Math.pow(10, -negLog10);
    }
    return null;
}

function getRowPosition(row) {
    const pos = Number(row?.Position ?? row?.position);
    return Number.isFinite(pos) ? pos : null;
}

function normalizePinnedSet(pinnedVariantIds) {
    if (pinnedVariantIds instanceof Set) {
        return pinnedVariantIds;
    }
    if (Array.isArray(pinnedVariantIds)) {
        return new Set(pinnedVariantIds.filter(Boolean));
    }
    return null;
}

/**
 * Tier 1 helper: sort raw plot rows once by genomic Position ascending.
 */
export function prepareRawPlotRows(plotRows) {
    if (!Array.isArray(plotRows) || !plotRows.length) {
        return null;
    }
    return [...plotRows].sort(
        (a, b) => (getRowPosition(a) ?? 0) - (getRowPosition(b) ?? 0)
    );
}

/**
 * From a pre-sorted array of rows, group every `n` rows and keep the row
 * with the lowest p-value and the row with the highest p-value.
 */
function sampleMinMaxEveryNFromSorted(sortedRows, n) {
    if (!Array.isArray(sortedRows) || !sortedRows.length) {
        return [];
    }
    if (n <= 2) {
        return sortedRows;
    }

    const sampled = [];
    for (let i = 0; i < sortedRows.length; i += n) {
        const end = Math.min(i + n, sortedRows.length);
        let minIdx = i;
        let maxIdx = i;
        let minP = getRowPValue(sortedRows[i]) ?? Infinity;
        let maxP = getRowPValue(sortedRows[i]) ?? -Infinity;

        for (let j = i + 1; j < end; j++) {
            const p = getRowPValue(sortedRows[j]);
            if (p == null) {
                continue;
            }
            if (p < minP) {
                minP = p;
                minIdx = j;
            }
            if (p > maxP) {
                maxP = p;
                maxIdx = j;
            }
        }

        if (minIdx === maxIdx) {
            sampled.push(sortedRows[minIdx]);
        } else if (minIdx < maxIdx) {
            sampled.push(sortedRows[minIdx], sortedRows[maxIdx]);
        } else {
            sampled.push(sortedRows[maxIdx], sortedRows[minIdx]);
        }
    }

    return sampled;
}

/**
 * Tier 2 — Permanent 0% zoom dataset for the searching region:
 * - Keeps all variants with p <= 0.005 (plus pinned variants).
 * - Counts every n = 20 variants with p > 0.005 from the starting region
 *   and keeps lowest-p and highest-p per bucket.
 */
export function buildZoom0SearchRegionPlotData(
    sortedRawRows,
    {
        searchRegion = null,
        pThreshold = GP2_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        pinnedVariantIds = null,
    } = {}
) {
    if (!Array.isArray(sortedRawRows) || !sortedRawRows.length) {
        return sortedRawRows;
    }

    const regionStart = Number(searchRegion?.start);
    const hasStart = Number.isFinite(regionStart);
    const pinnedSet = normalizePinnedSet(pinnedVariantIds);

    const keptSignificant = [];
    const candidatesForBucketing = [];

    for (let i = 0; i < sortedRawRows.length; i++) {
        const row = sortedRawRows[i];
        const pos = getRowPosition(row);
        if (pos == null) {
            continue;
        }

        const variantId = row["Variant ID"];
        const p = getRowPValue(row);
        if (
            (pinnedSet && variantId && pinnedSet.has(variantId)) ||
            (p != null && p <= pThreshold)
        ) {
            keptSignificant.push(row);
            continue;
        }

        if (hasStart && pos < regionStart) {
            continue;
        }

        candidatesForBucketing.push(row);
    }

    const sampledNonsignificant = sampleMinMaxEveryNFromSorted(
        candidatesForBucketing,
        GP2_ASSOC_DOWNSAMPLE_BASE_N
    );
    return [...keptSignificant, ...sampledNonsignificant];
}

/**
 * Tier 3 — Zoomed-in viewing region dataset calculated from Tier 1 (`sortedRawRows`):
 * - Uses rounded zoom bucket size n (10% -> 18, ..., 90% -> 2).
 * - Keeps all variants with p <= 0.005 (so y-axis extents and lead variants stay stable)
 *   and recounts variants with p > 0.005 inside `viewRegion` by bucket size n.
 */
export function buildZoomedViewRegionPlotData(
    sortedRawRows,
    {
        viewRegion = null,
        regionZoom = 0,
        pThreshold = GP2_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        pinnedVariantIds = null,
    } = {}
) {
    if (!Array.isArray(sortedRawRows) || !sortedRawRows.length) {
        return sortedRawRows;
    }

    const n = resolveDownsampleBucketSize(regionZoom);
    const viewStart = Number(viewRegion?.start);
    const viewEnd = Number(viewRegion?.end);
    const hasViewBounds =
        Number.isFinite(viewStart) &&
        Number.isFinite(viewEnd) &&
        viewEnd >= viewStart;
    const pinnedSet = normalizePinnedSet(pinnedVariantIds);

    const keptSignificant = [];
    const candidatesInView = [];

    for (let i = 0; i < sortedRawRows.length; i++) {
        const row = sortedRawRows[i];
        const pos = getRowPosition(row);
        if (pos == null) {
            continue;
        }

        const variantId = row["Variant ID"];
        const p = getRowPValue(row);
        if (
            (pinnedSet && variantId && pinnedSet.has(variantId)) ||
            (p != null && p <= pThreshold)
        ) {
            keptSignificant.push(row);
            continue;
        }

        if (hasViewBounds && (pos < viewStart || pos > viewEnd)) {
            continue;
        }

        candidatesInView.push(row);
    }

    const sampledInView = sampleMinMaxEveryNFromSorted(candidatesInView, n);
    return [...keptSignificant, ...sampledInView];
}
