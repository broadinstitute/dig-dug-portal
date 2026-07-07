/** Trait → gene set expansion via phenotype-mode semantic search. */

import { CANVAS_ASSISTANT_PER_STEP_MAX } from "./revealKgBulkWorkflowGuidance.js";
import {
    addNodesToWorkspaceGraph,
    graphNodeToAnchorItem,
    findGraphNode,
} from "./revealKgGraphBootstrap.js";
import { planPhenotypeSemanticSearchQuery } from "./revealKgPhenotypeQueryTranslate.js";

/** Max trait–gene set pairs to fetch from phenotype semantic search per trait. */
export const TRAIT_GENE_SET_PAIR_SEARCH_MAX = 50;
export const TRAIT_GENE_SET_PAIR_SEARCH_DEFAULT = TRAIT_GENE_SET_PAIR_SEARCH_MAX;

/** Max gene set nodes to add to the canvas per expand step. */
export const TRAIT_GENE_SET_GRAPH_ADD_MAX = CANVAS_ASSISTANT_PER_STEP_MAX;
const DEFAULT_GRAPH_ADD_LIMIT = 15;

export function isTraitGeneSetExpandOptions(options = {}) {
    return String(options?.target_type || "").trim() === "gene_set";
}

export function resolveTraitGeneSetPairSearchLimit(rawLimit) {
    const raw = Number(rawLimit);
    if (!Number.isFinite(raw) || raw < 1) {
        return TRAIT_GENE_SET_PAIR_SEARCH_DEFAULT;
    }
    return Math.min(TRAIT_GENE_SET_PAIR_SEARCH_MAX, Math.max(1, Math.floor(raw)));
}

export function resolveTraitGeneSetGraphAddLimit(rawLimit) {
    const raw = Number(rawLimit);
    if (!Number.isFinite(raw) || raw < 1) {
        return DEFAULT_GRAPH_ADD_LIMIT;
    }
    return Math.min(TRAIT_GENE_SET_GRAPH_ADD_MAX, Math.max(1, Math.floor(raw)));
}

export function traitGeneSetGraphAddLimitFromSession(session) {
    return resolveTraitGeneSetGraphAddLimit(session?.controls?.limit);
}

function itemNodeType(item) {
    return String(item?.node_type || item?.type || "").toLowerCase();
}

export function isTraitAnchorItem(item) {
    return itemNodeType(item) === "trait";
}

export function traitSeedItemsFromAnchors(anchorItems = []) {
    return (anchorItems || []).filter(isTraitAnchorItem);
}

export function intentFromTraitGeneSetExpandLabel(label) {
    const text = String(label || "");
    const quoted = text.match(/\bwith intent\s+['"]([^'"]+)['"]/i);
    if (quoted?.[1]?.trim()) {
        return quoted[1].trim();
    }
    return "";
}

export function resolveTraitGeneSetExpandIntent(options = {}, stepLabel = "", userQuery = "") {
    const fromOptions = String(options?.intent || "").trim();
    if (fromOptions) {
        return fromOptions;
    }
    const fromLabel = intentFromTraitGeneSetExpandLabel(stepLabel);
    if (fromLabel) {
        return fromLabel;
    }
    const query = String(userQuery || "").trim();
    const forMatch = query.match(/\bfor\s+(.+)$/i);
    if (forMatch?.[1]?.trim()) {
        return forMatch[1].trim();
    }
    return "";
}

export function traitGeneSetExpandUsesSemanticSearch(intent) {
    return Boolean(String(intent || "").trim());
}

export function traitGeneSetExpandModeFromIntent(intent) {
    return traitGeneSetExpandUsesSemanticSearch(intent) ? "semantic" : "connections";
}

export function prepareTraitGeneSetExpandExecution(
    seedItems = [],
    options = {},
    { stepLabel = "", userQuery = "" } = {}
) {
    const traits = traitSeedItemsFromAnchors(seedItems);
    if (!traits.length || traits.length !== seedItems.length) {
        return null;
    }
    const wantsGeneSets =
        String(options?.target_type || "").trim() === "gene_set" ||
        mentionsExpandTraitToGeneSets(userQuery) ||
        mentionsExpandTraitToGeneSets(stepLabel);
    if (!wantsGeneSets) {
        return null;
    }
    const intent = resolveTraitGeneSetExpandIntent(options, stepLabel, userQuery);
    const limit = resolveTraitGeneSetGraphAddLimit(options.count);
    if (!traitGeneSetExpandUsesSemanticSearch(intent)) {
        return {
            targetType: "gene_set",
            expandMode: "connections",
            limit,
        };
    }
    return {
        targetType: "gene_set",
        expandMode: "semantic",
        expandFilters: {
            intent,
            relevanceEnabled: true,
            relevanceMode: options.relevance_mode || "llm",
        },
        limit,
    };
}

export function shouldUseTraitGeneSetExpand(anchorItems = [], targetType = "all") {
    if (String(targetType || "all") !== "gene_set") {
        return false;
    }
    const traits = traitSeedItemsFromAnchors(anchorItems);
    return traits.length > 0 && traits.length === (anchorItems || []).length;
}

export function extendExpandTargetTypes(anchorItems = [], baseTypes = []) {
    const types = [...(baseTypes || [])];
    if (
        shouldUseTraitGeneSetExpand(anchorItems, "gene_set") ||
        (traitSeedItemsFromAnchors(anchorItems).length === anchorItems.length &&
            anchorItems.length > 0)
    ) {
        if (!types.includes("gene_set")) {
            types.push("gene_set");
        }
    }
    return types;
}

export function composeTraitGeneSetExpandQuery(traitItem, intent) {
    const label = String(traitItem?.label || traitItem?.node_id || "").trim();
    const trimmedIntent = String(intent || "").trim();
    if (!label || !trimmedIntent) {
        return "";
    }
    return `${label}: ${trimmedIntent}`;
}

function pairScore(pair) {
    return Number(pair?.score ?? pair?.gene_set?.score ?? 0);
}

function normalizeCatalogRow(row) {
    const nodeType = String(row?.node_type || row?.type || "").toLowerCase();
    return {
        node_id: row.node_id,
        node_type: nodeType || "gene_set",
        type: nodeType || "gene_set",
        label: row.label || row.node_id,
        subtitle: row.subtitle || "",
        description: row.description || "",
    };
}

export function rowsFromTraitGeneSetExpandPairs(
    pairs = [],
    { existingNodeIds = [], geneSetLimit = TRAIT_GENE_SET_GRAPH_ADD_MAX, limit } = {}
) {
    const cap = resolveTraitGeneSetGraphAddLimit(
        geneSetLimit !== undefined ? geneSetLimit : limit
    );
    const seen = new Set(existingNodeIds || []);
    const ranked = [...(pairs || [])].sort((left, right) => pairScore(right) - pairScore(left));
    const rows = [];
    let geneSetsAdded = 0;

    for (const pair of ranked) {
        const geneSet = pair?.gene_set;
        const trait = pair?.trait;
        if (!geneSet?.node_id || seen.has(geneSet.node_id)) {
            continue;
        }

        if (trait?.node_id && !seen.has(trait.node_id)) {
            seen.add(trait.node_id);
            rows.push(normalizeCatalogRow(trait));
        }

        seen.add(geneSet.node_id);
        rows.push(normalizeCatalogRow(geneSet));
        geneSetsAdded += 1;

        if (geneSetsAdded >= cap) {
            return { rows, capped: true, geneSetsAdded };
        }
    }

    return { rows, capped: false, geneSetsAdded };
}

export function mentionsExpandTraitToGeneSets(query) {
    const text = String(query || "");
    if (!/\bexpand\b/i.test(text) || !/\bgene[\s-]?sets?\b/i.test(text)) {
        return false;
    }
    if (/\b(?:trait|traits|phenotype|phenotypes)\b/i.test(text)) {
        return true;
    }
    if (/\bfrom\b/i.test(text)) {
        return true;
    }
    return false;
}

export function wantsTraitGeneSetExpandWithoutIntent() {
    return false;
}

export function traitGeneSetExpandClarifyJson(userQuery = "") {
    const query = String(userQuery || "").trim();
    return {
        response_type: "clarify",
        message:
            "Expanding a trait to gene sets needs a short research intent so semantic search can rank relevant gene sets.",
        issues: [
            query
                ? `Expand request lacks intent: "${query}"`
                : "Expand request lacks intent.",
        ],
        suggestions: [
            'Example: "Expand gene sets from Type 2 diabetes for pancreatic islet dysfunction"',
            'Example: "Expand from selected traits to gene sets related to adipose inflammation"',
        ],
    };
}

async function searchPairsForTrait(
    apiClient,
    traitItem,
    intent,
    pairLimit,
    { session, interactiveLlmAvailable, onProgress }
) {
    const composedQuery = composeTraitGeneSetExpandQuery(traitItem, intent);
    if (!composedQuery) {
        return { pairs: [], searchQuery: "" };
    }

    onProgress?.(
        traitSeedItemsFromAnchors([traitItem]).length > 1
            ? `Searching gene sets for ${traitItem.label || traitItem.node_id}…`
            : "Searching trait–gene set associations…"
    );

    const prepared = await planPhenotypeSemanticSearchQuery(composedQuery, {
        session,
        interactiveLlmAvailable,
    });
    const payload = await apiClient.searchInteractivePhenotypeGeneSets(
        prepared.searchQuery,
        pairLimit
    );
    return {
        pairs: payload?.pairs || [],
        searchQuery: prepared.searchQuery,
        originalQuery: prepared.originalQuery,
        method: payload?.method || "",
    };
}

export async function resolveTraitGeneSetExpandRows(
    apiClient,
    traitItems,
    intent,
    limit,
    {
        existingNodeIds = [],
        session = null,
        interactiveLlmAvailable = false,
        onProgress,
    } = {}
) {
    const trimmedIntent = String(intent || "").trim();
    if (!trimmedIntent) {
        throw new Error(
            "Describe what gene sets you want to expand from this trait (intent is required)."
        );
    }
    if (!apiClient?.searchInteractivePhenotypeGeneSets) {
        throw new Error("Phenotype gene-set search API is not configured.");
    }

    const traits = traitSeedItemsFromAnchors(traitItems);
    if (!traits.length) {
        throw new Error("Select at least one trait node to expand to gene sets.");
    }

    const graphAddLimit = resolveTraitGeneSetGraphAddLimit(limit);
    const pairLimit = resolveTraitGeneSetPairSearchLimit(TRAIT_GENE_SET_PAIR_SEARCH_DEFAULT);
    const mergedPairs = [];

    if (traits.length === 1) {
        const result = await searchPairsForTrait(apiClient, traits[0], trimmedIntent, pairLimit, {
            session,
            interactiveLlmAvailable,
            onProgress,
        });
        mergedPairs.push(...result.pairs);
    } else {
        onProgress?.("Translating phenotype terms for search…");
        for (const traitItem of traits) {
            const result = await searchPairsForTrait(
                apiClient,
                traitItem,
                trimmedIntent,
                pairLimit,
                {
                    session,
                    interactiveLlmAvailable,
                    onProgress,
                }
            );
            mergedPairs.push(...result.pairs);
        }
    }

    const { rows, capped } = rowsFromTraitGeneSetExpandPairs(mergedPairs, {
        existingNodeIds,
        geneSetLimit: graphAddLimit,
    });

    if (!rows.length) {
        throw new Error("No relevant trait–gene set pairs found.");
    }

    return {
        rows,
        capped,
        pairCount: mergedPairs.length,
        traitCount: traits.length,
        searchIntent: trimmedIntent,
    };
}

export async function expandTraitToGeneSetsOnSession(
    session,
    {
        apiClient,
        anchorItems = [],
        intent,
        limit,
        onProgress = () => {},
        interactiveLlmAvailable = false,
    } = {}
) {
    if (!session) {
        throw new Error("No active graph session.");
    }
    if (!apiClient?.getInteractiveSessionNodeLinks) {
        throw new Error("Interactive API client is not configured.");
    }

    const traits = traitSeedItemsFromAnchors(anchorItems);
    if (!traits.length) {
        throw new Error("Select trait nodes to expand to gene sets.");
    }

    const existingNodeIds = (session.graphNodes || []).map((node) => node.id).filter(Boolean);
    const resolved = await resolveTraitGeneSetExpandRows(
        apiClient,
        traits,
        intent,
        limit,
        {
            existingNodeIds,
            session,
            interactiveLlmAvailable,
            onProgress,
        }
    );

    onProgress?.("Adding traits and gene sets to the graph…");
    const previousCount = session.graphNodes?.length || 0;
    const nextSession = await addNodesToWorkspaceGraph(apiClient, session, resolved.rows);
    const addedCount = Math.max(0, (nextSession.graphNodes?.length || 0) - previousCount);

    if (!addedCount) {
        throw new Error("No relevant trait–gene set pairs found.");
    }

    const addedItems = resolved.rows
        .filter((row) => !existingNodeIds.includes(row.node_id))
        .map((row) => ({
            node_id: row.node_id,
            label: row.label,
            subtitle: row.subtitle || "",
        }));

    return {
        session: {
            ...nextSession,
            graphInterpretation: null,
        },
        addedCount: addedItems.length,
        addedItems,
        meta: {
            expandMode: "trait_gene_set",
            traitCount: resolved.traitCount,
            pairCount: resolved.pairCount,
            searchIntent: resolved.searchIntent,
        },
    };
}

export function traitAnchorItemsFromSession(session, nodeIds = []) {
    return (nodeIds || [])
        .map((nodeId) => graphNodeToAnchorItem(findGraphNode(session, nodeId)))
        .filter(isTraitAnchorItem);
}
