import { queryComplete } from "@/utils/bioIndexUtils";
import { formatRegion } from "../kpVariantSifter/variantSifterSearchUtils.js";
import { GP2_ASSOCIATIONS_BIOINDEX_HOST } from "./gp2BrowserSections.js";

export const GP2_QTL_INDEX = "qtl-associations";

/** QTL type options shown in the drawer. None are selected by default. */
export const GP2_QTL_TYPE_OPTIONS = ["eQTL"];

/** Tissue options shown in the drawer. None are selected by default. */
export const GP2_QTL_TISSUE_OPTIONS = ["Cortex"];

export const GP2_QTL_TABLE_COLUMNS = [
    "Variant",
    "P-value",
    "Beta",
    "Var Beta",
    "Std ERR",
    "EAF",
    "MAF",
    "Gene",
    "Tissue",
    "Ancestry",
    "Dataset",
];

export function qtlVariantLabel(row) {
    const chr = row?.chromosome;
    const pos = row?.position;
    const ref = row?.reference;
    const alt = row?.alt;
    if (chr != null && chr !== "" && pos != null && ref && alt) {
        return `${chr}:${pos}_${ref}/${alt}`;
    }
    const varId = String(row?.varId || "").trim();
    return varId || "";
}

function normalizeToken(value) {
    return String(value || "").trim().toLowerCase();
}

/** Match a QTL type against an explicit type field, otherwise the dataset name. */
export function rowMatchesQtlType(row, type) {
    const wanted = normalizeToken(type);
    if (!wanted) {
        return false;
    }
    const explicit = normalizeToken(row?.qtlType || row?.type);
    if (explicit) {
        return explicit === wanted;
    }
    return normalizeToken(row?.dataset).includes(wanted);
}

/** Tissue is the BioIndex `region` field (for example "Cortex"). */
export function rowMatchesQtlTissue(row, tissue) {
    const wanted = String(tissue || "").trim();
    if (!wanted) {
        return false;
    }
    return String(row?.region || "").trim() === wanted;
}

export function filterQtlRows(rows, { types = [], tissues = [] } = {}) {
    const typeList = (types || []).map((type) => String(type || "").trim()).filter(Boolean);
    const tissueList = (tissues || [])
        .map((tissue) => String(tissue || "").trim())
        .filter(Boolean);
    if (!typeList.length || !tissueList.length) {
        return [];
    }
    return (rows || []).filter(
        (row) =>
            typeList.some((type) => rowMatchesQtlType(row, type)) &&
            tissueList.some((tissue) => rowMatchesQtlTissue(row, tissue))
    );
}

export function gp2QtlLoadKey(region) {
    return formatRegion(region);
}

export function parseQtlPValueMax(value) {
    const text = String(value || "").trim();
    if (!text) {
        return null;
    }
    const number = Number(text);
    if (!Number.isFinite(number) || number < 0) {
        return null;
    }
    return number;
}

export function filterQtlRowsByPValueMax(rows, pValueMax) {
    const max = parseQtlPValueMax(pValueMax);
    if (max == null) {
        return rows || [];
    }
    return (rows || []).filter((row) => {
        const pValue = Number(row?.pValue);
        return Number.isFinite(pValue) && pValue <= max;
    });
}

export function restrictQtlRowsToRegion(rows, region) {
    if (!region || region.start == null || region.end == null) {
        return rows || [];
    }
    const start = Number(region.start);
    const end = Number(region.end);
    return (rows || []).filter((row) => {
        const pos = Number(row?.position);
        return Number.isFinite(pos) && pos >= start && pos <= end;
    });
}

/**
 * Add back QTL-starred rows (starred from a QTL plot dot — `source: "qtl"`)
 * that are missing from `baseRows`, matched by `qtlVariantLabel`. Starred
 * rows bypass type/tissue/p-value filtering entirely: starring a variant is
 * an explicit user override to keep it visible in the table regardless of
 * the current filter selection.
 */
export function addMissingStarredQtlRows(baseRows, starredVariants) {
    const starredRows = (starredVariants || [])
        .filter((entry) => entry?.source === "qtl" && entry.row)
        .map((entry) => entry.row);
    if (!starredRows.length) {
        return baseRows || [];
    }
    const baseIds = new Set((baseRows || []).map((row) => qtlVariantLabel(row)));
    const missing = starredRows.filter((row) => {
        const id = qtlVariantLabel(row);
        return id && !baseIds.has(id);
    });
    return missing.length ? [...(baseRows || []), ...missing] : baseRows || [];
}

/**
 * Fetch raw `qtl-associations` rows for a locus (whole searching region or
 * 50 kb viewing region), unfiltered by type/tissue/p-value.
 * `qtl-associations` currently accepts only `chromosome:start-end`; type,
 * tissue, and p-value selections are applied client-side.
 */
export async function fetchGp2QtlAssociations(
    region,
    { host = GP2_ASSOCIATIONS_BIOINDEX_HOST } = {}
) {
    const q = formatRegion(region);
    if (!q) {
        throw new Error("QTL associations need a genomic region.");
    }
    const result = await queryComplete(GP2_QTL_INDEX, q, { host });
    return result?.data || [];
}
