/** Translate phenotype / trait ids to human-readable text for embedding search. */

import { createLLMClient } from "@/utils/llmClient";
import { resolveCfdePhenotypeLabel } from "@/utils/cfdeUtils.js";

const PHENOTYPE_SEARCH_MODEL = "gpt-5-mini";

/** Gene-set corpus / program names — not graph node symbols. */
const GENE_SET_PROGRAM_TOKENS = new Set([
    "gtex",
    "lincs",
    "hubmap",
    "cfde",
    "wikipathways",
    "encode",
    "gtexv8",
]);

let phenotypeSearchClient = null;

function getPhenotypeSearchClient() {
    if (!phenotypeSearchClient) {
        phenotypeSearchClient = createLLMClient({
            llm: "openai",
            model: PHENOTYPE_SEARCH_MODEL,
            system_prompt: buildPhenotypeSearchSystemPrompt(),
        });
    }
    return phenotypeSearchClient;
}

export function abortPhenotypeSearchQueryPlan() {
    phenotypeSearchClient?.abort();
}

function buildPhenotypeSearchSystemPrompt() {
    return `You prepare natural-language search queries for trait–gene set embedding search.

Given a user request that may contain phenotype or trait identifiers, return a short plain-language query suitable for semantic search.

Rules:
- Replace every phenotype/trait id with its human-readable label when a mapping is provided.
- Expand common abbreviations: T2D → type 2 diabetes, T1D → type 1 diabetes, WHR → waist-hip ratio when used as a trait.
- Use full descriptive phrases (e.g. "fasting blood insulin measurement", not "gcat_trait_fasting_blood_insulin_measurement").
- Keep biological context from the user request; do not invent new concepts.
- Do not include "trait:", "gcat_trait_", or camelCase database ids in the final query when a readable label exists.
- Gene-set program names (GTEx, LINCS, HuBMAP) may stay as plain words; they are data sources, not traits.
- Prefer 4–20 words; no bullet lists or markdown.
- If the request is already plain language, return it trimmed with only obvious ids replaced.

Return ONLY valid JSON:
{ "search_query": "string" }`;
}

export function isGeneSetProgramToken(token) {
    const normalized = String(token || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]/g, "");
    return GENE_SET_PROGRAM_TOKENS.has(normalized);
}

export function isResolvablePhenotypeToken(token) {
    const text = String(token || "").trim();
    if (!text) {
        return false;
    }
    return Boolean(resolveCfdePhenotypeLabel(text));
}

function labelForEmbeddingSearch(label) {
    return String(label || "")
        .replace(/\s*\([^)]*\)\s*/g, " ")
        .replace(/\s{2,}/g, " ")
        .trim();
}

function stripTraitNodePrefix(nodeId) {
    const text = String(nodeId || "").trim();
    if (!text) {
        return "";
    }
    return text.startsWith("trait:") ? text.slice("trait:".length) : text;
}

function traitNodesFromSession(session) {
    return (session?.graphNodes || []).filter(
        (node) => String(node?.type || node?.node_type || "").trim() === "trait"
    );
}

export function resolveTraitLabelForSearch(rawId, { session = null } = {}) {
    const id = stripTraitNodePrefix(rawId);
    if (!id) {
        return null;
    }

    for (const node of traitNodesFromSession(session)) {
        const nodeId = stripTraitNodePrefix(node.id || node.node_id);
        if (nodeId === id || node.id === rawId || node.id === `trait:${id}`) {
            const label = String(node.label || "").trim();
            if (label && label !== id && label !== nodeId) {
                return label;
            }
        }
    }

    const fromCatalog = resolveCfdePhenotypeLabel(id);
    if (fromCatalog) {
        return labelForEmbeddingSearch(fromCatalog);
    }

    return null;
}

export function findPhenotypeIdsInText(text) {
    const query = String(text || "");
    const ids = new Set();

    for (const match of query.matchAll(/\btrait:([A-Za-z0-9_.-]+)\b/g)) {
        ids.add(match[1]);
    }
    for (const match of query.matchAll(/\bgcat_trait_[A-Za-z0-9_.-]+/g)) {
        ids.add(match[0]);
    }
    for (const word of query.match(/\b[A-Za-z][A-Za-z0-9_-]+\b/g) || []) {
        if (resolveCfdePhenotypeLabel(word)) {
            ids.add(word);
        }
    }
    for (const match of query.matchAll(/\b[A-Z][A-Z0-9]{1,10}\b/g)) {
        const token = match[0];
        if (resolveCfdePhenotypeLabel(token)) {
            ids.add(token);
        }
    }

    return Array.from(ids);
}

export function buildPhenotypeIdLabelMap(text, { session = null } = {}) {
    const map = {};
    for (const id of findPhenotypeIdsInText(text)) {
        const label = resolveTraitLabelForSearch(id, { session });
        if (label) {
            map[id] = label;
        }
    }
    return map;
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

export function applyDeterministicPhenotypeTranslations(text, idLabelMap = {}) {
    let query = String(text || "").trim();
    if (!query || !idLabelMap || !Object.keys(idLabelMap).length) {
        return query;
    }

    const replacements = Object.entries(idLabelMap).sort(
        (a, b) => b[0].length - a[0].length
    );

    for (const [id, label] of replacements) {
        const patterns = [
            new RegExp(`\\btrait:${escapeRegExp(id)}\\b`, "gi"),
            new RegExp(`\\b${escapeRegExp(id)}\\b`, "g"),
        ];
        for (const pattern of patterns) {
            query = query.replace(pattern, label);
        }
    }

    return query.replace(/\s{2,}/g, " ").trim();
}

function queryStillHasOpaqueTraitIds(text) {
    return (
        /\btrait:[A-Za-z0-9_.-]+\b/.test(text) ||
        /\bgcat_trait_[A-Za-z0-9_.-]+/.test(text)
    );
}

function parsePhenotypeSearchJson(rawString) {
    const clean = String(rawString || "")
        .replace(/```json|```/gi, "")
        .trim();
    if (!clean) {
        return null;
    }
    try {
        return JSON.parse(clean);
    } catch (error) {
        return null;
    }
}

function sendPhenotypeSearchPrompt(userPrompt) {
    const client = getPhenotypeSearchClient();
    return new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, response) => {
            if (settled) {
                return;
            }
            settled = true;
            if (error) {
                reject(error);
                return;
            }
            resolve(response);
        };
        client.sendPrompt({
            userPrompt,
            systemPrompt: buildPhenotypeSearchSystemPrompt(),
            onResponse: (response) => finish(null, response),
            onError: (error) => finish(error || new Error("Phenotype search query planner failed.")),
            onEnd: () => {
                if (!settled) {
                    finish(new Error("Incomplete phenotype search query response."));
                }
            },
        });
    });
}

function buildPhenotypeSearchUserPrompt(rawQuery, { session = null, idLabelMap = {} } = {}) {
    const traitsOnGraph = traitNodesFromSession(session).slice(0, 40).map((node) => ({
        node_id: node.id || node.node_id,
        label: node.label || node.id,
    }));
    return JSON.stringify({
        raw_query: String(rawQuery || "").trim(),
        known_id_labels: idLabelMap,
        traits_on_graph: traitsOnGraph,
        session_context: String(session?.context || "").trim() || undefined,
    });
}

export async function planPhenotypeSemanticSearchQuery(
    rawQuery,
    { session = null, interactiveLlmAvailable = false } = {}
) {
    const originalQuery = String(rawQuery || "").trim();
    if (!originalQuery) {
        throw new Error("Describe what traits and gene sets to search for.");
    }

    const idLabelMap = buildPhenotypeIdLabelMap(originalQuery, { session });
    const deterministicQuery = applyDeterministicPhenotypeTranslations(
        originalQuery,
        idLabelMap
    );

    const shouldUseLlm =
        interactiveLlmAvailable &&
        (Object.keys(idLabelMap).length > 0 || queryStillHasOpaqueTraitIds(deterministicQuery));

    if (!shouldUseLlm) {
        return {
            searchQuery: deterministicQuery || originalQuery,
            originalQuery,
            idLabelMap,
            method: "deterministic",
        };
    }

    try {
        const raw = await sendPhenotypeSearchPrompt(
            buildPhenotypeSearchUserPrompt(originalQuery, { session, idLabelMap })
        );
        const json = parsePhenotypeSearchJson(raw);
        const llmQuery = String(json?.search_query || "").trim();
        if (llmQuery) {
            return {
                searchQuery: llmQuery,
                originalQuery,
                idLabelMap,
                method: "llm",
            };
        }
    } catch (error) {
        if (process.env.NODE_ENV === "development") {
            console.warn("[Canvas Assist] phenotype search query LLM failed", error);
        }
    }

    return {
        searchQuery: deterministicQuery || originalQuery,
        originalQuery,
        idLabelMap,
        method: "deterministic",
    };
}
