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

export function gp2QtlLoadKey(region, types, tissues) {
    const locus = formatRegion(region);
    const typeKey = [...(types || [])].map((type) => String(type)).sort().join(",");
    const tissueKey = [...(tissues || [])]
        .map((tissue) => String(tissue))
        .sort()
        .join(",");
    return `${locus}|${typeKey}|${tissueKey}`;
}

/**
 * Load QTL associations for a locus.
 * `qtl-associations` currently accepts only `chromosome:start-end`.
 * Selected types and tissues are applied client-side until the index
 * accepts those parameters on the query.
 */
export async function fetchGp2QtlAssociations(
    region,
    { types = [], tissues = [], host = GP2_ASSOCIATIONS_BIOINDEX_HOST } = {}
) {
    const q = formatRegion(region);
    if (!q) {
        throw new Error("QTL associations need a genomic region.");
    }
    const result = await queryComplete(GP2_QTL_INDEX, q, { host });
    return filterQtlRows(result?.data || [], { types, tissues });
}
