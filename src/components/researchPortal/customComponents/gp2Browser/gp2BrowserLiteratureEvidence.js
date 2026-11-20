/**
 * GP2 Browser "Literature evidence" panel (Tools menu).
 *
 * Searches PubMed (NCBI E-utilities — esearch/esummary/efetch, no API key,
 * CORS-enabled) for the phenotype plus the genes this locus's AI-summary
 * digest already identified as relevant (lead variant, exon-resolved
 * missense genes, linked-vs-unlinked QTL contrasts) — reusing that pure
 * digest-building logic directly, not the AI summary action's LLM call, so
 * this panel doesn't depend on "Generate AI summary" having been run. If LD
 * scores aren't available (the one thing that blocks the digest), falls
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

export function buildGp2PubmedQueryTerm({ phenotype, genes }) {
    const synonyms = GP2_PHENOTYPE_PUBMED_SYNONYMS[phenotype] || [phenotype];
    const phenotypeParts = synonyms.map(pubmedTermPart).filter(Boolean);
    const geneParts = Array.from(new Set(genes || [])).map(pubmedTermPart).filter(Boolean);
    if (!phenotypeParts.length || !geneParts.length) {
        return null;
    }
    return `(${phenotypeParts.join(" OR ")}) AND (${geneParts.join(" OR ")})`;
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
    return {
        phenotype,
        genesSearched: geneNames,
        papers: papers.map((paper) => ({
            pmid: paper.pmid,
            title: paper.title,
            journal: paper.journal,
            pubdate: paper.pubdate,
            abstract: trimAbstract(paper.abstract),
        })),
        locusDigest: locusDigest || null,
    };
}

export const GP2_LITERATURE_SYSTEM_PROMPT = `You read PubMed abstracts retrieved for a Parkinson's disease GWAS locus and extract claims with supporting excerpts for a researcher.
Rules:
- Use only the abstracts in "papers" and, if present, the facts in "locusDigest". Never invent a claim, excerpt, PMID, or fact not present in the input.
- "excerpts": short verbatim quotes (a sentence or short phrase, copied EXACTLY as written, word-for-word, no paraphrasing, no ellipses or edits) from the "abstract" field of a specific paper. Each excerpt has a sequential "number" starting at 1 (in the order first referenced by a claim), the source "pmid", and the "quote" text. A quote that is not an exact substring of that paper's abstract will be discarded, so copy it verbatim rather than summarizing.
- "claims": each is one distinct finding the retrieved papers establish or agree on, as "text", plus "excerptNumbers" — the excerpt number(s) (referencing "excerpts") that support it. Every claim MUST cite at least one excerpt number; a claim with no supporting excerpt will be discarded.
- Distinguish a claim corroborated by more than one independent paper (citing an excerpt from each) from a claim made by only one paper.
- A paper can mention the searched gene and the phenotype without actually studying their relationship (for example a drug-mechanism paper that happens to involve the gene, in an unrelated disease context). Flag this explicitly as its own claim (with its own supporting excerpt) rather than treating it as evidence connecting the gene to the phenotype.
- If "locusDigest" is present, add a claim explicitly stating whether any paper discusses the SPECIFIC finding it describes (the lead variant, the exon-resolved missense/coding gene, or the linked-vs-unlinked QTL contrast) versus only the gene's general relevance to the phenotype.
- "gaps": each is one distinct thing the retrieved papers do NOT address, as "text", plus an optional "excerptNumbers" (usually an empty array, since a gap is an absence — only cite an excerpt number when a specific paper's silence on this exact point is itself notable). Phrase each gap as a property of the retrieved papers ("the retrieved papers do not address X"), never as a claim about the literature as a whole — this is a narrow keyword search over a small set of abstracts, not an exhaustive review.
Respond with JSON only: {"claims": [{"text": "...", "excerptNumbers": [1]}], "excerpts": [{"number": 1, "pmid": "...", "quote": "..."}], "gaps": [{"text": "...", "excerptNumbers": []}]}`;

export function buildGp2LiteratureUserPrompt(digest) {
    return [
        `Phenotype: ${digest.phenotype}. Genes searched: ${digest.genesSearched.join(", ")}.`,
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
            return { text, excerptNumbers };
        })
        .filter(Boolean);

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
            return { text, excerptNumbers };
        })
        .filter(Boolean);

    if (!claims.length && !gaps.length) {
        return null;
    }

    const citedExcerptNumbers = new Set([
        ...claims.flatMap((claim) => claim.excerptNumbers),
        ...gaps.flatMap((gap) => gap.excerptNumbers),
    ]);
    return {
        claims,
        excerpts: excerpts.filter((excerpt) => citedExcerptNumbers.has(excerpt.number)),
        gaps,
    };
}

/**
 * esearch (one page of PMIDs, offset by `retstart`) + esummary + efetch
 * abstracts for an already-built query term. Used both for the first page
 * (inside {@link fetchGp2LiteraturePapers}) and for "Show next 15" pages,
 * which reuse the same term/gene set rather than re-resolving genes.
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
}) {
    const phenotype = session?.phenotype?.name;
    if (!phenotype) {
        return { ok: false, reason: "no-data" };
    }

    const digestResult = await resolveGp2AiSummaryDigest({
        session,
        region,
        associationRows,
        qtlRows,
        genes,
    });
    const locusDigest = digestResult.ok ? digestResult.digest : null;

    let geneNames;
    let geneReasons = [];
    let digestFindings = [];
    if (locusDigest) {
        const plan = geneSearchPlanFromAiSummaryDigest(locusDigest);
        geneNames = plan.genes;
        geneReasons = plan.geneReasons;
        digestFindings = describeGp2LocusDigestFindings(locusDigest);
    } else {
        geneNames = fallbackGeneNames({ associationRows, qtlRows, genes });
        geneReasons = geneNames.map((gene) => ({
            gene,
            reasons: ["Fallback gene set (LD digest unavailable)"],
        }));
    }

    const term = buildGp2PubmedQueryTerm({ phenotype, genes: geneNames });
    if (!geneNames.length || !term) {
        return { ok: false, reason: "no-genes" };
    }

    const pageResult = await fetchGp2LiteraturePapersPage(term, { retstart: 0 });
    if (!pageResult.ok) {
        return pageResult;
    }

    return {
        ok: true,
        phenotype,
        query: term,
        genesSearched: geneNames,
        geneReasons,
        digestFindings,
        papers: pageResult.papers,
        locusDigest,
        usedLocusDigest: Boolean(locusDigest),
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

export const GP2_LITERATURE_KG_SYSTEM_PROMPT = `You build a small knowledge graph from already-verified literature claims about a Parkinson's disease GWAS locus.
Rules:
- Use ONLY the numbered claims you are given. Never invent a variant, gene, mechanism, phenotype, or relationship that is not explicitly stated in at least one claim.
- Node types must be exactly one of: "variant", "gene", "mechanism", "phenotype".
- Create a "variant" node only when a claim names a specific variant (rsID or chr:pos allele). Do not invent variants from gene/phenotype risk statements.
- Prefer compact reusable mechanism nodes (e.g. "lysosomal pH homeostasis", "autophagy", "α-synuclein aggregation") over restating whole sentences.
- "edges": directed relationships. Each edge MUST include "claimNumbers" — 1-based indices into the provided claims list that support it. Drop any edge that cannot cite at least one claim.
- "relation" should be a short snake_case predicate (e.g. genetic_risk_factor, regulates, risk_increasing_allele, impairs).
- If two claims conflict (e.g. acidification vs alkalinization), keep both edges and set "conflict": true on each conflicting edge rather than choosing one.
- Ignore vague "mentioned in context" claims that do not assert a concrete relationship.
Respond with JSON only: {"nodes":[{"id":"...","type":"gene","label":"..."}],"edges":[{"from":"...","to":"...","relation":"...","claimNumbers":[1],"conflict":false}]}`;

export function buildGp2LiteratureKgUserPrompt({ phenotype, claims }) {
    const numbered = (claims || []).map((claim, index) => ({
        number: index + 1,
        text: String(claim?.text || "").trim(),
    }));
    return [
        `Phenotype: ${phenotype || "Parkinsons"}.`,
        `Claims (JSON): ${JSON.stringify(numbered)}`,
        'Respond with JSON only: {"nodes":[{"id":"...","type":"gene","label":"..."}],"edges":[{"from":"...","to":"...","relation":"...","claimNumbers":[1]}]}',
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

/**
 * Normalize + validate an LLM KG against the 1-based claim list the UI shows.
 * Drops edges with invalid endpoints or no surviving claimNumbers; drops
 * nodes that no remaining edge references (except keep phenotype/gene hubs
 * only if cited).
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

    const edges = [];
    (Array.isArray(json.edges) ? json.edges : []).forEach((entry) => {
        const from = slugifyKgId(entry?.from);
        const to = slugifyKgId(entry?.to);
        const relation = String(entry?.relation || "")
            .trim()
            .toLowerCase()
            .replace(/\s+/g, "_");
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
        edges.push({
            from,
            to,
            relation,
            claimNumbers: [...new Set(claimNumbers)].sort((a, b) => a - b),
            conflict: Boolean(entry?.conflict),
        });
    });

    if (!edges.length) {
        return null;
    }

    const usedIds = new Set();
    edges.forEach((edge) => {
        usedIds.add(edge.from);
        usedIds.add(edge.to);
    });
    const nodes = Array.from(nodesById.values()).filter((node) => usedIds.has(node.id));
    if (!nodes.length) {
        return null;
    }

    return { nodes, edges };
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
