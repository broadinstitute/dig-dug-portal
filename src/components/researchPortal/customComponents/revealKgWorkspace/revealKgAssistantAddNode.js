/** Resolve catalog rows for assistant add_node steps. */

import { CANVAS_ASSISTANT_PER_STEP_MAX } from "./revealKgBulkWorkflowGuidance.js";
import { ASSISTANT_NODE_TYPES } from "./revealKgAssistantTools.js";
import { findGraphNode } from "./revealKgGraphBootstrap.js";
import { resolveAssistantTargetNodeIds } from "./revealKgAssistantTargetResolve.js";

const RANKED_CATALOG_NODE_TYPES = new Set(["gene_set", "trait", "factor"]);

function catalogNodeTypeLabel(nodeType) {
    switch (nodeType) {
        case "gene_set":
            return "gene set";
        case "factor":
            return "mechanism";
        case "trait":
            return "trait";
        case "gene":
            return "gene";
        default:
            return String(nodeType || "catalog").replace(/_/g, " ");
    }
}

function normalizeCatalogItem(item, fallbackType = "gene") {
    const nodeId = item?.node_id || item?.id;
    if (!nodeId) {
        return null;
    }
    const nodeType = item?.node_type || item?.type || fallbackType;
    return {
        node_id: nodeId,
        node_type: nodeType,
        type: nodeType,
        label: item?.label || nodeId,
        subtitle: item?.subtitle || "",
    };
}

function rowFromGraphNode(node) {
    if (!node) {
        return null;
    }
    return normalizeCatalogItem(
        {
            node_id: node.id || node.node_id,
            node_type: node.node_type || node.type,
            label: node.label,
            subtitle: node.subtitle,
        },
        "gene"
    );
}

function normalizeAddNodeLimit(options = {}) {
    const raw = options.limit ?? options.count;
    if (raw === undefined || raw === null || raw === "") {
        return 1;
    }
    return Math.min(CANVAS_ASSISTANT_PER_STEP_MAX, Math.max(1, Number(raw) || 1));
}

/** Multi-word or descriptive lowercase text — not a single gene symbol lookup. */
export function isCatalogPhraseQuery(query) {
    const text = String(query || "").trim();
    if (!text) {
        return false;
    }
    if (/\s/.test(text)) {
        return true;
    }
    if (text.length > 5 && text === text.toLowerCase()) {
        return true;
    }
    return false;
}

/**
 * Use API-ranked catalog results instead of exact/prefix symbol matching.
 * Gene sets, traits, and mechanisms always support phrase search; genes only when
 * limit > 1 or the query looks like a phrase (not a single symbol).
 */
export function usesRankedCatalogMatching(nodeType, query, limit = 1) {
    const cappedLimit = normalizeAddNodeLimit({ limit });
    if (cappedLimit > 1) {
        return true;
    }
    if (RANKED_CATALOG_NODE_TYPES.has(nodeType)) {
        return isCatalogPhraseQuery(query);
    }
    if (nodeType === "gene") {
        return isCatalogPhraseQuery(query);
    }
    return false;
}

export async function fetchCatalogItems(apiClient, nodeType, query, limit) {
    const text = String(query || "").trim();
    if (!text || !apiClient) {
        return [];
    }
    const cappedLimit = Math.min(
        CANVAS_ASSISTANT_PER_STEP_MAX,
        Math.max(1, Number(limit) || 1)
    );
    const payload =
        nodeType === "gene_set"
            ? await apiClient.searchInteractiveGeneSets(text, cappedLimit)
            : await apiClient.searchInteractiveCatalog(nodeType, text, cappedLimit);
    return (payload?.items || [])
        .map((item) => normalizeCatalogItem(item, nodeType))
        .filter(Boolean);
}

function pickSingleCatalogMatch(items, query) {
    const text = String(query || "").trim();
    if (!text || !items.length) {
        return null;
    }
    const lower = text.toLowerCase();
    const exact = items.find(
        (item) => String(item?.label || "").trim().toLowerCase() === lower
    );
    if (exact) {
        return exact;
    }
    if (items.length === 1) {
        return items[0];
    }
    const prefix = items.find((item) =>
        String(item?.label || "")
            .trim()
            .toLowerCase()
            .startsWith(lower)
    );
    return prefix || null;
}

export async function searchCatalogRows(apiClient, nodeType, query, limit = 1) {
    const cappedLimit = normalizeAddNodeLimit({ limit });
    const items = await fetchCatalogItems(apiClient, nodeType, query, cappedLimit);
    if (!items.length) {
        return [];
    }
    if (usesRankedCatalogMatching(nodeType, query, cappedLimit)) {
        return items.slice(0, cappedLimit);
    }
    const match = pickSingleCatalogMatch(items, query);
    return match ? [match] : [];
}

function collectAddNodeLabels(target = {}, options = {}) {
    return [
        ...(target.node_labels || []),
        ...(options.search_label ? [options.search_label] : []),
    ]
        .map((label) => String(label || "").trim())
        .filter(Boolean);
}

function shouldSkipOnGraphLabelResolution(options = {}, nodeType = "gene") {
    const searchLabel = String(options.search_label || "").trim();
    if (!searchLabel) {
        return false;
    }
    const limit = normalizeAddNodeLimit(options);
    return limit > 1 || usesRankedCatalogMatching(nodeType, searchLabel, limit);
}

/** Match only explicitly named nodes — never treat scope "all" / "node_types" as on-graph hits. */
function resolveExplicitAddNodeOnGraphIds(session, target = {}, labels = [], nodeType = null) {
    if (target.node_ids?.length) {
        return resolveAssistantTargetNodeIds(
            session,
            {
                ...target,
                scope: target.node_ids.length > 1 ? "nodes" : "node",
                node_types: nodeType ? [nodeType] : target.node_types,
            },
            {}
        );
    }
    if (!labels.length) {
        return [];
    }
    return resolveAssistantTargetNodeIds(
        session,
        {
            ...target,
            scope: labels.length > 1 ? "nodes" : "node",
            node_labels: labels,
            node_types: nodeType ? [nodeType] : target.node_types,
        },
        {}
    );
}

/**
 * Resolve one or more catalog rows to add locally (may already be on graph).
 */
export async function resolveAssistantAddNodeRows(session, target = {}, options = {}, runtime = {}) {
    const { apiClient } = runtime;
    const nodeType = ASSISTANT_NODE_TYPES.includes(options.node_type)
        ? options.node_type
        : target.node_types?.[0] && ASSISTANT_NODE_TYPES.includes(target.node_types[0])
          ? target.node_types[0]
          : "gene";
    const limit = normalizeAddNodeLimit(options);

    const labels = collectAddNodeLabels(target, options);
    const onGraphLabels = shouldSkipOnGraphLabelResolution(options, nodeType)
        ? (target.node_labels || [])
              .map((label) => String(label || "").trim())
              .filter(Boolean)
        : labels;
    const onGraphIds = resolveExplicitAddNodeOnGraphIds(session, target, onGraphLabels, nodeType);
    if (onGraphIds.length && onGraphLabels.length) {
        return onGraphIds
            .map((nodeId) => rowFromGraphNode(findGraphNode(session, nodeId)))
            .filter(Boolean);
    }

    if (!labels.length) {
        throw new Error("add_node requires a node label or a resolvable target.");
    }
    if (!apiClient?.searchInteractiveCatalog && nodeType !== "gene_set") {
        throw new Error("Catalog search API is not configured.");
    }
    if (!apiClient?.searchInteractiveGeneSets && nodeType === "gene_set") {
        throw new Error("Gene set search API is not configured.");
    }

    if (labels.length === 1 && (limit > 1 || usesRankedCatalogMatching(nodeType, labels[0], limit))) {
        const rows = await searchCatalogRows(apiClient, nodeType, labels[0], limit);
        if (!rows.length) {
            throw new Error(
                `No ${catalogNodeTypeLabel(nodeType)} catalog matches found for "${labels[0]}".`
            );
        }
        return rows;
    }

    const rows = [];
    for (const label of labels) {
        const matches = await searchCatalogRows(apiClient, nodeType, label, 1);
        if (!matches.length) {
            throw new Error(`Could not find "${label}" in the ${catalogNodeTypeLabel(nodeType)} catalog.`);
        }
        rows.push(matches[0]);
    }
    return rows;
}
