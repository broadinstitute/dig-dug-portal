/**
 * GP2 Browser "Generate AI summary" action.
 *
 * There is no credible-set / fine-mapping data available for GP2 Browser, so
 * "linked" vs "unlinked" is derived only from pairwise LD (r²) to the lead
 * GWAS variant, reusing the same LD server call (`gp2BrowserLdServer.js`)
 * that drives the Associations plot's LD dot colors. All numeric reduction
 * (lead-variant selection, LD bucketing, gene grouping) happens in plain JS
 * before anything is sent to the LLM — the model only turns an already-built
 * digest into prose, it never scans raw rows itself.
 */
import { createLLMClient } from "@/utils/llmClient";
import { parseLlmJsonResponse } from "@/utils/llmUsageUtils";
import {
    fetchLdScoreMap,
    lookupLdScore,
    pickLeadVariantRow,
} from "./gp2BrowserLdServer.js";

export const GP2_AI_SUMMARY_LD_HIGH_R2 = 0.8;
export const GP2_AI_SUMMARY_LD_MODERATE_R2 = 0.2;
/** A gene's QTL evidence is only included if its best lead-linked hit clears this nominal p-value. */
export const GP2_AI_SUMMARY_QTL_INCLUDE_PVALUE = 0.05;
export const GP2_AI_SUMMARY_LLM_PROVIDER = "bedrock";

export function gp2AiSummaryLdBucket(r2) {
    if (r2 == null || Number.isNaN(Number(r2))) {
        return "no-data";
    }
    if (r2 >= GP2_AI_SUMMARY_LD_HIGH_R2) {
        return "high";
    }
    if (r2 >= GP2_AI_SUMMARY_LD_MODERATE_R2) {
        return "moderate";
    }
    return "unlinked";
}

/** Tag rows with `_ld` (r² to the lead variant, or null) and `_ldBucket`. */
export function tagRowsWithLd(rows, scoreMap) {
    return (rows || []).map((row) => {
        const r2 = lookupLdScore(scoreMap, row);
        return { ...row, _ld: r2 != null ? Number(r2) : null, _ldBucket: gp2AiSummaryLdBucket(r2) };
    });
}

function round(value, digits = 4) {
    if (value == null || Number.isNaN(Number(value))) {
        return null;
    }
    const factor = 10 ** digits;
    return Math.round(Number(value) * factor) / factor;
}

/**
 * Genes whose actual exon coordinates contain `position` — computed from
 * real gene-track data (already loaded for the Genes section), not inferred.
 * This is the authoritative source for "which gene does this coding variant
 * affect", since a GWAS row's "nearest" field is only nearest-TSS proximity
 * and can disagree with (or simply not be) the gene whose exon the variant
 * actually falls in.
 */
export function findExonOverlapGenes(position, genes) {
    if (position == null || !Array.isArray(genes) || !genes.length) {
        return [];
    }
    const pos = Number(position);
    const names = new Set();
    genes.forEach((gene) => {
        const exons = Array.isArray(gene?.exons) ? gene.exons : [];
        const hit = exons.some(
            (exon) => pos >= Number(exon.start) && pos <= Number(exon.end)
        );
        if (hit && gene.gene_name) {
            names.add(gene.gene_name);
        }
    });
    return Array.from(names);
}

function variantSummary(row, r2, genes) {
    if (!row) {
        return null;
    }
    return {
        varId: row.varId || null,
        dbSNP: row.dbSNP || null,
        position: row.position != null ? Number(row.position) : null,
        pValue: row.pValue != null ? Number(row.pValue) : null,
        beta: round(row.beta, 4),
        stdErr: round(row.stdErr, 4),
        maf: round(row.maf, 4),
        consequence: row.consequence || null,
        nearestGenes: Array.isArray(row.nearest) ? row.nearest : [],
        consequenceGenes: findExonOverlapGenes(row.position, genes),
        r2: round(r2 != null ? r2 : row._ld, 3),
    };
}

/** `{gene: biotype}` for genes actually referenced somewhere in the digest. */
function geneBiotypeLookup(geneNames, genes) {
    if (!geneNames.size || !Array.isArray(genes) || !genes.length) {
        return {};
    }
    const biotypeByName = new Map();
    genes.forEach((gene) => {
        if (gene?.gene_name && !biotypeByName.has(gene.gene_name)) {
            biotypeByName.set(gene.gene_name, gene.gene_type || gene.type || null);
        }
    });
    const result = {};
    geneNames.forEach((name) => {
        if (biotypeByName.has(name)) {
            result[name] = biotypeByName.get(name);
        }
    });
    return result;
}

/**
 * Pure, deterministic digest builder — no network, no LLM. `associationRows`
 * and `qtlRows` must already carry `_ld`/`_ldBucket` from `tagRowsWithLd`.
 */
export function buildGp2AiSummaryDigest({
    region,
    leadRow,
    associationRows = [],
    qtlRows = [],
    genes = [],
}) {
    const leadVarId = leadRow?.varId || null;
    const lead = variantSummary(leadRow, 1, genes);

    const highLdRows = associationRows.filter(
        (row) => row._ldBucket === "high" && row.varId !== leadVarId
    );
    const highLdVariants = [
        lead,
        ...highLdRows.map((row) => variantSummary(row, row._ld, genes)),
    ].filter(Boolean);
    const positions = highLdVariants
        .map((variant) => variant.position)
        .filter((position) => position != null)
        .sort((a, b) => a - b);

    const highLdCluster = {
        r2Threshold: GP2_AI_SUMMARY_LD_HIGH_R2,
        variantCount: highLdVariants.length,
        span: positions.length
            ? { start: positions[0], end: positions[positions.length - 1] }
            : null,
        missenseVariants: highLdVariants.filter(
            (variant) => variant.consequence === "missense_variant"
        ),
    };

    const moderateLdMissense = associationRows
        .filter((row) => row._ldBucket === "moderate" && row.consequence === "missense_variant")
        .map((row) => variantSummary(row, row._ld, genes));

    const byGeneTissue = new Map();
    qtlRows.forEach((row) => {
        const key = `${row.gene || "?"}|${row.region || row.tissue || "?"}`;
        if (!byGeneTissue.has(key)) {
            byGeneTissue.set(key, {
                gene: row.gene || null,
                tissue: row.region || row.tissue || null,
                byBucket: {},
            });
        }
        const entry = byGeneTissue.get(key);
        const current = entry.byBucket[row._ldBucket];
        if (!current || row.pValue < current.pValue) {
            entry.byBucket[row._ldBucket] = row;
        }
    });

    const qtlByGene = [];
    byGeneTissue.forEach((entry) => {
        const linked = ["high", "moderate"]
            .map((bucket) => entry.byBucket[bucket])
            .filter(Boolean)
            .sort((a, b) => a.pValue - b.pValue)[0];
        if (!linked || linked.pValue > GP2_AI_SUMMARY_QTL_INCLUDE_PVALUE) {
            return;
        }
        const other = ["unlinked", "no-data"]
            .map((bucket) => entry.byBucket[bucket])
            .filter(Boolean)
            .sort((a, b) => a.pValue - b.pValue)[0];

        qtlByGene.push({
            gene: entry.gene,
            tissue: entry.tissue,
            linkedToLead: variantSummary(linked, linked._ld),
            strongerUnlinkedSignal: other ? variantSummary(other, other._ld) : null,
        });
    });
    qtlByGene.sort((a, b) => a.linkedToLead.pValue - b.linkedToLead.pValue);

    const referencedGeneNames = new Set();
    [...highLdVariants, ...moderateLdMissense].forEach((variant) => {
        (variant.nearestGenes || []).forEach((name) => referencedGeneNames.add(name));
        (variant.consequenceGenes || []).forEach((name) => referencedGeneNames.add(name));
    });
    qtlByGene.forEach((entry) => {
        if (entry.gene) {
            referencedGeneNames.add(entry.gene);
        }
    });

    return {
        region: region ? { chr: region.chr, start: region.start, end: region.end } : null,
        leadVariant: lead,
        highLdCluster,
        moderateLdMissense,
        qtlByGene,
        /** Biotype for every gene named above, from real gene-track data (not inferred). */
        geneAnnotations: geneBiotypeLookup(referencedGeneNames, genes),
        ldCoverage: {
            totalQtlRows: qtlRows.length,
            matchedQtlRows: qtlRows.filter((row) => row._ld != null).length,
        },
    };
}

export const GP2_AI_SUMMARY_SYSTEM_PROMPT = `You write a short scientific summary of a Parkinson's disease GWAS locus for a researcher, using only the structured data you are given.
Rules:
- Use only the facts and numbers in the provided JSON digest. Never invent, estimate, or recompute a number (p-value, beta, r2, position) that is not explicitly given.
- There is no fine-mapping / credible-set data available for this locus. "Linked" and "unlinked" are based only on pairwise LD (r2) to the lead GWAS variant: high (r2>=0.8), moderate (0.2<=r2<0.8), or unlinked/no-data (r2<0.2 or unavailable). Use hedged language ("shows high LD with", "appears unlinked to the lead variant") rather than asserting a single confirmed haplotype or credible set.
- Each variant has two gene fields: "nearestGenes" is only nearest-TSS proximity, while "consequenceGenes" is computed from real exon coordinates (which gene's exon the variant position actually falls in) and is authoritative for missense/coding consequences. Prefer "consequenceGenes" when stating which gene a missense/coding variant affects; if it disagrees with "nearestGenes" or is empty, say so explicitly rather than guessing. "geneAnnotations" gives each referenced gene's biotype (e.g. protein_coding) from real gene-track data.
- "summary": one paragraph (3-6 sentences) stating the lead variant, the LD cluster it anchors, any missense/coding variants found (with their LD to the lead variant), and the clearest linked-vs-unlinked QTL contrast(s) present in qtlByGene.
- "recommendedNextSteps": 2-4 sentences naming only what this LD-based analysis specifically could not resolve (e.g. whether the LD cluster is one or multiple causal signals, which gene a missense variant actually affects, whether a linked QTL effect colocalizes with the GWAS signal) and the concrete follow-up analysis for each (e.g. SuSiE/SuSiEx fine-mapping, VEP/transcript annotation review, coloc/coloc.susie). Do not give generic advice unrelated to what this digest left unresolved.
Respond with JSON only: {"summary": "...", "recommendedNextSteps": "..."}`;

export function buildGp2AiSummaryUserPrompt(digest, session) {
    const phenotype = session?.phenotype?.name || "the searched phenotype";
    const ancestry = session?.ancestry || "Mixed";
    return [
        `Phenotype: ${phenotype}. Ancestry: ${ancestry}.`,
        `Locus digest (JSON): ${JSON.stringify(digest)}`,
        'Respond with JSON only: {"summary":"...","recommendedNextSteps":"..."}',
    ].join("\n");
}

function callGp2AiSummaryLlm({ systemPrompt, userPrompt }) {
    return new Promise((resolve, reject) => {
        const client = createLLMClient({
            llm: GP2_AI_SUMMARY_LLM_PROVIDER,
            expectJson: true,
            system_prompt: systemPrompt,
        });
        client.sendPrompt({
            userPrompt,
            onResponse: (raw) => resolve(raw),
            onError: (err) =>
                reject(err instanceof Error ? err : new Error(String(err || "AI summary request failed"))),
        });
    });
}

export function parseGp2AiSummaryResponse(raw) {
    const { ok, json } = parseLlmJsonResponse(raw);
    if (!ok || !json || typeof json !== "object") {
        return null;
    }
    const summary = String(json.summary || "").trim();
    const recommendedNextSteps = String(json.recommendedNextSteps || "").trim();
    if (!summary) {
        return null;
    }
    return { summary, recommendedNextSteps };
}

/** Combine the two LLM-produced sections into the single thread-entry message. */
export function formatGp2AiSummaryMessage({ summary, recommendedNextSteps }) {
    const parts = [summary];
    if (recommendedNextSteps) {
        parts.push(`Recommended Next Steps: ${recommendedNextSteps}`);
    }
    return parts.join("\n\n");
}

/**
 * LD fetch -> digest, no LLM call. Shared by `fetchGp2AiSummary` and by the
 * Literature evidence action, which reuses this digest (lead variant,
 * exon-resolved consequence genes, linked-vs-unlinked QTL contrasts) to pick
 * which genes to search PubMed for, without depending on the AI summary
 * action itself having been run.
 * Returns `{ ok: false, reason: "no-data" | "no-ld" }` when a digest cannot
 * be produced (e.g. LD scores unavailable for the lead variant).
 */
export async function resolveGp2AiSummaryDigest({
    session,
    region,
    associationRows = [],
    qtlRows = [],
    genes = [],
}) {
    const activeRegion = region || session?.region;
    if (!Array.isArray(associationRows) || !associationRows.length || !activeRegion) {
        return { ok: false, reason: "no-data" };
    }

    const leadRow = pickLeadVariantRow(associationRows);
    if (!leadRow) {
        return { ok: false, reason: "no-data" };
    }

    const { scoreMap } = await fetchLdScoreMap(associationRows, session, activeRegion);
    if (!scoreMap || !scoreMap.size) {
        return { ok: false, reason: "no-ld" };
    }

    const taggedAssoc = tagRowsWithLd(associationRows, scoreMap);
    const taggedQtl = tagRowsWithLd(qtlRows, scoreMap);

    const digest = buildGp2AiSummaryDigest({
        region: activeRegion,
        leadRow,
        associationRows: taggedAssoc,
        qtlRows: taggedQtl,
        genes,
    });

    return { ok: true, digest };
}

/**
 * Orchestrates the full action: digest -> LLM -> parsed result.
 * Returns `{ ok: false, reason: "no-data" | "no-ld" | "llm-error", error? }`
 * when a summary cannot be produced — callers should surface that reason,
 * never fall back to an ungrounded summary.
 */
export async function fetchGp2AiSummary({
    session,
    region,
    associationRows = [],
    qtlRows = [],
    genes = [],
}) {
    const resolved = await resolveGp2AiSummaryDigest({
        session,
        region,
        associationRows,
        qtlRows,
        genes,
    });
    if (!resolved.ok) {
        return resolved;
    }
    const { digest } = resolved;

    let raw;
    try {
        raw = await callGp2AiSummaryLlm({
            systemPrompt: GP2_AI_SUMMARY_SYSTEM_PROMPT,
            userPrompt: buildGp2AiSummaryUserPrompt(digest, session),
        });
    } catch (error) {
        return { ok: false, reason: "llm-error", error };
    }

    const parsed = parseGp2AiSummaryResponse(raw);
    if (!parsed) {
        return { ok: false, reason: "llm-error" };
    }

    return { ok: true, digest, ...parsed };
}
