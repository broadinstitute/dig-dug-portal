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

/** Genes referenced anywhere in an AI-summary digest (variants + QTL hits). */
export function geneNamesFromAiSummaryDigest(digest) {
    const names = new Set();
    const addVariantGenes = (variant) => {
        if (!variant) {
            return;
        }
        (variant.nearestGenes || []).forEach((name) => names.add(name));
        (variant.consequenceGenes || []).forEach((name) => names.add(name));
    };
    addVariantGenes(digest?.leadVariant);
    (digest?.highLdCluster?.missenseVariants || []).forEach(addVariantGenes);
    (digest?.moderateLdMissense || []).forEach(addVariantGenes);
    (digest?.qtlByGene || []).forEach((entry) => {
        if (entry.gene) {
            names.add(entry.gene);
        }
    });
    return Array.from(names);
}

/** Used only when the AI-summary digest can't be resolved (no LD data). */
export function fallbackGeneNames({ associationRows = [], qtlRows = [], genes = [] }) {
    const names = new Set();
    const leadRow = pickLeadVariantRow(associationRows);
    if (leadRow) {
        (Array.isArray(leadRow.nearest) ? leadRow.nearest : []).forEach((name) =>
            names.add(name)
        );
        findExonOverlapGenes(leadRow.position, genes).forEach((name) => names.add(name));
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

export const GP2_LITERATURE_SYSTEM_PROMPT = `You read PubMed abstracts retrieved for a Parkinson's disease GWAS locus and summarize them for a researcher.
Rules:
- Use only the abstracts in "papers" and, if present, the facts in "locusDigest". Never invent a claim, citation, or PMID not present in the input.
- Every factual claim must be followed immediately by the PMID(s) of the paper(s) that support it, in parentheses, e.g. "rs123 is associated with X (PMID 12345678)." No exceptions: a claim with no PMID attached must not appear in the output.
- Distinguish a claim corroborated by more than one independent paper from a claim made by only one paper.
- A paper can mention the searched gene and the phenotype without actually studying their relationship (for example a drug-mechanism paper that happens to involve the gene, in an unrelated disease context). Flag this explicitly rather than treating it as evidence connecting the gene to the phenotype.
- If "locusDigest" is present, explicitly state whether any paper discusses the SPECIFIC finding it describes (the lead variant, the exon-resolved missense/coding gene, or the linked-vs-unlinked QTL contrast) versus only the gene's general relevance to the phenotype.
- "knownFindings": one distinct claim/finding the retrieved papers establish or agree on per sentence, each sentence ending with the PMID(s) of the paper(s) backing it — written so the reader can look up exactly which card(s) support each sentence.
- "knowledgeGaps": what the retrieved papers do NOT address. Phrase this as a property of the retrieved papers ("the retrieved papers do not address X"), never as a claim about the literature as a whole — this is a narrow keyword search over a small set of abstracts, not an exhaustive review. A gap does not need a PMID (it is an absence), but if a paper's silence on a specific point is itself notable, you may cite the PMID of the paper that was silent on it.
Respond with JSON only: {"knownFindings": "...", "knowledgeGaps": "..."}`;

export function buildGp2LiteratureUserPrompt(digest) {
    return [
        `Phenotype: ${digest.phenotype}. Genes searched: ${digest.genesSearched.join(", ")}.`,
        `Papers and locus digest (JSON): ${JSON.stringify({
            papers: digest.papers,
            locusDigest: digest.locusDigest,
        })}`,
        'Respond with JSON only: {"knownFindings":"...","knowledgeGaps":"..."}',
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

export function parseGp2LiteratureResponse(raw) {
    const { ok, json } = parseLlmJsonResponse(raw);
    if (!ok || !json || typeof json !== "object") {
        return null;
    }
    const knownFindings = String(json.knownFindings || "").trim();
    const knowledgeGaps = String(json.knowledgeGaps || "").trim();
    if (!knownFindings && !knowledgeGaps) {
        return null;
    }
    return { knownFindings, knowledgeGaps };
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

    const geneNames = locusDigest
        ? geneNamesFromAiSummaryDigest(locusDigest)
        : fallbackGeneNames({ associationRows, qtlRows, genes });

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

    const parsed = parseGp2LiteratureResponse(raw);
    if (!parsed) {
        return { ok: false, reason: "llm-error" };
    }

    return { ok: true, ...parsed };
}
