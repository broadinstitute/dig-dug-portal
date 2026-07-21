/**
 * SNP-to-gene (variant-links) state for Variant Sifter.
 * Normalized into the same tissue → gene → method model as V2G, with a single
 * synthetic tissue label matching ResearchGeneLinks.
 */

import {
    emptyV2gState,
    hasV2gTrackData,
    normalizeV2gFromSession,
    snapshotV2gForExport,
    VKS_V2G_DEFAULT_VIEW_MODE,
} from "./variantSifterV2gData.js";

export const VKS_S2G_TISSUE_LABEL = "SNP to gene";

export function emptyS2gState() {
    return {
        ...emptyV2gState(),
        viewMode: VKS_V2G_DEFAULT_VIEW_MODE,
    };
}

/** Map BioIndex variant-links rows into the gene-links field shape. */
export function normalizeVariantLinkRows(rows = []) {
    return (Array.isArray(rows) ? rows : []).map((row) => {
        if (!row || typeof row !== "object") {
            return row;
        }
        return {
            ...row,
            targetGene: row.targetGene || row.gene,
        };
    });
}

/**
 * Build V2G-compatible tissueData for a single SNP-to-gene load.
 */
export function buildS2gTissueData(rows = []) {
    const normalized = normalizeVariantLinkRows(rows);
    if (!normalized.length) {
        return {};
    }
    return {
        [VKS_S2G_TISSUE_LABEL]: normalized,
    };
}

export function snapshotS2gForExport(state) {
    const snapshot = snapshotV2gForExport(state);
    if (!snapshot) {
        return null;
    }
    // S2G has no promoter coordinates, so only tracks view is supported.
    return {
        ...snapshot,
        viewMode: VKS_V2G_DEFAULT_VIEW_MODE,
    };
}

export function normalizeS2gFromSession(exported) {
    return {
        ...normalizeV2gFromSession(exported),
        viewMode: VKS_V2G_DEFAULT_VIEW_MODE,
    };
}

export function hasS2gTrackData(state) {
    return hasV2gTrackData(state);
}

export function normalizeS2gViewMode(_value) {
    return VKS_V2G_DEFAULT_VIEW_MODE;
}
