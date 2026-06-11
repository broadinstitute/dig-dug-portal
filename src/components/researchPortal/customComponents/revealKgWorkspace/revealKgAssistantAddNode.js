/** Resolve catalog rows for assistant add_node steps. */

import { ASSISTANT_NODE_TYPES } from "./revealKgAssistantTools.js";
import { findGraphNode } from "./revealKgGraphBootstrap.js";
import { resolveAssistantTargetNodeIds } from "./revealKgAssistantTargetResolve.js";

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

async function searchCatalogRow(apiClient, nodeType, query) {
    const text = String(query || "").trim();
    if (!text || !apiClient) {
        return null;
    }
    const payload =
        nodeType === "gene_set"
            ? await apiClient.searchInteractiveGeneSets(text, 5)
            : await apiClient.searchInteractiveCatalog(nodeType, text, 5);
    const items = payload?.items || [];
    const exact = items.find(
        (item) => String(item?.label || "").trim().toLowerCase() === text.toLowerCase()
    );
    if (exact) {
        return normalizeCatalogItem(exact, nodeType);
    }
    if (items.length === 1) {
        return normalizeCatalogItem(items[0], nodeType);
    }
    const prefix = items.find((item) =>
        String(item?.label || "")
            .trim()
            .toLowerCase()
            .startsWith(text.toLowerCase())
    );
    return prefix ? normalizeCatalogItem(prefix, nodeType) : null;
}

function collectAddNodeLabels(target = {}, options = {}) {
    return [
        ...(target.node_labels || []),
        ...(options.search_label ? [options.search_label] : []),
    ]
        .map((label) => String(label || "").trim())
        .filter(Boolean);
}

/** Match only explicitly named nodes — never treat scope "all" / "node_types" as on-graph hits. */
function resolveExplicitAddNodeOnGraphIds(session, target = {}, labels = []) {
    if (target.node_ids?.length) {
        return resolveAssistantTargetNodeIds(
            session,
            {
                ...target,
                scope: target.node_ids.length > 1 ? "nodes" : "node",
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

    const labels = collectAddNodeLabels(target, options);
    const onGraphIds = resolveExplicitAddNodeOnGraphIds(session, target, labels);
    if (onGraphIds.length && labels.length) {
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

    const rows = [];
    for (const label of labels) {
        const row = await searchCatalogRow(apiClient, nodeType, label);
        if (!row) {
            throw new Error(`Could not find "${label}" in the ${nodeType} catalog.`);
        }
        rows.push(row);
    }
    return rows;
}
