/**
 * GP2 Browser "Literature evidence" panel (Tools menu).
 *
 * Searches PubMed (NCBI E-utilities — esearch/esummary/efetch, no API key,
 * CORS-enabled) for the phenotype plus the genes this locus's AI-summary
 * digest already identified as relevant (lead variant, exon-resolved
 * missense genes, linked-vs-unlinked QTL contrasts) — reusing that pure
 * digest-building logic directly, not the AI summary action's LLM call, so
 * this panel doesn't depend on "Generate AI summary" having been run — and
 * unions in every gene from the Gene scores section for the search region.
 * If LD scores aren't available (the one thing that blocks the digest), falls
 * back to a simpler gene set (lead variant's exon-resolved gene(s) plus the
 * most significant QTL genes) and skips locus-specific cross-referencing.
 *
 * Abstract-only (no PMC full text) for this version.
 */
import { createLLMClient } from "@/utils/llmClient";
import { parseLlmJsonResponse } from "@/utils/llmUsageUtils";
import { pickLeadVariantRow } from "./gp2BrowserLdServer.js";
import {
    GP2_AI_SUMMARY_QTL_INCLUDE_PVALUE,
    associationRowNearest,
    associationRowPosition,
    findExonOverlapGenes,
    resolveGp2AiSummaryDigest,
} from "./gp2BrowserAiSummary.js";

const PUBMED_BASE_URL = "https://eutils.ncbi.nlm.nih.gov/entrez/eutils";
/** First PubMed page size for a new LE run. */
export const GP2_LITERATURE_INITIAL_LIMIT = 30;
/** Page size for each "Show next 15" load-more request. */
export const GP2_LITERATURE_RESULT_LIMIT = 15;
export const GP2_LITERATURE_LLM_PROVIDER = "bedrock";
export const GP2_LITERATURE_ABSTRACT_MAX_CHARS = 2000;

/** GP2 Browser only searches Parkinson's today; extend as more phenotypes are added. */
const GP2_PHENOTYPE_PUBMED_SYNONYMS = {
    Parkinsons: ["Parkinson Disease", "Parkinson's Disease"],
};

function pubmedTermPart(text) {
    const value = String(text || "").trim();
    if (!value) {
        return null;
    }
    return /\s/.test(value) ? `"${value}"[Title/Abstract]` : `${value}[Title/Abstract]`;
}

export function phenotypePubmedSynonyms(phenotype) {
    const name = String(phenotype || "").trim();
    if (!name) {
        return [];
    }
    return GP2_PHENOTYPE_PUBMED_SYNONYMS[name] || [name];
}

/**
 * PubMed Title/Abstract query: phenotype AND (genes OR variants).
 * Variants are optional — AI-off mode may pass only the lead rsID.
 */
export function buildGp2PubmedQueryTerm({ phenotype, genes, variants = [] }) {
    const phenotypeParts = phenotypePubmedSynonyms(phenotype)
        .map(pubmedTermPart)
        .filter(Boolean);
    const geneParts = Array.from(new Set(genes || []))
        .map(pubmedTermPart)
        .filter(Boolean);
    const variantParts = Array.from(new Set(variants || []))
        .map((value) => String(value || "").trim())
        .filter(Boolean)
        .map(pubmedTermPart)
        .filter(Boolean);
    const entityParts = [...geneParts, ...variantParts];
    if (!phenotypeParts.length || !entityParts.length) {
        return null;
    }
    return `(${phenotypeParts.join(" OR ")}) AND (${entityParts.join(" OR ")})`;
}

/** Lead association row → PubMed/search display terms (rsID preferred). */
export function leadVariantSearchTerms(associationRows = []) {
    const lead = pickLeadVariantRow(associationRows);
    if (!lead) {
        return [];
    }
    const terms = [];
    const rs = String(lead.rsID || lead.dbSNP || "").trim();
    const varId = String(lead["Variant ID"] || lead.varId || "").trim();
    if (rs) {
        terms.push(rs);
    } else if (varId) {
        terms.push(varId);
    }
    return terms;
}

/**
 * AI-off LE gene plan: Gene scores symbols only (lead is a separate variant term).
 */
export function geneSearchPlanFromGeneScores(geneScoreRows = []) {
    const genes = geneNamesFromGeneScoreRows(geneScoreRows);
    const geneReasons = genes.map((gene) => ({
        gene,
        reasons: ["Gene scores for this region"],
    }));
    return { genes, geneReasons };
}

/** Terms to mark in AI-off paper abstracts (genes, lead, phenotype synonyms). */
export function buildGp2LiteratureHighlightTerms({
    genes = [],
    variants = [],
    phenotype = null,
} = {}) {
    const terms = [];
    const seen = new Set();
    const push = (value) => {
        const text = String(value || "").trim();
        if (!text) {
            return;
        }
        const key = text.toLowerCase();
        if (seen.has(key)) {
            return;
        }
        seen.add(key);
        terms.push(text);
    };
    (genes || []).forEach(push);
    (variants || []).forEach(push);
    phenotypePubmedSynonyms(phenotype).forEach(push);
    // Longer terms first so "Parkinson's Disease" wins over "Parkinson".
    return terms.sort((a, b) => b.length - a.length);
}

function formatCompactPValue(value) {
    if (value == null || Number.isNaN(Number(value))) {
        return null;
    }
    const number = Number(value);
    if (number === 0) {
        return "0";
    }
    if (number >= 0.001) {
        return String(Number(number.toPrecision(3)));
    }
    return number.toExponential(2);
}

function variantDisplayName(variant) {
    if (!variant) {
        return "variant";
    }
    return variant.dbSNP || variant.varId || "variant";
}

function addGeneReason(byGene, gene, reason) {
    const name = String(gene || "").trim();
    const why = String(reason || "").trim();
    if (!name || !why) {
        return;
    }
    if (!byGene.has(name)) {
        byGene.set(name, new Set());
    }
    byGene.get(name).add(why);
}

function addVariantGeneReasons(byGene, variant, roleLabel) {
    if (!variant) {
        return;
    }
    const label = variantDisplayName(variant);
    const role = roleLabel || "variant";
    (variant.consequenceGenes || []).forEach((gene) => {
        addGeneReason(byGene, gene, `Exon overlap with ${role} ${label}`);
    });
    (variant.nearestGenes || []).forEach((gene) => {
        addGeneReason(byGene, gene, `Nearest gene to ${role} ${label}`);
    });
}

/**
 * Why each PubMed search gene was pulled from the structured locus digest
 * (deterministic associations/LD/QTL facts — not the AI-summary LLM prose).
 */
export function geneSearchPlanFromAiSummaryDigest(digest) {
    const byGene = new Map();
    if (!digest) {
        return { genes: [], geneReasons: [] };
    }

    addVariantGeneReasons(byGene, digest.leadVariant, "lead");

    (digest.highLdCluster?.missenseVariants || []).forEach((variant) => {
        if (variant?.varId && variant.varId === digest.leadVariant?.varId) {
            return;
        }
        addVariantGeneReasons(byGene, variant, "high-LD missense");
    });

    (digest.moderateLdMissense || []).forEach((variant) => {
        addVariantGeneReasons(byGene, variant, "moderate-LD missense");
    });

    (digest.qtlByGene || []).forEach((entry) => {
        if (!entry?.gene) {
            return;
        }
        const tissue = entry.tissue || "tissue";
        const pValue = formatCompactPValue(entry.linkedToLead?.pValue);
        const r2 = entry.linkedToLead?.r2;
        const parts = [`QTL in ${tissue} linked to lead`];
        if (pValue) {
            parts.push(`p=${pValue}`);
        }
        if (r2 != null) {
            parts.push(`r²=${r2}`);
        }
        addGeneReason(byGene, entry.gene, parts.join(", "));
    });

    const geneReasons = Array.from(byGene.entries())
        .map(([gene, reasons]) => ({
            gene,
            reasons: Array.from(reasons),
        }))
        .sort((a, b) => a.gene.localeCompare(b.gene));

    return {
        genes: geneReasons.map((entry) => entry.gene),
        geneReasons,
    };
}

/** Genes referenced anywhere in an AI-summary digest (variants + QTL hits). */
export function geneNamesFromAiSummaryDigest(digest) {
    return geneSearchPlanFromAiSummaryDigest(digest).genes;
}

/** Unique gene symbols from Gene scores (`gene-scoring`) rows. */
export function geneNamesFromGeneScoreRows(rows = []) {
    const names = new Set();
    (rows || []).forEach((row) => {
        const symbol = String(row?.Gene || row?.gene || row?.symbol || "").trim();
        if (symbol) {
            names.add(symbol);
        }
    });
    return Array.from(names).sort((a, b) => a.localeCompare(b));
}

/**
 * Union digest/fallback search genes with Gene scores symbols. Existing
 * reason lists are preserved; score-only genes get a Gene scores reason.
 */
export function mergeGeneSearchPlanWithGeneScores(plan, geneScoreRows = []) {
    const byGene = new Map();
    (plan?.geneReasons || []).forEach((entry) => {
        const gene = entry?.gene;
        const reasons = entry?.reasons || [];
        if (reasons.length) {
            reasons.forEach((reason) => {
                addGeneReason(byGene, gene, reason);
            });
        } else {
            addGeneReason(byGene, gene, "Locus digest");
        }
    });
    (plan?.genes || []).forEach((gene) => {
        if (!byGene.has(String(gene || "").trim())) {
            addGeneReason(byGene, gene, "Locus digest");
        }
    });
    geneNamesFromGeneScoreRows(geneScoreRows).forEach((gene) => {
        addGeneReason(byGene, gene, "Gene scores for this region");
    });

    const geneReasons = Array.from(byGene.entries())
        .map(([gene, reasons]) => ({
            gene,
            reasons: Array.from(reasons),
        }))
        .sort((a, b) => a.gene.localeCompare(b.gene));

    return {
        genes: geneReasons.map((entry) => entry.gene),
        geneReasons,
    };
}

/**
 * Human-readable locus findings from the structured digest (data facts only).
 * Returns bullet strings for the LE panel / assistant thread.
 */
export function describeGp2LocusDigestFindings(digest) {
    if (!digest?.leadVariant) {
        return [];
    }
    const bullets = [];
    const lead = digest.leadVariant;
    const leadName = variantDisplayName(lead);
    const leadBits = [`Lead variant ${leadName}`];
    if (lead.pValue != null) {
        leadBits.push(`p=${formatCompactPValue(lead.pValue)}`);
    }
    if (lead.consequence) {
        leadBits.push(String(lead.consequence).replace(/_/g, " "));
    }
    const leadGenes = [
        ...(lead.consequenceGenes || []),
        ...(lead.nearestGenes || []),
    ].filter(Boolean);
    if (leadGenes.length) {
        leadBits.push(`genes ${Array.from(new Set(leadGenes)).join(", ")}`);
    }
    bullets.push(`${leadBits.join(" — ")}.`);

    const cluster = digest.highLdCluster;
    if (cluster) {
        const missenseCount = (cluster.missenseVariants || []).length;
        let clusterText = `High-LD cluster (r²≥${cluster.r2Threshold}): ${
            cluster.variantCount || 0
        } variant${cluster.variantCount === 1 ? "" : "s"}`;
        if (missenseCount) {
            clusterText += `, ${missenseCount} missense`;
        }
        if (cluster.span?.start != null && cluster.span?.end != null) {
            clusterText += `, span ${cluster.span.start.toLocaleString()}-${cluster.span.end.toLocaleString()}`;
        }
        bullets.push(`${clusterText}.`);
    }

    const moderate = digest.moderateLdMissense || [];
    if (moderate.length) {
        const names = moderate.map(variantDisplayName).slice(0, 4);
        const more = moderate.length > names.length ? ` (+${moderate.length - names.length} more)` : "";
        bullets.push(
            `Moderate-LD missense (0.2≤r²<0.8): ${names.join(", ")}${more}.`
        );
    }

    const qtl = digest.qtlByGene || [];
    if (qtl.length) {
        const top = qtl.slice(0, 4).map((entry) => {
            const pValue = formatCompactPValue(entry.linkedToLead?.pValue);
            const tissue = entry.tissue || "tissue";
            return pValue ? `${entry.gene} (${tissue}, p=${pValue})` : `${entry.gene} (${tissue})`;
        });
        const more = qtl.length > top.length ? ` (+${qtl.length - top.length} more)` : "";
        bullets.push(`Lead-linked QTL signals: ${top.join("; ")}${more}.`);
    }

    return bullets;
}

/** Used only when the AI-summary digest can't be resolved (no LD data). */
export function fallbackGeneNames({ associationRows = [], qtlRows = [], genes = [] }) {
    const names = new Set();
    const leadRow = pickLeadVariantRow(associationRows);
    if (leadRow) {
        associationRowNearest(leadRow).forEach((name) => names.add(name));
        findExonOverlapGenes(associationRowPosition(leadRow), genes).forEach((name) =>
            names.add(name)
        );
    }

    const bestPValueByGene = new Map();
    qtlRows.forEach((row) => {
        if (!row?.gene || row.pValue == null) {
            return;
        }
        const current = bestPValueByGene.get(row.gene);
        if (current == null || row.pValue < current) {
            bestPValueByGene.set(row.gene, row.pValue);
        }
    });
    Array.from(bestPValueByGene.entries())
        .filter(([, pValue]) => pValue <= GP2_AI_SUMMARY_QTL_INCLUDE_PVALUE)
        .sort((a, b) => a[1] - b[1])
        .slice(0, 5)
        .forEach(([gene]) => names.add(gene));

    return Array.from(names);
}

async function fetchPubmedEsearch(term, limit = GP2_LITERATURE_RESULT_LIMIT, retstart = 0) {
    const url = `${PUBMED_BASE_URL}/esearch.fcgi?db=pubmed&retmode=json&retmax=${limit}&retstart=${retstart}&sort=relevance&term=${encodeURIComponent(
        term
    )}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`PubMed esearch returned HTTP ${resp.status}.`);
    }
    const json = await resp.json();
    const ids = json?.esearchresult?.idlist;
    return Array.isArray(ids) ? ids : [];
}

async function fetchPubmedEsummary(pmids) {
    if (!pmids.length) {
        return [];
    }
    const url = `${PUBMED_BASE_URL}/esummary.fcgi?db=pubmed&retmode=json&id=${pmids.join(",")}`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`PubMed esummary returned HTTP ${resp.status}.`);
    }
    const json = await resp.json();
    const result = json?.result || {};
    return pmids
        .filter((id) => result[id])
        .map((id) => {
            const row = result[id];
            return {
                pmid: id,
                title: row.title || "",
                journal: row.fulljournalname || row.source || "",
                pubdate: row.pubdate || "",
                authors: Array.isArray(row.authors)
                    ? row.authors.map((author) => author.name).filter(Boolean)
                    : [],
            };
        });
}

function parseAbstractXml(xmlText) {
    const doc = new DOMParser().parseFromString(xmlText, "text/xml");
    const abstractsByPmid = new Map();
    Array.from(doc.getElementsByTagName("PubmedArticle")).forEach((article) => {
        const pmidNode = article.getElementsByTagName("PMID")[0];
        const pmid = pmidNode ? pmidNode.textContent.trim() : null;
        if (!pmid) {
            return;
        }
        const text = Array.from(article.getElementsByTagName("AbstractText"))
            .map((node) => {
                const label = node.getAttribute("Label");
                const content = node.textContent || "";
                return label ? `${label}: ${content}` : content;
            })
            .join(" ")
            .trim();
        abstractsByPmid.set(pmid, text);
    });
    return abstractsByPmid;
}

async function fetchPubmedAbstracts(pmids) {
    if (!pmids.length) {
        return new Map();
    }
    const url = `${PUBMED_BASE_URL}/efetch.fcgi?db=pubmed&id=${pmids.join(
        ","
    )}&rettype=abstract&retmode=xml`;
    const resp = await fetch(url);
    if (!resp.ok) {
        throw new Error(`PubMed efetch returned HTTP ${resp.status}.`);
    }
    return parseAbstractXml(await resp.text());
}

function trimAbstract(text, maxChars = GP2_LITERATURE_ABSTRACT_MAX_CHARS) {
    const value = String(text || "").trim();
    if (value.length <= maxChars) {
        return value;
    }
    return `${value.slice(0, maxChars)}…`;
}

export function buildGp2LiteratureDigest({ phenotype, geneNames, papers, locusDigest }) {
    // Stable PMID order so the synthesis LLM always sees the same paper sequence.
    const orderedPapers = [...(papers || [])].sort((a, b) =>
        String(a?.pmid || "").localeCompare(String(b?.pmid || ""), undefined, {
            numeric: true,
        })
    );
    return {
        phenotype,
        genesSearched: geneNames,
        papers: orderedPapers.map((paper) => ({
            pmid: paper.pmid,
            title: paper.title,
            journal: paper.journal,
            pubdate: paper.pubdate,
            abstract: trimAbstract(paper.abstract),
        })),
        locusDigest: locusDigest || null,
    };
}

export const GP2_LITERATURE_SYSTEM_PROMPT = `You extract grounded literature claims for a Parkinson's disease GWAS locus.
Same input must yield the same JSON. Be conservative, mechanical, and maximally granular — do not brainstorm or summarize at a high level.

Granularity (critical — apply to every claim and excerpt):
- ATOMIC CLAIMS: exactly one subject–predicate–object relationship per claim. Never combine two mechanisms, two targets, two phenotypes, or a mechanism-plus-phenotype into one claim.
- Split compound sentences. Example: if an abstract says FYN phosphorylates PKCδ and promotes microglial activation, emit TWO claims (phosphorylation; activation), each with its own excerpt.
- Prefer the most specific entity names in the abstract (e.g. "PKCδ phosphorylation at tyrosine 311", not "signaling"; "α-synuclein Ser129 phosphorylation", not "α-synuclein pathology").
- Do NOT roll several findings into a broad summary claim. If unsure whether to split, split.
- EXCERPTS MUST BE AS SHORT AS POSSIBLE while remaining a contiguous verbatim substring that supports that one claim. Prefer a clause or phrase (often 5–20 words) over a full sentence; never quote a whole abstract paragraph or multi-clause summary when a shorter span works.
- One primary excerpt per claim (extra excerpts only for independent-paper corroboration). Do not attach long multi-fact quotes to a single claim.

Determinism (follow exactly):
1. Process "papers" in the given array order. Never reorder papers.
2. Prefer searched genes over peripheral pathway members mentioned only as context — but if a peripheral molecule is the explicit object of a relationship with a searched gene, keep that granular edge as its own claim.
3. Prefer gene–phenotype and gene–mechanism relationships over drug/assay details unless those are the only finding.
4. Skip speculative, future-work, and background-review sentences that do not assert a concrete finding.
5. Cap: at most 16 claims, at most 24 excerpts, at most 6 gaps. Use the room to stay granular rather than merging.
6. Claim wording: one short factual sentence close to the abstract language. Template "<subject> <predicate> <object>" (e.g. "FYN phosphorylates PKCδ at tyrosine 311"). Do not embellish.
7. Do not invent synonyms or alternate gene/protein names (keep the exact symbol/name used in the abstract).
8. Excerpts must be verbatim substrings of that paper's "abstract" (exact characters aside from surrounding whitespace). No paraphrase, no ellipsis, no truncation mid-word. If several quotes work, take the earliest shortest occurrence in that abstract.
9. Number excerpts 1..N in the order claims first reference them. Reuse an excerpt number only when another claim cites the exact same quote span.
10. Order claims: (a) the required locusDigest coverage claim first when locusDigest is present; then (b) by ascending primary supporting PMID; then (c) by claim text A→Z for ties.
11. Order gaps by text A→Z.

Content rules:
- Use only "papers" abstracts and, if present, "locusDigest". Never invent a claim, excerpt, PMID, or fact.
- Every claim MUST cite ≥1 excerpt number; unsupported claims are discarded.
- Multi-paper corroboration: cite one short excerpt from each independent paper (ascending PMID).
- Mentions without relationship: if a paper names a searched gene and the phenotype but does not study their relationship, say so in its own claim (with excerpt) — do not treat it as gene–phenotype evidence.
- If "locusDigest" is present, claim #1 must state whether any paper discusses that specific locus finding (lead variant / exon-resolved missense gene / linked-vs-unlinked QTL) versus only general gene–phenotype relevance.
- Gaps: phrase as properties of THIS retrieved set ("The retrieved papers do not address X"). Empty excerptNumbers unless a specific paper's silence is the point. Prefer gaps about the searched genes, the lead variant, or QTL links — not generic PD biology.

Respond with JSON only: {"claims":[{"text":"...","excerptNumbers":[1]}],"excerpts":[{"number":1,"pmid":"...","quote":"..."}],"gaps":[{"text":"...","excerptNumbers":[]}]}`;

export function buildGp2LiteratureUserPrompt(digest) {
    return [
        `Phenotype: ${digest.phenotype}. Genes searched: ${digest.genesSearched.join(", ")}.`,
        "Extract claims/excerpts/gaps per the system rules. Same input → same JSON. Keep claims atomic and excerpts as short/verbatim as possible — never coarsen by merging findings.",
        `Papers and locus digest (JSON): ${JSON.stringify({
            papers: digest.papers,
            locusDigest: digest.locusDigest,
        })}`,
        'Respond with JSON only: {"claims":[{"text":"...","excerptNumbers":[1]}],"excerpts":[{"number":1,"pmid":"...","quote":"..."}],"gaps":[{"text":"...","excerptNumbers":[]}]}',
    ].join("\n");
}

function callGp2LiteratureLlm({ systemPrompt, userPrompt }) {
    return new Promise((resolve, reject) => {
        const client = createLLMClient({
            llm: GP2_LITERATURE_LLM_PROVIDER,
            expectJson: true,
            system_prompt: systemPrompt,
        });
        client.sendPrompt({
            userPrompt,
            onResponse: (raw) => resolve(raw),
            onError: (err) =>
                reject(
                    err instanceof Error ? err : new Error(String(err || "Literature evidence request failed"))
                ),
        });
    });
}

function normalizeForQuoteMatch(text) {
    return String(text || "")
        .toLowerCase()
        .replace(/\s+/g, " ")
        .trim();
}

function escapeHtmlForHighlight(text) {
    return String(text || "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

/**
 * Map a case/whitespace-insensitive quote onto original abstract indices.
 * Returns `{ start, end }` (end exclusive) or null when not found.
 */
export function findQuoteSpanInAbstract(abstract, quote) {
    const source = String(abstract || "");
    const needle = normalizeForQuoteMatch(quote);
    if (!source || !needle) {
        return null;
    }

    const normalizedChars = [];
    const indexMap = [];
    let pendingSpace = false;
    for (let i = 0; i < source.length; i++) {
        const ch = source[i];
        if (/\s/.test(ch)) {
            if (normalizedChars.length) {
                pendingSpace = true;
            }
            continue;
        }
        if (pendingSpace) {
            normalizedChars.push(" ");
            indexMap.push(i);
            pendingSpace = false;
        }
        normalizedChars.push(ch.toLowerCase());
        indexMap.push(i);
    }
    const normalized = normalizedChars.join("");
    const hit = normalized.indexOf(needle);
    if (hit < 0) {
        return null;
    }
    const start = indexMap[hit];
    const endIndex = indexMap[hit + needle.length - 1];
    if (start == null || endIndex == null) {
        return null;
    }
    return { start, end: endIndex + 1 };
}

/**
 * Escape abstract HTML and wrap the first matching quote span in a <mark>.
 * When `maxLength` is set (collapsed preview), keep a window that includes
 * the match when possible so the highlight stays visible.
 * Returns `{ html, matched }`.
 */
export function formatAbstractWithHighlightedQuote(
    abstract,
    quote,
    { maxLength = null, markClass = "gp2-lit-abstract-mark" } = {}
) {
    const source = String(abstract || "");
    if (!source) {
        return { html: "", matched: false };
    }

    const span = findQuoteSpanInAbstract(source, quote);
    let displayStart = 0;
    let displayEnd = source.length;
    let prefix = "";
    let suffix = "";

    if (maxLength != null && source.length > maxLength) {
        if (span) {
            const pad = Math.max(24, Math.floor((maxLength - (span.end - span.start)) / 2));
            displayStart = Math.max(0, span.start - pad);
            displayEnd = Math.min(source.length, displayStart + maxLength);
            if (displayEnd - displayStart < maxLength) {
                displayStart = Math.max(0, displayEnd - maxLength);
            }
            if (displayStart > 0) {
                prefix = "…";
            }
            if (displayEnd < source.length) {
                suffix = "…";
            }
        } else {
            displayEnd = maxLength;
            suffix = "…";
        }
    }

    const slice = source.slice(displayStart, displayEnd);
    if (!span || span.end <= displayStart || span.start >= displayEnd) {
        return {
            html: `${prefix}${escapeHtmlForHighlight(slice)}${suffix}`,
            matched: false,
        };
    }

    const localStart = Math.max(0, span.start - displayStart);
    const localEnd = Math.min(slice.length, span.end - displayStart);
    const before = escapeHtmlForHighlight(slice.slice(0, localStart));
    const match = escapeHtmlForHighlight(slice.slice(localStart, localEnd));
    const after = escapeHtmlForHighlight(slice.slice(localEnd));
    return {
        html: `${prefix}${before}<mark class="${markClass}">${match}</mark>${after}${suffix}`,
        matched: true,
    };
}

/**
 * Escape abstract HTML and wrap every non-overlapping match of `terms`
 * (genes, lead variant, phenotype) in <mark>. Longer terms win first.
 * Returns `{ html, matched }`.
 */
export function formatAbstractWithHighlightedTerms(
    abstract,
    terms = [],
    { markClass = "gp2-lit-abstract-mark" } = {}
) {
    const source = String(abstract || "");
    if (!source) {
        return { html: "", matched: false };
    }
    const needles = (terms || [])
        .map((term) => String(term || "").trim())
        .filter(Boolean)
        .sort((a, b) => b.length - a.length);
    if (!needles.length) {
        return { html: escapeHtmlForHighlight(source), matched: false };
    }

    const lower = source.toLowerCase();
    const ranges = [];
    needles.forEach((term) => {
        const needle = term.toLowerCase();
        let from = 0;
        while (from < lower.length) {
            const hit = lower.indexOf(needle, from);
            if (hit < 0) {
                break;
            }
            const end = hit + needle.length;
            const overlaps = ranges.some(
                (range) => hit < range.end && end > range.start
            );
            if (!overlaps) {
                ranges.push({ start: hit, end });
            }
            from = hit + needle.length;
        }
    });
    if (!ranges.length) {
        return { html: escapeHtmlForHighlight(source), matched: false };
    }
    ranges.sort((a, b) => a.start - b.start);

    let html = "";
    let cursor = 0;
    ranges.forEach((range) => {
        html += escapeHtmlForHighlight(source.slice(cursor, range.start));
        html += `<mark class="${markClass}">${escapeHtmlForHighlight(
            source.slice(range.start, range.end)
        )}</mark>`;
        cursor = range.end;
    });
    html += escapeHtmlForHighlight(source.slice(cursor));
    return { html, matched: true };
}

/**
 * Parses the LLM's claims/excerpts/gaps response and verifies every
 * excerpt is an actual verbatim substring of the paper it's attributed to
 * (whitespace-insensitive, case-insensitive) — an LLM can paraphrase instead
 * of quoting exactly despite instructions, and an unverifiable excerpt would
 * mislead the reader into trusting a quote that isn't really there. A quote
 * that doesn't verify is dropped, and any claim left with zero verified
 * excerpts is dropped with it (every claim must have a supporting excerpt).
 */
export function parseGp2LiteratureResponse(raw, { papers = [] } = {}) {
    const { ok, json } = parseLlmJsonResponse(raw);
    if (!ok || !json || typeof json !== "object") {
        return null;
    }

    const abstractByPmid = new Map(
        papers.map((paper) => [String(paper.pmid), normalizeForQuoteMatch(paper.abstract)])
    );

    const verifiedExcerptNumbers = new Set();
    const excerpts = (Array.isArray(json.excerpts) ? json.excerpts : [])
        .map((entry) => {
            const number = Number(entry?.number);
            const pmid = entry?.pmid != null ? String(entry.pmid) : "";
            const quote = String(entry?.quote || "").trim();
            if (!Number.isFinite(number) || !pmid || !quote) {
                return null;
            }
            const abstract = abstractByPmid.get(pmid);
            if (!abstract || !abstract.includes(normalizeForQuoteMatch(quote))) {
                return null;
            }
            verifiedExcerptNumbers.add(number);
            return { number, pmid, quote };
        })
        .filter(Boolean);

    const claims = (Array.isArray(json.claims) ? json.claims : [])
        .map((entry) => {
            const text = String(entry?.text || "").trim();
            const excerptNumbers = (
                Array.isArray(entry?.excerptNumbers) ? entry.excerptNumbers : []
            )
                .map((number) => Number(number))
                .filter((number) => verifiedExcerptNumbers.has(number));
            if (!text || !excerptNumbers.length) {
                return null;
            }
            return {
                text,
                excerptNumbers: [...new Set(excerptNumbers)].sort((a, b) => a - b),
            };
        })
        .filter(Boolean)
        .sort((a, b) => {
            const aMin = Math.min(...a.excerptNumbers);
            const bMin = Math.min(...b.excerptNumbers);
            if (aMin !== bMin) {
                return aMin - bMin;
            }
            return a.text.localeCompare(b.text);
        })
        .slice(0, 16);

    const gaps = (Array.isArray(json.gaps) ? json.gaps : [])
        .map((entry) => {
            const text = String(entry?.text || "").trim();
            if (!text) {
                return null;
            }
            const excerptNumbers = (
                Array.isArray(entry?.excerptNumbers) ? entry.excerptNumbers : []
            )
                .map((number) => Number(number))
                .filter((number) => verifiedExcerptNumbers.has(number));
            return {
                text,
                excerptNumbers: [...new Set(excerptNumbers)].sort((a, b) => a - b),
            };
        })
        .filter(Boolean)
        .sort((a, b) => a.text.localeCompare(b.text))
        .slice(0, 6);

    if (!claims.length && !gaps.length) {
        return null;
    }

    const citedExcerptNumbers = new Set([
        ...claims.flatMap((claim) => claim.excerptNumbers),
        ...gaps.flatMap((gap) => gap.excerptNumbers),
    ]);
    const citedExcerpts = excerpts
        .filter((excerpt) => citedExcerptNumbers.has(excerpt.number))
        .sort((a, b) => a.number - b.number || String(a.pmid).localeCompare(String(b.pmid)))
        .slice(0, 24);
    return {
        claims,
        excerpts: citedExcerpts,
        gaps,
    };
}

/**
 * esearch (one page of PMIDs, offset by `retstart`) + esummary + efetch
 * abstracts for an already-built query term. Used both for the first page
 * (inside {@link fetchGp2LiteraturePapers}, default
 * {@link GP2_LITERATURE_INITIAL_LIMIT}) and for "Show next 15" pages
 * ({@link GP2_LITERATURE_RESULT_LIMIT}), which reuse the same term/gene set
 * rather than re-resolving genes.
 * Returns `{ ok: false, reason: "fetch-error", error }` or `{ ok: true, papers }`.
 */
export async function fetchGp2LiteraturePapersPage(
    term,
    { retstart = 0, limit = GP2_LITERATURE_RESULT_LIMIT } = {}
) {
    let pmids;
    try {
        pmids = await fetchPubmedEsearch(term, limit, retstart);
    } catch (error) {
        return { ok: false, reason: "fetch-error", error };
    }

    if (!pmids.length) {
        return { ok: true, papers: [] };
    }

    let summaries;
    let abstractsByPmid;
    try {
        [summaries, abstractsByPmid] = await Promise.all([
            fetchPubmedEsummary(pmids),
            fetchPubmedAbstracts(pmids),
        ]);
    } catch (error) {
        return { ok: false, reason: "fetch-error", error };
    }

    const papers = summaries.map((paper) => ({
        ...paper,
        abstract: abstractsByPmid.get(paper.pmid) || "",
    }));

    return { ok: true, papers };
}

/**
 * Phase 1: resolve genes -> PubMed search -> abstracts. No LLM call, so the
 * caller can render the paper list immediately and run phase 2 separately.
 * Returns `{ ok: false, reason: "no-data" | "no-genes" | "fetch-error", error? }`.
 * A query that matches zero papers is `ok: true` with an empty `papers`
 * array — that's a valid, informative result, not a failure.
 */
export async function fetchGp2LiteraturePapers({
    session,
    region,
    associationRows = [],
    qtlRows = [],
    genes = [],
    geneScoreRows = [],
    aiSupport = true,
}) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return { ok: false, reason: "no-data" };
    }

    let geneNames;
    let geneReasons = [];
    let digestFindings = [];
    let locusDigest = null;
    let usedLocusDigest = false;
    let variantsSearched = [];

    if (!aiSupport) {
        // AI-off: Gene scores genes + lead variant only (no LD digest expansion).
        const plan = geneSearchPlanFromGeneScores(geneScoreRows);
        geneNames = plan.genes;
        geneReasons = plan.geneReasons;
        variantsSearched = leadVariantSearchTerms(associationRows);
    } else {
        const digestResult = await resolveGp2AiSummaryDigest({
            session,
            region,
            associationRows,
            qtlRows,
            genes,
        });
        locusDigest = digestResult.ok ? digestResult.digest : null;

        let plan;
        if (locusDigest) {
            plan = geneSearchPlanFromAiSummaryDigest(locusDigest);
            digestFindings = describeGp2LocusDigestFindings(locusDigest);
            usedLocusDigest = true;
        } else {
            const fallbackGenes = fallbackGeneNames({
                associationRows,
                qtlRows,
                genes,
            });
            plan = {
                genes: fallbackGenes,
                geneReasons: fallbackGenes.map((gene) => ({
                    gene,
                    reasons: ["Fallback gene set (LD digest unavailable)"],
                })),
            };
        }

        const merged = mergeGeneSearchPlanWithGeneScores(plan, geneScoreRows);
        geneNames = merged.genes;
        geneReasons = merged.geneReasons;
    }

    const term = buildGp2PubmedQueryTerm({
        phenotype,
        genes: geneNames,
        variants: variantsSearched,
    });
    if ((!geneNames.length && !variantsSearched.length) || !term) {
        return { ok: false, reason: "no-genes" };
    }

    const pageResult = await fetchGp2LiteraturePapersPage(term, {
        retstart: 0,
        limit: GP2_LITERATURE_INITIAL_LIMIT,
    });
    if (!pageResult.ok) {
        return pageResult;
    }

    const highlightTerms = buildGp2LiteratureHighlightTerms({
        genes: geneNames,
        variants: variantsSearched,
        phenotype,
    });

    return {
        ok: true,
        phenotype,
        query: term,
        genesSearched: geneNames,
        geneReasons,
        digestFindings,
        papers: pageResult.papers,
        locusDigest,
        usedLocusDigest,
        variantsSearched,
        highlightTerms,
        aiSupport: Boolean(aiSupport),
    };
}

/**
 * Phase 2: LLM synthesis over the papers phase 1 already fetched.
 * Returns `{ ok: false, reason: "llm-error", error? }` on failure — callers
 * should keep showing the already-rendered paper list and just surface the
 * synthesis error, not discard the papers.
 */
export async function synthesizeGp2LiteratureFindings({ phenotype, geneNames, papers, locusDigest }) {
    const digest = buildGp2LiteratureDigest({ phenotype, geneNames, papers, locusDigest });

    let raw;
    try {
        raw = await callGp2LiteratureLlm({
            systemPrompt: GP2_LITERATURE_SYSTEM_PROMPT,
            userPrompt: buildGp2LiteratureUserPrompt(digest),
        });
    } catch (error) {
        return { ok: false, reason: "llm-error", error };
    }

    const parsed = parseGp2LiteratureResponse(raw, { papers: digest.papers });
    if (!parsed) {
        return { ok: false, reason: "llm-error" };
    }

    return { ok: true, ...parsed };
}

export const GP2_LITERATURE_KG_NODE_TYPES = ["variant", "gene", "mechanism", "phenotype"];

/** Closed relation vocabulary for the literature KG LLM (snake_case). */
export const GP2_LITERATURE_KG_RELATIONS = [
    "regulates",
    "activates",
    "inhibits",
    "phosphorylates",
    "required_for",
    "mediates",
    "associated_with",
    "risk_increasing",
    "risk_decreasing",
    "causes",
    "precedes",
    "prevents",
    "enables",
    "driver_of",
    "master_regulator_of",
];

export const GP2_LITERATURE_KG_SYSTEM_PROMPT = `You build a small knowledge graph from already-verified literature claims about a Parkinson's disease GWAS locus.
Same claims must yield the same graph. Be mechanical and preserve claim granularity — do not invent, embellish, or coarsen.

Determinism (follow exactly):
1. Use ONLY the numbered claims. Never invent a variant, gene, mechanism, phenotype, or relationship not explicitly stated in at least one claim.
2. Node types must be exactly one of: "variant", "gene", "mechanism", "phenotype".
3. Entity labels: copy the exact name/symbol from the claim text. Do not expand synonyms or introduce alternate gene/protein names (e.g. do not add KCa3.1 unless that exact string appears in a claim).
4. Node "id" = lowercase slug of the label (letters/digits/underscores only).
5. Create a "variant" node only when a claim names a specific variant (rsID or chr:pos allele).
6. Mechanism labels: keep the MOST SPECIFIC noun phrase from the claim (e.g. "PKCδ phosphorylation at tyrosine 311", not "phosphorylation"; "α-synuclein Ser129 phosphorylation", not "α-synuclein pathology"). Do NOT collapse distinct mechanisms into a broader parent node.
7. Phenotype label: use "Parkinson's disease" unless a claim names a more specific phenotype string — then use that exact string.
8. "relation" MUST be one of: ${GP2_LITERATURE_KG_RELATIONS.join(", ")}. Pick the single closest match; do not invent new predicates.
9. Emit exactly one edge per concrete relationship claim (at most one edge per claim unless the claim explicitly states two distinct relationships). No multi-hop paths that are not stated. Do not merge two claims into one edge.
10. Each edge MUST include "claimNumbers" (1-based indices into the claims list). Drop edges that cannot cite ≥1 claim.
11. If two claims conflict, keep both edges and set "conflict": true on each — do not choose a winner.
12. Ignore vague "mentioned in context" / no-relationship claims.
13. Cap: at most 24 nodes and 28 edges. Prefer keeping granular mechanisms over dropping them to fit a coarser graph.
14. Sort nodes by type order variant → gene → mechanism → phenotype, then label A→Z. Sort edges by min(claimNumbers), then from, then to, then relation.

Respond with JSON only: {"nodes":[{"id":"...","type":"gene","label":"..."}],"edges":[{"from":"...","to":"...","relation":"...","claimNumbers":[1],"conflict":false}]}`;

export function buildGp2LiteratureKgUserPrompt({ phenotype, claims }) {
    const numbered = (claims || []).map((claim, index) => ({
        number: index + 1,
        text: String(claim?.text || "").trim(),
    }));
    return [
        `Phenotype: ${phenotype || "Parkinsons"}.`,
        "Build the KG per the system rules. Same claims → same graph. Preserve atomic claim granularity; do not coarsen mechanism nodes.",
        `Claims (JSON): ${JSON.stringify(numbered)}`,
        'Respond with JSON only: {"nodes":[{"id":"...","type":"gene","label":"..."}],"edges":[{"from":"...","to":"...","relation":"...","claimNumbers":[1],"conflict":false}]}',
    ].join("\n");
}

function slugifyKgId(value, fallback = "node") {
    const slug = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "");
    return slug || fallback;
}

const GP2_LITERATURE_KG_RELATION_SET = new Set(GP2_LITERATURE_KG_RELATIONS);

const GP2_LITERATURE_KG_RELATION_ALIASES = {
    regulate: "regulates",
    regulation: "regulates",
    regulator: "regulates",
    genetic_risk_factor: "associated_with",
    risk_factor: "associated_with",
    associated: "associated_with",
    association: "associated_with",
    increases_risk: "risk_increasing",
    risk_increasing_allele: "risk_increasing",
    decreases_risk: "risk_decreasing",
    risk_decreasing_allele: "risk_decreasing",
    impair: "inhibits",
    impairs: "inhibits",
    inhibit: "inhibits",
    activate: "activates",
    activation: "activates",
    phosphorylate: "phosphorylates",
    phosphorylation: "phosphorylates",
    require: "required_for",
    requires: "required_for",
    mediate: "mediates",
    mediation: "mediates",
    cause: "causes",
    leading_to: "causes",
    precede: "precedes",
    prevent: "prevents",
    enable: "enables",
    driver: "driver_of",
    driver_gene: "driver_of",
    master_regulator: "master_regulator_of",
};

function normalizeKgRelation(value) {
    const raw = String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, "_");
    if (!raw) {
        return "";
    }
    if (GP2_LITERATURE_KG_RELATION_SET.has(raw)) {
        return raw;
    }
    if (GP2_LITERATURE_KG_RELATION_ALIASES[raw]) {
        return GP2_LITERATURE_KG_RELATION_ALIASES[raw];
    }
    // Soft fallback: keep snake_case so a slightly off predicate still renders.
    return raw;
}

const GP2_LITERATURE_KG_TYPE_ORDER = {
    variant: 0,
    gene: 1,
    mechanism: 2,
    phenotype: 3,
};

/**
 * Normalize + validate an LLM KG against the 1-based claim list the UI shows.
 * Drops edges with invalid endpoints or no surviving claimNumbers; drops
 * nodes that no remaining edge references. Sorts nodes/edges for stable UI.
 */
export function parseGp2LiteratureKnowledgeGraph(raw, { claims = [] } = {}) {
    const { ok, json } = parseLlmJsonResponse(raw);
    if (!ok || !json || typeof json !== "object") {
        return null;
    }

    const maxClaim = (claims || []).length;
    const validClaimNumbers = new Set(
        Array.from({ length: maxClaim }, (_, index) => index + 1)
    );

    const nodesById = new Map();
    (Array.isArray(json.nodes) ? json.nodes : []).forEach((entry) => {
        const type = String(entry?.type || "").trim().toLowerCase();
        if (!GP2_LITERATURE_KG_NODE_TYPES.includes(type)) {
            return;
        }
        const label = String(entry?.label || entry?.id || "").trim();
        if (!label) {
            return;
        }
        const id = slugifyKgId(entry?.id || label, type);
        if (!nodesById.has(id)) {
            nodesById.set(id, { id, type, label });
        }
    });

    const edgesByKey = new Map();
    (Array.isArray(json.edges) ? json.edges : []).forEach((entry) => {
        const from = slugifyKgId(entry?.from);
        const to = slugifyKgId(entry?.to);
        const relation = normalizeKgRelation(entry?.relation);
        if (!from || !to || from === to || !relation) {
            return;
        }
        if (!nodesById.has(from) || !nodesById.has(to)) {
            return;
        }
        const claimNumbers = (
            Array.isArray(entry?.claimNumbers) ? entry.claimNumbers : []
        )
            .map((number) => Number(number))
            .filter((number) => validClaimNumbers.has(number));
        if (!claimNumbers.length) {
            return;
        }
        const key = `${from}|${to}|${relation}`;
        const existing = edgesByKey.get(key);
        if (existing) {
            existing.claimNumbers = [
                ...new Set([...existing.claimNumbers, ...claimNumbers]),
            ].sort((a, b) => a - b);
            existing.conflict = existing.conflict || Boolean(entry?.conflict);
            return;
        }
        edgesByKey.set(key, {
            from,
            to,
            relation,
            claimNumbers: [...new Set(claimNumbers)].sort((a, b) => a - b),
            conflict: Boolean(entry?.conflict),
        });
    });

    const edges = Array.from(edgesByKey.values()).sort((a, b) => {
        const aMin = Math.min(...a.claimNumbers);
        const bMin = Math.min(...b.claimNumbers);
        if (aMin !== bMin) {
            return aMin - bMin;
        }
        if (a.from !== b.from) {
            return a.from.localeCompare(b.from);
        }
        if (a.to !== b.to) {
            return a.to.localeCompare(b.to);
        }
        return a.relation.localeCompare(b.relation);
    });

    const cappedEdges = edges.slice(0, 28);
    if (!cappedEdges.length) {
        return null;
    }

    const usedIds = new Set();
    cappedEdges.forEach((edge) => {
        usedIds.add(edge.from);
        usedIds.add(edge.to);
    });
    const nodes = Array.from(nodesById.values())
        .filter((node) => usedIds.has(node.id))
        .sort((a, b) => {
            const typeDelta =
                (GP2_LITERATURE_KG_TYPE_ORDER[a.type] ?? 99) -
                (GP2_LITERATURE_KG_TYPE_ORDER[b.type] ?? 99);
            if (typeDelta !== 0) {
                return typeDelta;
            }
            return a.label.localeCompare(b.label) || a.id.localeCompare(b.id);
        })
        .slice(0, 24);
    if (!nodes.length) {
        return null;
    }

    const keptIds = new Set(nodes.map((node) => node.id));
    const finalEdges = cappedEdges.filter(
        (edge) => keptIds.has(edge.from) && keptIds.has(edge.to)
    );
    if (!finalEdges.length) {
        return null;
    }

    return { nodes, edges: finalEdges };
}

/**
 * Phase 3: second LLM pass over verified claims → variant/gene/mechanism/
 * phenotype knowledge graph for network rendering.
 * Returns `{ ok: false, reason: "no-claims" | "llm-error", error? }`.
 */
export async function extractGp2LiteratureKnowledgeGraph({ phenotype, claims }) {
    const claimList = (claims || []).filter((claim) => String(claim?.text || "").trim());
    if (!claimList.length) {
        return { ok: false, reason: "no-claims" };
    }

    let raw;
    try {
        raw = await callGp2LiteratureLlm({
            systemPrompt: GP2_LITERATURE_KG_SYSTEM_PROMPT,
            userPrompt: buildGp2LiteratureKgUserPrompt({
                phenotype,
                claims: claimList,
            }),
        });
    } catch (error) {
        return { ok: false, reason: "llm-error", error };
    }

    const kg = parseGp2LiteratureKnowledgeGraph(raw, { claims: claimList });
    if (!kg) {
        return { ok: false, reason: "llm-error" };
    }

    return { ok: true, kg };
}
