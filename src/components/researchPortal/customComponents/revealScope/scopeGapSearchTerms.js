/**
 * Dedicated LLM extraction of DisMech knowledge-gap search terms.
 * Separate from Module A hypothesis evaluation (no rubric / slot scoring).
 */

import { createLLMClient } from "@/utils/llmClient";

/** Ordered groups used for extraction, search, and UI cards. */
export const GAP_TERM_GROUPS = [
    {
        id: "disease_phenotype",
        label: "Disease / phenotype",
        description: "Named diseases, syndromes, or clinical phenotypes",
    },
    {
        id: "pathophysiology_process",
        label: "Pathophysiology / process",
        description: "Short mechanism or biological-process phrases",
    },
    {
        id: "molecular_target",
        label: "Molecular target",
        description: "Genes or proteins (prefer HGNC symbols)",
    },
    {
        id: "intervention",
        label: "Intervention",
        description: "Drugs, antibodies, or named experimental perturbations",
    },
    {
        id: "anatomy_cell",
        label: "Anatomy / cell context",
        description: "Tissue, cell type, or anatomical site",
    },
    {
        id: "combos",
        label: "Combined terms",
        description: "Short multi-facet queries when both sides are clear",
    },
];

const GROUP_IDS = GAP_TERM_GROUPS.map((g) => g.id);

const MAX_TERMS_PER_GROUP = 4;
const MAX_TERM_CHARS = 48;

const SYSTEM_PROMPT =
    "You extract short search queries for a curated disease knowledge-gap corpus (DisMech).\n" +
    "The corpus indexes open scientific questions about disorders, pathophysiology, and related mechanisms.\n" +
    "Fuzzy/lexical retrieval works best with short, concrete phrases — not full hypothesis sentences.\n\n" +
    "Respond with strict JSON only, matching exactly this shape:\n" +
    "{\n" +
    '  "disease_phenotype": string[],\n' +
    '  "pathophysiology_process": string[],\n' +
    '  "molecular_target": string[],\n' +
    '  "intervention": string[],\n' +
    '  "anatomy_cell": string[],\n' +
    '  "combos": string[]\n' +
    "}\n\n" +
    "Group definitions:\n" +
    "- disease_phenotype: named diseases, syndromes, or clinical phenotypes " +
    '(e.g. "T cell exhaustion", "lipodystrophy", "type 2 diabetes"). Prefer canonical disease/phenotype names over lab readouts.\n' +
    "- pathophysiology_process: short mechanism or process phrases " +
    '(e.g. "IFN-gamma secretion", "lysosomal lipoprotein accumulation", "proximal tubule transport"). No gene symbols here.\n' +
    "- molecular_target: genes/proteins. Prefer official HGNC symbols " +
    '(e.g. "PDCD1" not "PD-1"; "ERBB2" not "HER2"). Include at most one common alias only if the symbol alone would be ambiguous.\n' +
    "- intervention: drugs, antibodies, or named deliberate perturbations " +
    '(e.g. "Pembrolizumab", "SIRT1 knockdown"). Not environmental conditions alone.\n' +
    "- anatomy_cell: tissue, cell type, or anatomical site " +
    '(e.g. "CD8 T cells", "HepG2", "corneal stroma"). Omit if not stated.\n' +
    "- combos: optional short multi-facet queries when two clear facets help retrieval " +
    '(e.g. "PDCD1 T cell exhaustion", "Pembrolizumab IFN-gamma"). Max 2. Do not invent facets not present in the text.\n\n' +
    "Rules:\n" +
    "1. Each term: 1–5 words, no commas, no full sentences, no hypothesis restatement.\n" +
    "2. At most 4 terms per group (combos: at most 2). Use [] when a group has nothing grounded in the text.\n" +
    "3. Do not invent entities not present or clearly implied by the hypothesis.\n" +
    "4. Prefer specific named entities over vague words (\"pathway\", \"signaling\", \"dysfunction\" alone).\n" +
    "5. Deduplicate across groups: if the same string fits two groups, keep it only in the best-fitting group.\n" +
    "6. No explanation outside the JSON. No markdown.";

function normalizeTermList(raw, { maxItems = MAX_TERMS_PER_GROUP } = {}) {
    if (!Array.isArray(raw)) {
        return [];
    }
    const out = [];
    const seen = new Set();
    for (const item of raw) {
        if (typeof item !== "string") {
            continue;
        }
        const cleaned = item.trim().replace(/\s+/g, " ");
        if (!cleaned || cleaned.length < 2 || cleaned.length > MAX_TERM_CHARS) {
            continue;
        }
        // Reject sentence-like terms.
        if (/[.?!;]/.test(cleaned) || cleaned.split(" ").length > 6) {
            continue;
        }
        const key = cleaned.toLowerCase();
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        out.push(cleaned);
        if (out.length >= maxItems) {
            break;
        }
    }
    return out;
}

/**
 * Normalize LLM JSON into ordered group objects + a flat unique term list for search.
 * @returns {{ groups: Array<{ id: string, label: string, terms: string[] }>, terms: string[] }}
 */
export function normalizeGapSearchTermGroups(parsed) {
    const source = parsed && typeof parsed === "object" ? parsed : {};
    const globalSeen = new Set();
    const groups = GAP_TERM_GROUPS.map((meta) => {
        const maxItems = meta.id === "combos" ? 2 : MAX_TERMS_PER_GROUP;
        const rawTerms = normalizeTermList(source[meta.id], { maxItems });
        const terms = [];
        for (const term of rawTerms) {
            const key = term.toLowerCase();
            if (globalSeen.has(key)) {
                continue;
            }
            globalSeen.add(key);
            terms.push(term);
        }
        return {
            id: meta.id,
            label: meta.label,
            description: meta.description,
            terms,
        };
    });

    const terms = [];
    for (const group of groups) {
        for (const term of group.terms) {
            terms.push(term);
        }
    }

    return { groups, terms };
}

export function emptyGapSearchTermGroups() {
    return {
        groups: GAP_TERM_GROUPS.map((meta) => ({
            id: meta.id,
            label: meta.label,
            description: meta.description,
            terms: [],
        })),
        terms: [],
    };
}

/**
 * Extract categorized gap-search terms from free-text hypothesis.
 * @param {string} hypothesisText
 * @returns {Promise<{ groups: object[], terms: string[], extractError: Error|null }>}
 */
export function extractGapSearchTerms(hypothesisText) {
    const text = typeof hypothesisText === "string" ? hypothesisText.trim() : "";
    if (!text) {
        return Promise.resolve({
            ...emptyGapSearchTermGroups(),
            extractError: new Error("No hypothesis text provided."),
        });
    }

    const client = createLLMClient({
        llm: "bedrock",
        system_prompt: SYSTEM_PROMPT,
        expectJson: true,
    });

    return new Promise((resolve) => {
        client.sendPrompt({
            userPrompt: text,
            onResponse: (raw) => {
                try {
                    const parsed = JSON.parse(raw);
                    const normalized = normalizeGapSearchTermGroups(parsed);
                    resolve({ ...normalized, extractError: null });
                } catch (error) {
                    resolve({
                        ...emptyGapSearchTermGroups(),
                        extractError: error || new Error("Gap search-term parse failed."),
                    });
                }
            },
            onError: (error) => {
                resolve({
                    ...emptyGapSearchTermGroups(),
                    extractError: error || new Error("Gap search-term extraction failed."),
                });
            },
        });
    });
}

export { GROUP_IDS };
