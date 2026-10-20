/**
 * 3-Tier Association Plot Downsampling Utility for KP Variant Sifter
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

export const VKS_ASSOC_DOWNSAMPLE_P_THRESHOLD = 0.05;
export const VKS_ASSOC_DOWNSAMPLE_POWER = 9;
export const VKS_ASSOC_DOWNSAMPLE_BASE_N = 40;
export const VKS_ASSOC_DOWNSAMPLE_STEP_PER_10_PCT = 4;

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
        return VKS_ASSOC_DOWNSAMPLE_BASE_N;
    }
    const n =
        VKS_ASSOC_DOWNSAMPLE_BASE_N -
        (roundedZoom / 10) * VKS_ASSOC_DOWNSAMPLE_STEP_PER_10_PCT;
    return Math.max(1, n);
}

function getRowPValue(row) {
    const p = Number(row?.["P-Value"] ?? row?.pValue);
    if (Number.isFinite(p) && p >= 0) {
        return p;
    }
    const negLog10P = Number(row?.["-log10(P-Value)"] ?? row?.negLog10P);
    if (Number.isFinite(negLog10P) && negLog10P >= 0) {
        return Math.pow(10, -negLog10P);
    }
    return NaN;
}

function getRowPosition(row) {
    return Number(row?.Position ?? row?.position);
}

/**
 * Tier 1 helper: sort raw plot rows by genomic Position once so Tier 2 and Tier 3
 * can scan sequentially without re-sorting.
 */
export function prepareRawPlotRows(rows = []) {
    if (!Array.isArray(rows) || rows.length <= 1) {
        return Array.isArray(rows) ? [...rows] : [];
    }
    let alreadySorted = true;
    for (let i = 1; i < rows.length; i += 1) {
        const prevPos = getRowPosition(rows[i - 1]);
        const currPos = getRowPosition(rows[i]);
        if (Number.isFinite(prevPos) && Number.isFinite(currPos) && currPos < prevPos) {
            alreadySorted = false;
            break;
        }
    }
    if (alreadySorted) {
        return rows;
    }
    return [...rows].sort((a, b) => {
        const posA = getRowPosition(a);
        const posB = getRowPosition(b);
        if (!Number.isFinite(posA) && !Number.isFinite(posB)) {
            return 0;
        }
        if (!Number.isFinite(posA)) {
            return 1;
        }
        if (!Number.isFinite(posB)) {
            return -1;
        }
        return posA - posB;
    });
}

/**
 * Downsample pre-sorted plot rows within [regionStart, regionEnd] using bucket size `n`:
 * - Variants outside [regionStart, regionEnd] (when region bounds are provided) are excluded
 *   from the bucketed recount, except when `keepOutsideRegion` is true (Tier 2 keeps
 *   significant/pinned variants across the loaded data while counting from `regionStart`).
 * - Variants with p <= pThreshold (or in `pinnedVariantIds`) are always kept.
 * - Variants with p > pThreshold inside the target region are grouped sequentially
 *   in buckets of `n`; from each bucket, the two variants with lowest p and highest p are kept.
 */
export function downsamplePlotRowsByBucket(
    sortedRows = [],
    {
        n = VKS_ASSOC_DOWNSAMPLE_BASE_N,
        pThreshold = VKS_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        region = null,
        clipToRegion = false,
        pinnedVariantIds = null,
    } = {}
) {
    if (!Array.isArray(sortedRows) || !sortedRows.length) {
        return [];
    }

    const bucketSize = Math.max(1, Math.floor(Number(n) || 1));
    const hasRegion =
        region &&
        Number.isFinite(Number(region.start)) &&
        Number.isFinite(Number(region.end)) &&
        Number(region.end) >= Number(region.start);
    const regionStart = hasRegion ? Number(region.start) : -Infinity;
    const regionEnd = hasRegion ? Number(region.end) : Infinity;

    if (bucketSize <= 1 && !clipToRegion) {
        return sortedRows;
    }

    const pinnedSet =
        pinnedVariantIds instanceof Set
            ? pinnedVariantIds
            : Array.isArray(pinnedVariantIds) && pinnedVariantIds.length
              ? new Set(pinnedVariantIds)
              : null;

    const kept = [];
    let bucketCount = 0;
    let minRow = null;
    let minP = Infinity;
    let minOrder = -1;
    let maxRow = null;
    let maxP = -Infinity;
    let maxOrder = -1;

    const flushBucket = () => {
        if (bucketCount === 0) {
            return;
        }
        if (minRow && maxRow && minRow !== maxRow) {
            if (minOrder < maxOrder) {
                kept.push(minRow, maxRow);
            } else {
                kept.push(maxRow, minRow);
            }
        } else if (minRow) {
            kept.push(minRow);
        } else if (maxRow) {
            kept.push(maxRow);
        }
        bucketCount = 0;
        minRow = null;
        minP = Infinity;
        minOrder = -1;
        maxRow = null;
        maxP = -Infinity;
        maxOrder = -1;
    };

    for (let i = 0; i < sortedRows.length; i += 1) {
        const row = sortedRows[i];
        const pos = getRowPosition(row);
        const inRegion =
            !hasRegion ||
            (!Number.isFinite(pos) || (pos >= regionStart && pos <= regionEnd));

        if (!inRegion && clipToRegion) {
            continue;
        }

        const p = getRowPValue(row);
        const varId = row?.["Variant ID"] ?? row?.varId;
        const isPinned = Boolean(pinnedSet && varId && pinnedSet.has(varId));

        if (isPinned || !Number.isFinite(p) || p <= pThreshold) {
            kept.push(row);
            continue;
        }

        if (bucketSize <= 1) {
            kept.push(row);
            continue;
        }

        // For Tier 2 (0% zoom), count every n variants starting from the searching region.
        // If the user has zoomed out / extended beyond the initial search region, also
        // bucket those outer variants so the extended baseline is not blank.
        bucketCount += 1;
        if (p < minP) {
            minP = p;
            minRow = row;
            minOrder = i;
        }
        if (p > maxP) {
            maxP = p;
            maxRow = row;
            maxOrder = i;
        }

        if (bucketCount >= bucketSize) {
            flushBucket();
        }
    }

    flushBucket();
    return kept;
}

/**
 * Tier 2 builder: permanent 0% zoom dataset for the searching region (`n = 40`).
 */
export function buildZoom0SearchRegionPlotData(
    rawSortedRows = [],
    { searchRegion = null, pinnedVariantIds = null } = {}
) {
    return downsamplePlotRowsByBucket(rawSortedRows, {
        n: VKS_ASSOC_DOWNSAMPLE_BASE_N,
        pThreshold: VKS_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        region: searchRegion,
        clipToRegion: false,
        pinnedVariantIds,
    });
}

/**
 *Tier 3 builder: zoomed-in viewing region dataset calculated from Tier 1 (`rawSortedRows`)
 * after movement settles.
 */
export function buildZoomedViewRegionPlotData(
    rawSortedRows = [],
    { viewRegion = null, regionZoom = 0, pinnedVariantIds = null } = {}
) {
    const n = resolveDownsampleBucketSize(regionZoom);
    return downsamplePlotRowsByBucket(rawSortedRows, {
        n,
        pThreshold: VKS_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        region: viewRegion,
        clipToRegion: Boolean(viewRegion),
        pinnedVariantIds,
    });
}

/**
 * Downsample association rows immediately upon loading:
 * - Keeps 100% of variants with `p <= 0.05` (`pThreshold`).
 * - For `p > 0.05`, keeps the variant if `Math.random() <= Math.pow(1 - p, power)` (`power = 9`),
 *   giving a ~90% overall reduction with zero sorting/bucketing overhead.
 */
export function downsampleAssociationRowsOnLoad(
    rows = [],
    {
        pThreshold = VKS_ASSOC_DOWNSAMPLE_P_THRESHOLD,
        power = VKS_ASSOC_DOWNSAMPLE_POWER,
    } = {}
) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }
    const surviving = [];
    for (let i = 0; i < rows.length; i += 1) {
        const row = rows[i];
        const p = getRowPValue(row);
        if (!Number.isFinite(p) || p <= pThreshold) {
            surviving.push(row);
            continue;
        }
        const clampedP = Math.min(1, Math.max(0, p));
        if (Math.random() <= Math.pow(1 - clampedP, power)) {
            surviving.push(row);
        }
    }
    return surviving.sort((a, b) => {
        const pA = getRowPValue(a);
        const pB = getRowPValue(b);
        const normA = Number.isFinite(pA) ? pA : 1;
        const normB = Number.isFinite(pB) ? pB : 1;
        return normA - normB;
    });
}

/**
 * Copy already-computed LD scores (`LDS`) from existing rows onto newly fetched
 * zoomed-in rows by Variant ID / varId without refetching from the LD server.
 */
export function applyCachedLdScoresToRows(targetRows = [], sourceRows = []) {
    if (!Array.isArray(targetRows) || !targetRows.length) {
        return [];
    }
    if (!Array.isArray(sourceRows) || !sourceRows.length) {
        return targetRows;
    }
    const ldByVarId = new Map();
    for (let i = 0; i < sourceRows.length; i += 1) {
        const row = sourceRows[i];
        const varId = row?.["Variant ID"] || row?.varId;
        const lds = row?.LDS;
        if (varId && lds != null && !Number.isNaN(lds)) {
            ldByVarId.set(varId, lds);
        }
    }
    if (!ldByVarId.size) {
        return targetRows;
    }
    return targetRows.map((row) => {
        if (row?.LDS != null && !Number.isNaN(row.LDS)) {
            return row;
        }
        const varId = row?.["Variant ID"] || row?.varId;
        const cachedLds = varId ? ldByVarId.get(varId) : undefined;
        if (cachedLds === undefined) {
            return row;
        }
        return {
            ...row,
            LDS: cachedLds,
        };
    });
}

function zoomRowMergeKey(row, primaryAncestry = "Mixed") {
    const id = row?.["Variant ID"] || row?.varId || "";
    const ancestry = row?.Ancestry || primaryAncestry;
    const project = row?.Project || "KP";
    const phenotype = row?.PhenotypeKey || row?.Phenotype || "";
    return `${id}@@${ancestry}@@${project}@@${phenotype}`;
}

/**
 * Remove any rows that were added exclusively by a 100%-zoom refetch (`_zoomRefetched: true`),
 * restoring the 0%-zoom downsampled baseline while preserving any LD or series updates.
 */
export function stripZoomRefetchedRows(rows = []) {
    if (!Array.isArray(rows) || !rows.length) {
        return [];
    }
    if (!rows.some((row) => row?._zoomRefetched)) {
        return rows;
    }
    return rows.filter((row) => !row?._zoomRefetched);
}

/**
 * Merge newly refetched zoomed-in rows with the 0%-zoom baseline rows:
 * - Strips any prior `_zoomRefetched` rows
 * - Copies cached LD scores from the baseline onto incoming rows (no LD server call)
 * - Tags zoomed-only rows with `_zoomRefetched: true` so they can be discarded when zooming back out
 */
export function mergeZoomedAssociationRows(
    existingRows = [],
    incomingZoomRows = [],
    primaryAncestry = "Mixed"
) {
    const baseRows = stripZoomRefetchedRows(existingRows);
    if (!Array.isArray(incomingZoomRows) || !incomingZoomRows.length) {
        return baseRows;
    }
    const incomingWithLd = applyCachedLdScoresToRows(incomingZoomRows, baseRows);
    const baseKeys = new Set();
    for (let i = 0; i < baseRows.length; i += 1) {
        const key = zoomRowMergeKey(baseRows[i], primaryAncestry);
        if (key && !key.startsWith("@@")) {
            baseKeys.add(key);
        }
    }
    const addedZoomRows = [];
    for (let i = 0; i < incomingWithLd.length; i += 1) {
        const row = incomingWithLd[i];
        const key = zoomRowMergeKey(row, primaryAncestry);
        if (!key || key.startsWith("@@") || baseKeys.has(key)) {
            continue;
        }
        baseKeys.add(key);
        addedZoomRows.push({
            ...row,
            _zoomRefetched: true,
        });
    }
    if (!addedZoomRows.length) {
        return baseRows;
    }
    return [...baseRows, ...addedZoomRows].sort((left, right) => {
        const pLeft = getRowPValue(left);
        const pRight = getRowPValue(right);
        return (Number.isFinite(pLeft) ? pLeft : 1) - (Number.isFinite(pRight) ? pRight : 1);
    });
}


