/**
 * Fixed 50 kb (±25 kb) viewing region helpers for GP2 Browser.
 */

export const GP2_VIEWING_REGION_HALF_BP = 25000;
export const GP2_VIEWING_REGION_WIDTH_BP = GP2_VIEWING_REGION_HALF_BP * 2;

/**
 * Extract numeric genomic position (bp) from a formatted row, raw row, or variant ID string.
 */
export function extractVariantPositionBp(variantOrRow) {
    if (!variantOrRow) {
        return null;
    }
    if (typeof variantOrRow === "object") {
        const pos = Number(variantOrRow.Position ?? variantOrRow.position);
        if (Number.isFinite(pos) && pos > 0) {
            return Math.round(pos);
        }
        const idStr =
            variantOrRow["Variant ID"] ||
            variantOrRow.varId ||
            variantOrRow.variantId ||
            "";
        return extractVariantPositionBp(idStr);
    }
    const match = String(variantOrRow).match(
        /^(?:chr)?(?:\d+|X|Y|MT)[:_](\d+)/i
    );
    if (!match) {
        return null;
    }
    const parsed = Number(match[1]);
    return Number.isFinite(parsed) && parsed > 0 ? Math.round(parsed) : null;
}

/**
 * Clamp the 50 kb viewing window center so [center - 25kb, center + 25kb] stays
 * within the searching region bounds when the searching region is >= 50 kb.
 */
export function clampViewingCenterBp(
    centerBp,
    searchRegion,
    halfWidthBp = GP2_VIEWING_REGION_HALF_BP
) {
    if (!searchRegion || searchRegion.start == null || searchRegion.end == null) {
        const numeric = Number(centerBp);
        return Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : null;
    }

    const start = Number(searchRegion.start);
    const end = Number(searchRegion.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
    }

    const midpoint = Math.round((start + end) / 2);
    const numeric = Number(centerBp);
    const target =
        Number.isFinite(numeric) && numeric > 0 ? Math.round(numeric) : midpoint;

    const span = end - start;
    if (span <= halfWidthBp * 2) {
        return Math.max(start, Math.min(end, target));
    }

    const minCenter = start + halfWidthBp;
    const maxCenter = end - halfWidthBp;
    return Math.max(minCenter, Math.min(maxCenter, target));
}

/**
 * Compute the 50 kb (±25 kb) viewing region around `centerBp` within `searchRegion`.
 */
export function computeGp2ViewingRegion(
    searchRegion,
    centerBp = null,
    halfWidthBp = GP2_VIEWING_REGION_HALF_BP
) {
    if (!searchRegion || !searchRegion.chr) {
        return null;
    }
    const start = Number(searchRegion.start);
    const end = Number(searchRegion.end);
    if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) {
        return null;
    }

    const clampedCenter = clampViewingCenterBp(
        centerBp,
        searchRegion,
        halfWidthBp
    );
    if (clampedCenter == null) {
        return null;
    }

    const viewStart = Math.max(0, clampedCenter - halfWidthBp);
    const viewEnd = viewStart + halfWidthBp * 2;
    return {
        chr: searchRegion.chr,
        start: viewStart,
        end: viewEnd,
    };
}
