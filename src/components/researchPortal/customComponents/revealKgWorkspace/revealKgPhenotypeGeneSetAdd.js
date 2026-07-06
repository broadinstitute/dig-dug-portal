/** Phenotype-mode gene-set search: trait + gene_set pairs for assistant add. */

import { CANVAS_ASSISTANT_PER_STEP_MAX } from "./revealKgBulkWorkflowGuidance.js";
import { parseExplicitIntentNodeTypes } from "./revealKgIntentAddNodes.js";
import { mentionsDemoGeneSetsInQuery } from "./revealKgDemoGeneSets.js";
import { planPhenotypeSemanticSearchQuery } from "./revealKgPhenotypeQueryTranslate.js";

const MAX_TOTAL_NODES = CANVAS_ASSISTANT_PER_STEP_MAX;
const DEFAULT_PAIR_LIMIT = 10;

function normalizePairLimit(limit) {
    if (limit === undefined || limit === null || limit === "") {
        return DEFAULT_PAIR_LIMIT;
    }
    return Math.min(MAX_TOTAL_NODES, Math.max(1, Number(limit) || DEFAULT_PAIR_LIMIT));
}

export function mentionsPhenotypeAndGeneSetInQuery(query) {
    const text = String(query || "");
    const hasGeneSet = /\bgene[\s-]?sets?\b/i.test(text);
    const hasTraitOrPhenotype = /\b(?:phenotypes?|traits?)\b/i.test(text);
    return hasGeneSet && hasTraitOrPhenotype;
}

function looksLikeUnspecifiedIntentAddQuery(query) {
    const text = String(query || "").trim();
    if (!text) {
        return false;
    }
    if (/\badd\b\s+(?:the\s+)?[A-Za-z0-9-]+\b/i.test(text) && text.length < 48) {
        return false;
    }
    return (
        /\bfind\b/i.test(text) ||
        /\badd\b[\s\S]*\b(?:nodes?|gene[\s-]?sets?|mechanisms?|factors?|traits?|phenotypes?)\b/i.test(
            text
        ) ||
        /\b(search|discover|identify)\b[\s\S]*\b(?:mechanism|pathway|trait|phenotype|gene[\s-]?set)/i.test(
            text
        ) ||
        (text.length > 36 &&
            /\b(that could|related to|involving|alter|affect|handling|coagulation|associated with)\b/i.test(
                text
            ))
    );
}

/**
 * Route to phenotype-mode gene-set search when the user wants trait+gene_set pairs
 * or did not specify node types (open-ended research questions).
 */
export function shouldUsePhenotypeGeneSetAdd(query) {
    const text = String(query || "").trim();
    if (!text || mentionsDemoGeneSetsInQuery(text)) {
        return false;
    }

    const explicitTypes = parseExplicitIntentNodeTypes(text);

    if (explicitTypes?.length === 1) {
        return false;
    }
    if (explicitTypes?.includes("factor")) {
        return false;
    }
    if (mentionsPhenotypeAndGeneSetInQuery(text)) {
        return true;
    }
    if (
        explicitTypes?.includes("gene_set") &&
        explicitTypes?.includes("trait")
    ) {
        return true;
    }
    if (!explicitTypes && looksLikeUnspecifiedIntentAddQuery(text)) {
        if (
            /\bgene[\s-]?sets?\b/i.test(text) &&
            !/\b(?:phenotypes?|traits?)\b/i.test(text)
        ) {
            return false;
        }
        return true;
    }
    return false;
}

function catalogRowsFromPair(pair) {
    if (!pair?.trait?.node_id || !pair?.gene_set?.node_id) {
        return [];
    }
    return [pair.trait, pair.gene_set];
}

export function rowsFromPhenotypeGeneSetPairs(pairs = [], { existingNodeIds = [] } = {}) {
    const seen = new Set(existingNodeIds || []);
    const rows = [];

    for (const pair of pairs || []) {
        for (const row of catalogRowsFromPair(pair)) {
            if (!row?.node_id || seen.has(row.node_id)) {
                continue;
            }
            seen.add(row.node_id);
            rows.push(row);
            if (rows.length >= MAX_TOTAL_NODES) {
                return { rows, capped: true };
            }
        }
    }

    return { rows, capped: false };
}

export async function resolvePhenotypeGeneSetRows(
    apiClient,
    query,
    limit,
    {
        existingNodeIds = [],
        session = null,
        interactiveLlmAvailable = false,
        onProgress,
    } = {}
) {
    const text = String(query || "").trim();
    if (!text) {
        throw new Error("Describe what traits and gene sets to search for.");
    }
    if (!apiClient?.searchInteractivePhenotypeGeneSets) {
        throw new Error("Phenotype gene-set search API is not configured.");
    }

    onProgress?.("Translating phenotype terms for search…");
    const prepared = await planPhenotypeSemanticSearchQuery(text, {
        session,
        interactiveLlmAvailable,
    });

    onProgress?.("Searching trait–gene set associations…");
    const pairLimit = normalizePairLimit(limit);
    const payload = await apiClient.searchInteractivePhenotypeGeneSets(
        prepared.searchQuery,
        pairLimit
    );
    const pairs = payload?.pairs || [];
    const { rows, capped } = rowsFromPhenotypeGeneSetPairs(pairs, { existingNodeIds });

    if (!rows.length) {
        throw new Error(
            `No matching trait–gene set associations were found for "${prepared.searchQuery}".`
        );
    }

    return {
        rows,
        pairs,
        pairCount: pairs.length,
        capped,
        method: payload?.method || "",
        searchQuery: prepared.searchQuery,
        originalQuery: prepared.originalQuery,
        queryTranslations: prepared.idLabelMap,
        queryPreparationMethod: prepared.method,
    };
}
