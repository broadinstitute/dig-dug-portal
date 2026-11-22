import { queryComplete } from "@/utils/bioIndexUtils";
import { GP2_ASSOCIATIONS_BIOINDEX_HOST } from "./gp2BrowserSections.js";

export const GP2_GENE_PRIORITIZATION_INDEX = "gene-scoring-dataset";

/** Fixed dataset queried for the Gene prioritization tool (Tools menu). */
export const GP2_GENE_PRIORITIZATION_DATASET =
    "GP2_2025_Parkinsons_ALL_GeneScoring_EU";

/**
 * Raw `gene-scoring-dataset` field -> user-friendly data-table column label,
 * in display order.
 */
export const GP2_GENE_PRIORITIZATION_COLUMNS = [
    { field: "Gene", label: "Gene" },
    { field: "Locus_ID", label: "Locus" },
    { field: "Evidence_Category", label: "Evidence Category" },
    { field: "Evidence_Score", label: "Evidence Score" },
    { field: "Normalized_Score", label: "Normalized Score" },
    { field: "Locus_Normalized_Score", label: "Locus Normalized Score" },
    { field: "Proposed_Causal_Norm", label: "Proposed Causal (Normalized)" },
    { field: "QTL_Coloc_Norm", label: "QTL Colocalization (Normalized)" },
    { field: "Coding_Variant_Norm", label: "Coding Variant (Normalized)" },
    { field: "Burden_Norm", label: "Burden (Normalized)" },
    {
        field: "Expressed_Localization_Norm",
        label: "Expression Localization (Normalized)",
    },
    { field: "Disease_Association_Norm", label: "Disease Association (Normalized)" },
];

const NUMERIC_FIELDS = new Set([
    "Evidence_Score",
    "Normalized_Score",
    "Locus_Normalized_Score",
    "Proposed_Causal_Norm",
    "QTL_Coloc_Norm",
    "Coding_Variant_Norm",
    "Burden_Norm",
    "Expressed_Localization_Norm",
    "Disease_Association_Norm",
]);

/**
 * Score-based columns shown as minimum-value sliders above the table.
 * `Evidence_Score` is unbounded on the high end (its slider max comes from
 * the loaded data); every other score is already normalized to 0-1.
 */
export const GP2_GENE_PRIORITIZATION_SCORE_FIELDS = [
    { field: "Evidence_Score", label: "Evidence Score", min: 0, max: null },
    { field: "Normalized_Score", label: "Normalized Score", min: 0, max: 1 },
    {
        field: "Locus_Normalized_Score",
        label: "Locus Normalized Score",
        min: 0,
        max: 1,
    },
    {
        field: "Proposed_Causal_Norm",
        label: "Proposed Causal (Normalized)",
        min: 0,
        max: 1,
    },
    {
        field: "QTL_Coloc_Norm",
        label: "QTL Colocalization (Normalized)",
        min: 0,
        max: 1,
    },
    {
        field: "Coding_Variant_Norm",
        label: "Coding Variant (Normalized)",
        min: 0,
        max: 1,
    },
    { field: "Burden_Norm", label: "Burden (Normalized)", min: 0, max: 1 },
    {
        field: "Expressed_Localization_Norm",
        label: "Expression Localization (Normalized)",
        min: 0,
        max: 1,
    },
    {
        field: "Disease_Association_Norm",
        label: "Disease Association (Normalized)",
        min: 0,
        max: 1,
    },
];

/** Highest `Evidence_Score` present in `rows`, used as that slider's max bound. */
export function gp2GenePrioritizationMaxEvidenceScore(rows) {
    let max = 0;
    (rows || []).forEach((row) => {
        const value = Number(row?.Evidence_Score);
        if (Number.isFinite(value) && value > max) {
            max = value;
        }
    });
    return max > 0 ? max : 1;
}

/** Unique `Evidence_Category` values present in `rows`, sorted alphabetically. */
export function gp2GenePrioritizationEvidenceCategories(rows) {
    const categories = new Set();
    (rows || []).forEach((row) => {
        const category = String(row?.Evidence_Category || "").trim();
        if (category) {
            categories.add(category);
        }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
}

export function gp2GenePrioritizationDefaultFilters(rows) {
    const scoreMin = {};
    GP2_GENE_PRIORITIZATION_SCORE_FIELDS.forEach(({ field, min }) => {
        scoreMin[field] = min;
    });
    return {
        geneSearch: "",
        evidenceCategory: "",
        showInRegionOnly: false,
        scoreMin,
    };
}

/** The `{chr, start, end}` region for a row's locus, or `null` if incomplete. */
export function gp2GenePrioritizationRowRegion(row) {
    const chr = String(row?.chromosome ?? "").trim();
    const start = Number(row?.start);
    const end = Number(row?.end);
    if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    return { chr, start, end };
}

/** Whether a row's locus (`chromosome`/`start`/`end`) overlaps `region` (`{chr, start, end}`) at all. */
export function gp2GenePrioritizationRowOverlapsRegion(row, region) {
    if (!region || region.start == null || region.end == null) {
        return true;
    }
    const chr = String(region.chr ?? "").trim();
    const rowChr = String(row?.chromosome ?? "").trim();
    if (chr && rowChr !== chr) {
        return false;
    }
    const rowStart = Number(row?.start);
    const rowEnd = Number(row?.end);
    if (!Number.isFinite(rowStart) || !Number.isFinite(rowEnd)) {
        return false;
    }
    return rowStart <= Number(region.end) && rowEnd >= Number(region.start);
}

/** Parse a comma-separated "LRRK2, GBA1" search box value into trimmed, de-duplicated gene tokens. */
export function gp2GenePrioritizationParseGeneSearch(geneSearch) {
    return Array.from(
        new Set(
            String(geneSearch || "")
                .split(",")
                .map((token) => token.trim().toLowerCase())
                .filter(Boolean)
        )
    );
}

/**
 * Apply the gene-search, evidence-category, per-score minimum-value, and
 * (optional) search-region filters to `rows`. A slider left at its column's
 * minimum does not filter anything out for that column.
 */
export function gp2GenePrioritizationFilterRows(rows, filters, region) {
    const geneTokens = gp2GenePrioritizationParseGeneSearch(filters?.geneSearch);
    const evidenceCategory = String(filters?.evidenceCategory || "").trim();
    const scoreMin = filters?.scoreMin || {};
    const restrictToRegion = Boolean(filters?.showInRegionOnly) && Boolean(region);

    return (rows || []).filter((row) => {
        if (geneTokens.length) {
            const gene = String(row?.Gene || "").toLowerCase();
            if (!geneTokens.some((token) => gene.includes(token))) {
                return false;
            }
        }
        if (evidenceCategory && String(row?.Evidence_Category || "") !== evidenceCategory) {
            return false;
        }
        if (restrictToRegion && !gp2GenePrioritizationRowOverlapsRegion(row, region)) {
            return false;
        }
        return GP2_GENE_PRIORITIZATION_SCORE_FIELDS.every(({ field, min }) => {
            const threshold = scoreMin[field];
            if (threshold == null || threshold <= min) {
                return true;
            }
            const value = Number(row?.[field]);
            return Number.isFinite(value) && value >= threshold;
        });
    });
}

export function gp2GenePrioritizationColumnLabels(
    columns = GP2_GENE_PRIORITIZATION_COLUMNS
) {
    return columns.map((column) => column.label);
}

function fieldForLabel(label, columns = GP2_GENE_PRIORITIZATION_COLUMNS) {
    const match = columns.find((column) => column.label === label);
    return match ? match.field : null;
}

export function gp2GenePrioritizationSortValue(row, label) {
    const field = fieldForLabel(label);
    if (!field) {
        return null;
    }
    const value = row?.[field];
    if (NUMERIC_FIELDS.has(field)) {
        const number = Number(value);
        return Number.isFinite(number) ? number : null;
    }
    return value == null ? null : String(value);
}

function formatNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) {
        return "—";
    }
    if (number !== 0 && Math.abs(number) < 1e-4) {
        return number.toExponential(2);
    }
    return (Math.round(number * 10000) / 10000).toString();
}

export function gp2GenePrioritizationFormatCell(row, label) {
    const field = fieldForLabel(label);
    if (!field) {
        return "—";
    }
    const value = row?.[field];
    if (value == null || value === "") {
        return "—";
    }
    if (NUMERIC_FIELDS.has(field)) {
        return formatNumber(value);
    }
    return String(value);
}

/** Fetch the gene-prioritization rows for the fixed Gene scoring dataset. */
export async function fetchGp2GenePrioritization({
    host = GP2_ASSOCIATIONS_BIOINDEX_HOST,
    dataset = GP2_GENE_PRIORITIZATION_DATASET,
} = {}) {
    const result = await queryComplete(GP2_GENE_PRIORITIZATION_INDEX, dataset, {
        host,
    });
    return result?.data || [];
}
