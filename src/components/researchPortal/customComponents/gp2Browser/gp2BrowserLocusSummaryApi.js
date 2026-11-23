/**
 * Gene scores workspace section — region-scoped gene scores grouped by locus,
 * joined to loaded gene-track annotations (and optional association/LD rows).
 */
import { queryComplete } from "@/utils/bioIndexUtils";
import { formatRegion } from "../kpVariantSifter/variantSifterSearchUtils.js";
import {
    associationRowAncestry,
    associationRowPhenotype,
    primaryAssociationAncestry,
} from "../kpVariantSifter/variantSifterAssociationsApi.js";
import { pickLeadVariantRow } from "./gp2BrowserLdServer.js";
import { GP2_ASSOCIATIONS_BIOINDEX_HOST } from "./gp2BrowserSections.js";

export const GP2_LOCUS_SUMMARY_INDEX = "gene-scoring";
export const GP2_LOCUS_SUMMARY_P_MAX = 0.05;

/** Scoring symbols that differ from gene-track `gene_name`. */
const GENE_SYMBOL_ALIASES = {
    GBA1: ["GBA"],
    GBA: ["GBA1"],
};

/**
 * Evidence rows under each gene column (mockup matrix).
 * Norm fields render as intensity pills; category/score as text/number.
 */
export const GP2_LOCUS_SUMMARY_EVIDENCE_ROWS = [
    { field: "Evidence_Category", label: "Evidence category", kind: "category" },
    { field: "Evidence_Score", label: "Evidence score", kind: "score" },
    { field: "Normalized_Score", label: "Normalized score", kind: "norm" },
    { field: "Locus_Normalized_Score", label: "Locus normalized score", kind: "norm" },
    { field: "Proposed_Causal_Norm", label: "Proposed causal", kind: "norm" },
    { field: "QTL_Coloc_Norm", label: "QTL colocalization", kind: "norm" },
    { field: "Coding_Variant_Norm", label: "Coding variant", kind: "norm" },
    { field: "Burden_Norm", label: "Burden", kind: "norm" },
    {
        field: "Expressed_Localization_Norm",
        label: "Expression localization",
        kind: "norm",
    },
    {
        field: "Disease_Association_Norm",
        label: "Disease association",
        kind: "norm",
    },
];

/** Default Gene scores drawer column visibility (all score fields on). */
export function gp2DefaultGeneScoreVisibleFields(
    columns = GP2_LOCUS_SUMMARY_EVIDENCE_ROWS
) {
    return (columns || []).map((column) => column.field);
}

export function gp2GeneScoresLoadKey(phenotypeName, region) {
    const phenotype = String(phenotypeName || "").trim();
    const label = formatRegion(region) || "";
    return `${phenotype}|${label}`;
}

function geneLookupNames(symbol) {
    const gene = String(symbol || "").trim();
    if (!gene) {
        return [];
    }
    const aliases =
        GENE_SYMBOL_ALIASES[gene] || GENE_SYMBOL_ALIASES[gene.toUpperCase()] || [];
    return Array.from(new Set([gene, gene.toUpperCase(), ...aliases]));
}

function associationPValue(row) {
    const value = row?.["P-Value"] ?? row?.pValue;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function associationPosition(row) {
    const value = row?.Position ?? row?.position;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
}

function regionOverlapsPosition(region, position) {
    if (!region || position == null) {
        return false;
    }
    const start = Number(region.start);
    const end = Number(region.end);
    return (
        Number.isFinite(start) &&
        Number.isFinite(end) &&
        position >= start &&
        position <= end
    );
}

function sameChromosome(a, b) {
    return (
        String(a || "")
            .replace(/^chr/i, "")
            .toLowerCase() ===
        String(b || "")
            .replace(/^chr/i, "")
            .toLowerCase()
    );
}

/** Fetch `gene-scoring` rows for phenotype + search region. */
export async function fetchGp2LocusSummaryGeneScores({
    phenotype,
    region,
    host = GP2_ASSOCIATIONS_BIOINDEX_HOST,
} = {}) {
    const phenotypeName =
        typeof phenotype === "string" ? phenotype : phenotype?.name;
    const regionLabel = formatRegion(region);
    if (!phenotypeName || !regionLabel) {
        return [];
    }
    const q = `${phenotypeName},${regionLabel}`;
    const result = await queryComplete(GP2_LOCUS_SUMMARY_INDEX, q, { host });
    return result?.data || [];
}

export function buildGeneTrackLookup(geneTracks) {
    const byName = new Map();
    (geneTracks || []).forEach((gene) => {
        const name = String(gene?.gene_name || "").trim();
        if (!name) {
            return;
        }
        if (!byName.has(name)) {
            byName.set(name, gene);
        }
        byName.set(name.toUpperCase(), gene);
    });
    return byName;
}

export function resolveTrackGene(symbol, trackLookup) {
    if (!trackLookup) {
        return null;
    }
    for (const name of geneLookupNames(symbol)) {
        const hit = trackLookup.get(name) || trackLookup.get(name.toUpperCase());
        if (hit) {
            return hit;
        }
    }
    return null;
}

/**
 * Keep primary phenotype × ancestry association rows with p ≤ 0.05.
 */
export function filterLocusSummaryAssociationRows(
    rows,
    { phenotypeName = null, ancestry = null, pMax = GP2_LOCUS_SUMMARY_P_MAX } = {}
) {
    const phenotype = String(phenotypeName || "").trim();
    const ancestryKey = ancestry == null || ancestry === "" ? null : String(ancestry);
    return (rows || []).filter((row) => {
        const pValue = associationPValue(row);
        if (pValue == null || pValue > pMax) {
            return false;
        }
        if (phenotype) {
            const rowPhenotype = associationRowPhenotype(row, phenotype);
            if (
                rowPhenotype &&
                String(rowPhenotype).toLowerCase() !== phenotype.toLowerCase()
            ) {
                return false;
            }
        }
        if (ancestryKey) {
            const rowAncestry = associationRowAncestry(row, ancestryKey);
            if (
                rowAncestry &&
                String(rowAncestry).toLowerCase() !== ancestryKey.toLowerCase()
            ) {
                return false;
            }
        }
        return true;
    });
}

function locusRegionFromScoreRow(row) {
    const chr = String(row?.chromosome ?? "").trim();
    const start = Number(row?.start);
    const end = Number(row?.end);
    if (!chr || !Number.isFinite(start) || !Number.isFinite(end)) {
        return null;
    }
    return { chr, start, end };
}

/**
 * Group gene-scoring rows by locus and attach track genes + p≤0.05 variants.
 */
export function buildGp2LocusSummaryModel({
    geneScoreRows = [],
    associationRows = [],
    geneTracks = [],
    phenotypeName = null,
    ancestry = null,
    pMax = GP2_LOCUS_SUMMARY_P_MAX,
} = {}) {
    const trackLookup = buildGeneTrackLookup(geneTracks);
    const variants = filterLocusSummaryAssociationRows(associationRows, {
        phenotypeName,
        ancestry,
        pMax,
    });

    const byLocus = new Map();
    (geneScoreRows || []).forEach((row) => {
        const locusId = String(row?.Locus_ID || "").trim();
        if (!locusId) {
            return;
        }
        let entry = byLocus.get(locusId);
        if (!entry) {
            const region = locusRegionFromScoreRow(row);
            entry = {
                locusId,
                locusNumber:
                    row?.Locus_Number != null &&
                    Number.isFinite(Number(row.Locus_Number))
                        ? Number(row.Locus_Number)
                        : null,
                region,
                regionLabel: region ? formatRegion(region) : locusId,
                genes: [],
            };
            byLocus.set(locusId, entry);
        }
        const symbol = String(row?.Gene || "").trim();
        if (!symbol) {
            return;
        }
        if (entry.genes.some((gene) => gene.symbol === symbol)) {
            return;
        }
        const trackGene = resolveTrackGene(symbol, trackLookup);
        entry.genes.push({
            symbol,
            scoreRow: row,
            trackGene,
            start: trackGene ? Number(trackGene.start) : null,
            end: trackGene ? Number(trackGene.end) : null,
            strand: trackGene?.strand ?? null,
        });
    });

    const loci = Array.from(byLocus.values())
        .map((entry) => {
            const region = entry.region;
            const locusVariants = variants.filter((row) => {
                if (!region) {
                    return false;
                }
                const chr = row?.chromosome ?? row?.chr;
                if (!sameChromosome(chr, region.chr)) {
                    return false;
                }
                return regionOverlapsPosition(region, associationPosition(row));
            });
            const lead = pickLeadVariantRow(locusVariants);
            let maxNegLog10P = 1;
            locusVariants.forEach((row) => {
                const pValue = associationPValue(row);
                if (pValue != null && pValue > 0) {
                    maxNegLog10P = Math.max(maxNegLog10P, -Math.log10(pValue));
                }
            });
            const genes = entry.genes
                .slice()
                .sort((a, b) => {
                    const aStart = Number.isFinite(a.start)
                        ? a.start
                        : Number.POSITIVE_INFINITY;
                    const bStart = Number.isFinite(b.start)
                        ? b.start
                        : Number.POSITIVE_INFINITY;
                    if (aStart !== bStart) {
                        return aStart - bStart;
                    }
                    return a.symbol.localeCompare(b.symbol);
                });
            return {
                ...entry,
                genes,
                variants: locusVariants,
                lead,
                maxNegLog10P,
            };
        })
        .sort((a, b) => {
            if (
                a.locusNumber != null &&
                b.locusNumber != null &&
                a.locusNumber !== b.locusNumber
            ) {
                return a.locusNumber - b.locusNumber;
            }
            const aStart = Number(a.region?.start);
            const bStart = Number(b.region?.start);
            if (Number.isFinite(aStart) && Number.isFinite(bStart)) {
                return aStart - bStart;
            }
            return String(a.locusId).localeCompare(String(b.locusId));
        });

    return {
        loci,
        evidenceRows: GP2_LOCUS_SUMMARY_EVIDENCE_ROWS,
        variantCount: variants.length,
        pMax,
        primaryAncestry: ancestry,
        phenotypeName,
    };
}

export function locusSummarySessionAncestry(searchSession) {
    return primaryAssociationAncestry(searchSession);
}

export function formatLocusSummaryVariantLabel(row) {
    if (!row) {
        return "";
    }
    const rs = String(row.rsID || row.dbSNP || "").trim();
    if (rs) {
        return rs;
    }
    const id = String(row["Variant ID"] || row.varId || "").trim();
    if (!id) {
        return "Lead";
    }
    // Shorten long allele strings for the diamond label.
    if (id.length > 28) {
        return `${id.slice(0, 26)}…`;
    }
    return id;
}

export function locusSummaryEvidenceCell(scoreRow, evidenceRow) {
    if (!scoreRow || !evidenceRow) {
        return { display: "—", value: null, kind: evidenceRow?.kind || "text" };
    }
    const raw = scoreRow[evidenceRow.field];
    if (raw == null || raw === "") {
        return { display: "—", value: null, kind: evidenceRow.kind };
    }
    if (evidenceRow.kind === "category") {
        return {
            display: String(raw),
            value: String(raw),
            kind: "category",
        };
    }
    const number = Number(raw);
    if (!Number.isFinite(number)) {
        return { display: String(raw), value: null, kind: evidenceRow.kind };
    }
    if (evidenceRow.kind === "score") {
        const rounded = Math.round(number * 1000) / 1000;
        return { display: String(rounded), value: number, kind: "score" };
    }
    const rounded = Math.round(number * 1000) / 1000;
    return { display: String(rounded), value: number, kind: "norm" };
}

/** Green intensity for 0–1 normalized cells. */
export function locusSummaryNormColor(value) {
    if (value == null || !Number.isFinite(Number(value))) {
        return "#f3f4f6";
    }
    const t = Math.max(0, Math.min(1, Number(value)));
    const lightness = 90 - t * 48;
    return `hsl(142, 42%, ${lightness}%)`;
}

export function locusSummaryCategoryColor(category) {
    const key = String(category || "").toLowerCase();
    if (key === "high") {
        return "hsl(142, 42%, 42%)";
    }
    if (key === "medium") {
        return "hsl(142, 38%, 62%)";
    }
    if (key === "low") {
        return "hsl(142, 28%, 78%)";
    }
    return "#e8eaed";
}
