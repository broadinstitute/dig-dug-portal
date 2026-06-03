/** Bootstrap workspace graph from interactive anchor / connection APIs. */

import { starterItemsFromBuckets } from "./revealKgEntityUtils.js";
import {
    ledgerEntryFromGraphNode,
    markGraphNodesShownInLedger,
    mergeRetrievalLedger,
} from "./revealKgRetrievalLedger.js";

const NEIGHBOR_TARGET_ORDER = ["gene", "trait", "factor"];

function itemNodeType(item) {
    return String(item.node_type || item.type || "").toLowerCase();
}

export function getAvailableConnectionTargetTypes(anchorItems, connectionScope = "direct") {
    if (connectionScope === "expanded") {
        return ["gene", "trait", "factor"];
    }
    const directMap = {
        gene: ["trait", "factor"],
        trait: ["gene", "factor"],
        factor: ["gene", "trait", "factor"],
        gene_set: ["gene", "trait", "factor"],
    };
    const available = new Set();
    for (const item of anchorItems || []) {
        for (const targetType of directMap[itemNodeType(item)] || []) {
            available.add(targetType);
        }
    }
    return NEIGHBOR_TARGET_ORDER.filter((targetType) => available.has(targetType));
}

function mergeOriginTags(existing, additions) {
    return [...new Set([...(existing || []), ...(additions || [])])];
}

function normalizeGraphNode(raw, { forceAnchor = false, originTag = null } = {}) {
    const id = raw.id || raw.node_id;
    if (!id) {
        return null;
    }
    const type = String(raw.type || raw.node_type || "").toLowerCase();
    const isAnchor = Boolean(forceAnchor || raw.is_anchor);
    return {
        ...raw,
        id,
        node_id: id,
        type,
        node_type: type,
        label: raw.label || id,
        subtitle: raw.subtitle || "",
        is_anchor: isAnchor,
        origin_tags: mergeOriginTags(raw.origin_tags, [
            ...(originTag ? [originTag] : []),
            ...(isAnchor ? ["anchor"] : []),
        ]),
    };
}

function normalizeGraphEdge(edge, originTag = null) {
    const source = edge.source || edge.source_id || edge.source_node_id;
    const target = edge.target || edge.target_id || edge.target_node_id;
    if (!source || !target) {
        return null;
    }
    return {
        ...edge,
        id: edge.id || `${source}->${target}`,
        source,
        target,
        origin_tags: mergeOriginTags(edge.origin_tags, originTag ? [originTag] : []),
    };
}

function mergeGraphPayload(graphNodes, graphEdges, nodes, edges, originTag) {
    const nodeMap = new Map((graphNodes || []).map((node) => [node.id, node]));
    const edgeMap = new Map((graphEdges || []).map((edge) => [edge.id, edge]));

    for (const raw of nodes || []) {
        const node = normalizeGraphNode(raw, { originTag });
        if (!node) {
            continue;
        }
        const existing = nodeMap.get(node.id);
        if (!existing) {
            nodeMap.set(node.id, node);
        } else {
            nodeMap.set(node.id, {
                ...existing,
                ...node,
                is_anchor: Boolean(existing.is_anchor || node.is_anchor),
                origin_tags: mergeOriginTags(existing.origin_tags, node.origin_tags),
            });
        }
    }

    for (const raw of edges || []) {
        const edge = normalizeGraphEdge(raw, originTag);
        if (!edge || edgeMap.has(edge.id)) {
            continue;
        }
        edgeMap.set(edge.id, edge);
    }

    return {
        graphNodes: Array.from(nodeMap.values()),
        graphEdges: Array.from(edgeMap.values()),
    };
}

function interleaveCandidateLanes(candidateLanes, limit = 20) {
    const laneTypes = NEIGHBOR_TARGET_ORDER.filter((entityType) => (candidateLanes[entityType] || []).length);
    const positions = Object.fromEntries(laneTypes.map((entityType) => [entityType, 0]));
    const results = [];
    const seen = new Set();

    function nextFromLane(entityType) {
        const lane = candidateLanes[entityType] || [];
        while (positions[entityType] < lane.length) {
            const item = lane[positions[entityType]];
            positions[entityType] += 1;
            const candidateId = item?.candidate?.node_id;
            if (!candidateId || seen.has(candidateId)) {
                continue;
            }
            seen.add(candidateId);
            return item;
        }
        return null;
    }

    while (results.length < limit) {
        let added = false;
        for (const entityType of laneTypes) {
            const item = nextFromLane(entityType);
            if (item) {
                results.push(item);
                added = true;
                if (results.length >= limit) {
                    break;
                }
            }
        }
        if (!added) {
            break;
        }
    }
    return results;
}

export function anchorItemsFromBuckets(buckets) {
    return starterItemsFromBuckets(buckets).map((item) => ({
        node_id: item.node_id,
        label: item.label,
        subtitle: item.subtitle || "",
        node_type: item.node_type || item.type,
    }));
}

export function starterGraphNodesFromAnchorItems(anchorItems) {
    return anchorItems
        .map((item) => normalizeGraphNode(item, { forceAnchor: true, originTag: "anchor" }))
        .filter(Boolean);
}

export function normalizeWorkspaceGraph(graphNodes = [], graphEdges = []) {
    const nodes = (graphNodes || [])
        .map((node) => normalizeGraphNode(node))
        .filter(Boolean);
    const nodeIds = new Set(nodes.map((node) => node.id));
    const edges = (graphEdges || [])
        .map((edge) => normalizeGraphEdge(edge))
        .filter((edge) => edge && nodeIds.has(edge.source) && nodeIds.has(edge.target));
    return { graphNodes: nodes, graphEdges: edges };
}

/**
 * Build initial graph from selected seeds.
 */
export async function buildInitialGraphFromAnchors({
    apiClient,
    anchorItems,
    context = "",
    addNeighboringNodes = true,
    neighborLimit = 20,
} = {}) {
    if (!apiClient?.getInteractiveAnchorLinks) {
        throw new Error("Interactive API client is not configured.");
    }
    if (!anchorItems?.length) {
        throw new Error("Choose at least one starting entity.");
    }

    let graphNodes = starterGraphNodesFromAnchorItems(anchorItems);
    let graphEdges = [];

    const anchorPayload = await apiClient.getInteractiveAnchorLinks({ anchor_items: anchorItems });
    ({ graphNodes, graphEdges } = mergeGraphPayload(
        graphNodes,
        graphEdges,
        anchorPayload.nodes || [],
        anchorPayload.edges || [],
        "anchor"
    ));

    let retrievalLedger = {};
    const allConnectionCandidates = [];

    if (addNeighboringNodes && apiClient.getInteractiveConnections) {
        const targetTypes = getAvailableConnectionTargetTypes(anchorItems, "direct");
        const candidateLanes = {};
        for (const targetType of targetTypes) {
            const payload = await apiClient.getInteractiveConnections({
                anchor_items: anchorItems,
                context: (context || "").trim(),
                target_type: targetType,
                reducer: "mean",
                connection_scope: "direct",
                limit: 100,
                exclude_node_ids: anchorItems.map((item) => item.node_id),
            });
            const lane = payload.candidates || [];
            candidateLanes[targetType] = lane;
            allConnectionCandidates.push(...lane);
        }
        retrievalLedger = mergeRetrievalLedger(
            { retrievalLedger },
            allConnectionCandidates,
            {}
        );
        const candidates = interleaveCandidateLanes(candidateLanes, neighborLimit);
        for (const item of candidates) {
            const candidate = item.candidate;
            if (!candidate?.node_id) {
                continue;
            }
            ({ graphNodes, graphEdges } = mergeGraphPayload(
                graphNodes,
                graphEdges,
                [{ ...candidate, is_anchor: false }],
                item.edges || [],
                "top"
            ));
        }
    }

    for (const node of graphNodes) {
        if (!retrievalLedger[node.id]) {
            retrievalLedger[node.id] = ledgerEntryFromGraphNode(node, "yes");
        }
    }
    retrievalLedger = markGraphNodesShownInLedger(retrievalLedger, graphNodes);

    return {
        anchorItems,
        graphNodes,
        graphEdges,
        retrievalLedger,
        context: context || "",
    };
}

/**
 * Add ledger rows to the visible graph via session node-links API (Playground manual add).
 */
export async function addNodesToWorkspaceGraph(apiClient, session, rows = []) {
    if (!apiClient?.getInteractiveSessionNodeLinks) {
        throw new Error("Interactive API client is not configured.");
    }
    const items = (rows || [])
        .map((row) => ({
            node_id: row.node_id || row.id,
            node_type: row.node_type || row.type,
            type: row.node_type || row.type,
            label: row.label || row.node_id,
            subtitle: row.subtitle || "",
        }))
        .filter((item) => item.node_id && item.node_type);
    if (!items.length) {
        return session;
    }

    const payload = await apiClient.getInteractiveSessionNodeLinks({
        existing_node_ids: (session.graphNodes || []).map((node) => node.id),
        new_items: items,
    });

    const { graphNodes, graphEdges } = mergeGraphPayload(
        session.graphNodes || [],
        session.graphEdges || [],
        payload.nodes || items,
        payload.edges || [],
        "manual"
    );

    const reasonByNodeId = Object.fromEntries(
        items.map((item) => [item.node_id, "yes"])
    );
    let retrievalLedger = mergeRetrievalLedger(
        { retrievalLedger: session.retrievalLedger || {} },
        items.map((item) => ({
            candidate: {
                node_id: item.node_id,
                node_type: item.node_type,
                label: item.label,
                subtitle: item.subtitle,
            },
            aggregate_score: 0,
            raw_max_score: 0,
            raw_mean_score: 0,
        })),
        { reasonByNodeId }
    );
    retrievalLedger = markGraphNodesShownInLedger(retrievalLedger, graphNodes);

    return {
        ...session,
        graphNodes,
        graphEdges,
        retrievalLedger,
    };
}

/**
 * Fetch dashed contextual edges for the visible graph (Playground parity).
 * Returns edges not already present in graphEdges.
 */
export async function fetchContextualEdgesForGraph(apiClient, graphNodes, graphEdges) {
    if (!apiClient?.getInteractiveContextualEdges) {
        return [];
    }
    const nodeIds = (graphNodes || [])
        .map((node) => node.id)
        .filter(Boolean)
        .sort();
    if (nodeIds.length < 2) {
        return [];
    }
    const payload = await apiClient.getInteractiveContextualEdges({ node_ids: nodeIds });
    const baseEdgeIds = new Set((graphEdges || []).map((edge) => edge.id));
    return (payload.edges || []).filter((edge) => edge?.id && !baseEdgeIds.has(edge.id));
}
