import { queryComplete } from "@/utils/bioIndexUtils";
import { GP2_ASSOCIATIONS_BIOINDEX_HOST } from "./gp2BrowserSections.js";
import {
    locusSummaryCategoryColor,
    locusSummaryNormColor,
} from "./gp2BrowserLocusSummaryApi.js";

export const GP2_GENE_PRIORITIZATION_INDEX = "gene-scoring-dataset";

/** Fixed dataset queried for the Gene prioritization tool (Tools menu). */
export const GP2_GENE_PRIORITIZATION_DATASET =
    "GP2_2025_Parkinsons_ALL_GeneScoring_EU";

/**
 * Raw `gene-scoring-dataset` field -> user-friendly data-table column label,
 * in display order.
 *
 * - Gene navigates with the gene symbol as the search-region query; the browser
 *   resolves that symbol to coordinates (same path as the welcome search box).
 * - Locus number shows `Locus_Number`.
 * - Locus shows the locus region (`Locus_ID` / `chromosome`:`start`-`end`) and
 *   navigates to that span.
 */
export const GP2_GENE_PRIORITIZATION_COLUMNS = [
    { field: "Gene", label: "Gene" },
    { field: "Locus_Number", label: "Locus number" },
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
    "Locus_Number",
]);

/** Columns rendered as locus-summary-style intensity pills. */
const PILL_COLUMN_KIND_BY_LABEL = {
    "Evidence Category": "category",
    "Evidence Score": "score",
    "Normalized Score": "norm",
    "Locus Normalized Score": "norm",
    "Proposed Causal (Normalized)": "norm",
    "QTL Colocalization (Normalized)": "norm",
    "Coding Variant (Normalized)": "norm",
    "Burden (Normalized)": "norm",
    "Expression Localization (Normalized)": "norm",
    "Disease Association (Normalized)": "norm",
};

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
        scoreMin,
    };
}

/** Format `{chr,start,end}` as `chr:start-end`, or `""` when incomplete. */
export function gp2FormatRegionLabel(region) {
    if (!region) {
        return "";
    }
    const chr = String(region.chr ?? "").trim();
    const start = Number(region.start);
    const end = Number(region.end);
    if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) {
        return "";
    }
    return `${chr}:${start}-${end}`;
}

/**
 * The `{chr, start, end}` region for a row's locus (from scoring
 * `chromosome`/`start`/`end`, equivalent to `Locus_ID`), or `null`.
 */
export function gp2GenePrioritizationLocusRegion(row) {
    const chr = String(row?.chromosome ?? "").trim();
    const start = Number(row?.start);
    const end = Number(row?.end);
    if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    return { chr, start, end };
}

/** @deprecated Prefer {@link gp2GenePrioritizationLocusRegion}. */
export function gp2GenePrioritizationRowRegion(row) {
    return gp2GenePrioritizationLocusRegion(row);
}

/**
 * Navigation target for a table column click.
 * - Gene → `{ geneOrVariantQuery }` (browser resolves symbol → region)
 * - Locus → `{ chr, start, end }` locus span
 */
export function gp2GenePrioritizationNavigateTarget(row, columnLabel) {
    if (columnLabel === "Gene") {
        const gene = String(row?.Gene || "").trim();
        return gene ? { geneOrVariantQuery: gene } : null;
    }
    if (columnLabel === "Locus") {
        return gp2GenePrioritizationLocusRegion(row);
    }
    return null;
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
 * Apply the gene-search, evidence-category, and per-score minimum-value
 * filters to `rows`. A slider left at its column's minimum does not filter
 * anything out for that column.
 */
export function gp2GenePrioritizationFilterRows(rows, filters) {
    const geneTokens = gp2GenePrioritizationParseGeneSearch(filters?.geneSearch);
    const evidenceCategory = String(filters?.evidenceCategory || "").trim();
    const scoreMin = filters?.scoreMin || {};

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
    if (label === "Locus") {
        const region = gp2GenePrioritizationLocusRegion(row);
        if (region) {
            // Chromosome then start for genomic order.
            return `${String(region.chr).padStart(2, "0")}:${String(
                region.start
            ).padStart(12, "0")}`;
        }
        return String(row?.Locus_ID || "").trim();
    }
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
    if (label === "Locus") {
        const fromId = String(row?.Locus_ID || "").trim();
        if (fromId) {
            return fromId;
        }
        return gp2FormatRegionLabel(gp2GenePrioritizationLocusRegion(row)) || "—";
    }
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

/**
 * Presentation for score/category cells — same green pill language as
 * Locus summary. Returns `null` for plain text columns (Gene / Locus).
 */
export function gp2GenePrioritizationCellPresentation(row, label) {
    const kind = PILL_COLUMN_KIND_BY_LABEL[label];
    if (!kind) {
        return null;
    }
    const display = gp2GenePrioritizationFormatCell(row, label);
    if (display === "—") {
        return {
            display,
            kind,
            className: "is-empty",
            style: {},
        };
    }
    if (kind === "category") {
        return {
            display: String(display).toUpperCase(),
            kind,
            className: "is-category",
            style: {
                background: locusSummaryCategoryColor(display),
                color: "#fff",
            },
        };
    }
    const field = fieldForLabel(label);
    const value = Number(row?.[field]);
    if (!Number.isFinite(value)) {
        return {
            display,
            kind,
            className: "",
            style: {},
        };
    }
    if (kind === "score") {
        return {
            display,
            kind,
            className: "",
            style: {
                background: locusSummaryNormColor(Math.min(1, value / 5)),
                color: "#1f3d2a",
            },
        };
    }
    const bg = locusSummaryNormColor(value);
    return {
        display,
        kind,
        className: "",
        style: {
            background: bg,
            color: value >= 0.55 ? "#fff" : "#1f3d2a",
        },
    };
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
