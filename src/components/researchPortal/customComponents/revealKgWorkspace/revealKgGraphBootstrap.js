/** Bootstrap workspace graph from interactive anchor / connection APIs. */

import { emptyStarterBuckets, starterItemsFromBuckets } from "./revealKgEntityUtils.js";
import {
    ledgerEntryFromGraphNode,
    markGraphNodesShownInLedger,
    mergeRetrievalLedger,
} from "./revealKgRetrievalLedger.js";
import { isGeneSetRow, logGeneSetAdd } from "./revealKgGeneSetDebug.js";

const NEIGHBOR_TARGET_ORDER = ["gene", "gene_set", "trait", "factor"];

function itemNodeType(item) {
    return String(item.node_type || item.type || "").toLowerCase();
}

export function getAvailableConnectionTargetTypes(anchorItems, connectionScope = "direct") {
    if (connectionScope === "expanded") {
        return ["gene", "gene_set", "trait", "factor"];
    }
    const directMap = {
        gene: ["trait", "factor"],
        trait: ["gene", "factor"],
        factor: ["gene", "trait", "factor", "gene_set"],
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

export function interleaveCandidateLanes(candidateLanes, limit = 20) {
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
    addNeighboringNodes = false,
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
        highlighted: initialKeyNodeIdsForGraph(graphNodes),
    };
}

export function graphNodeToAnchorItem(node) {
    if (!node?.id && !node?.node_id) {
        return null;
    }
    const nodeId = node.id || node.node_id;
    return {
        node_id: nodeId,
        label: node.label || nodeId,
        subtitle: node.subtitle || "",
        node_type: node.node_type || node.type,
    };
}

/** Persisted build anchors or `is_anchor` graph nodes (initial graph only; expand uses selected nodes). */
export function startingAnchorItemsFromSession(session) {
    const stored = session?.anchorItems || [];
    if (stored.length) {
        return stored;
    }
    return (session?.graphNodes || [])
        .filter((node) => isStartingGraphNode(node))
        .map((node) => graphNodeToAnchorItem(node))
        .filter(Boolean);
}

/** API `anchor_items` payload built from workspace selected nodes (`session.highlighted`). */
export function keyNodeItemsFromSession(session) {
    if (!session) {
        return [];
    }
    return normalizeKeyNodeIds(session)
        .map((nodeId) => graphNodeToAnchorItem(findGraphNode(session, nodeId)))
        .filter(Boolean);
}

function graphNodeIds(node) {
    return [node?.id, node?.node_id].filter(Boolean);
}

export function isStartingGraphNode(node) {
    return Boolean(node?.is_anchor);
}

/** Keep only selected-node ids that still exist on the graph (persisted as session.highlighted). */
export function normalizeKeyNodeIds(session) {
    const nodeIds = new Set();
    for (const node of session?.graphNodes || []) {
        if (node?.id) {
            nodeIds.add(node.id);
        }
        if (node?.node_id) {
            nodeIds.add(node.node_id);
        }
    }
    return Array.from(new Set((session?.highlighted || []).filter((id) => nodeIds.has(id))));
}

export function initialKeyNodeIdsForGraph(graphNodes) {
    return (graphNodes || [])
        .filter((node) => isStartingGraphNode(node))
        .map((node) => node.id || node.node_id)
        .filter(Boolean);
}

export function findGraphNode(session, nodeId) {
    if (!session || !nodeId) {
        return null;
    }
    return (session.graphNodes || []).find(
        (entry) => entry.id === nodeId || entry.node_id === nodeId
    );
}

export function isKeyNode(session, nodeId) {
    if (!nodeId) {
        return false;
    }
    return (session?.highlighted || []).includes(nodeId);
}

export function withNormalizedKeyNodes(session) {
    if (!session) {
        return session;
    }
    return {
        ...session,
        highlighted: normalizeKeyNodeIds(session),
    };
}

export function toggleKeyNode(session, nodeId) {
    if (!session || !nodeId) {
        return { session, changed: false };
    }
    const node = findGraphNode(session, nodeId);
    if (!node) {
        return { session, changed: false };
    }
    const highlighted = new Set(session.highlighted || []);
    const clearing = highlighted.has(nodeId);
    if (clearing) {
        highlighted.delete(nodeId);
    } else {
        highlighted.add(nodeId);
    }
    return {
        session: {
            ...session,
            highlighted: Array.from(highlighted),
        },
        changed: true,
        added: !clearing,
    };
}

export function addKeyNodesBatch(session, nodeIds = []) {
    if (!session) {
        return { session, changed: false, addedIds: [] };
    }
    const highlighted = new Set(session.highlighted || []);
    const addedIds = [];
    for (const nodeId of nodeIds) {
        if (!nodeId || !findGraphNode(session, nodeId) || highlighted.has(nodeId)) {
            continue;
        }
        highlighted.add(nodeId);
        addedIds.push(nodeId);
    }
    if (!addedIds.length) {
        return { session, changed: false, addedIds: [] };
    }
    return {
        session: {
            ...session,
            highlighted: Array.from(highlighted),
        },
        changed: true,
        addedIds,
    };
}

export function removeKeyNodesBatch(session, nodeIds = []) {
    if (!session) {
        return { session, changed: false, removedIds: [] };
    }
    const highlighted = new Set(session.highlighted || []);
    const removedIds = [];
    for (const nodeId of nodeIds) {
        if (!nodeId || !highlighted.has(nodeId) || !findGraphNode(session, nodeId)) {
            continue;
        }
        highlighted.delete(nodeId);
        removedIds.push(nodeId);
    }
    if (!removedIds.length) {
        return { session, changed: false, removedIds: [] };
    }
    return {
        session: {
            ...session,
            highlighted: Array.from(highlighted),
        },
        changed: true,
        removedIds,
    };
}

export function canRemoveGraphNode(session, nodeId) {
    if (!session || !nodeId) {
        return false;
    }
    const node = (session.graphNodes || []).find(
        (entry) => entry.id === nodeId || entry.node_id === nodeId
    );
    if (!node) {
        return false;
    }
    // Starting nodes are visual markers only; users may remove them from the graph.
    if (isStartingGraphNode(node)) {
        return true;
    }
    return !isKeyNode(session, nodeId);
}

export function countConnectedEdgesForNode(session, nodeId) {
    if (!session || !nodeId) {
        return 0;
    }
    const seen = new Set();
    let count = 0;
    for (const edge of [...(session.graphEdges || []), ...(session.contextualEdges || [])]) {
        if (edge.source !== nodeId && edge.target !== nodeId) {
            continue;
        }
        const key = edge.id || `${edge.source}->${edge.target}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        count += 1;
    }
    return count;
}

export function removeNodesFromWorkspaceGraph(session, nodeIds) {
    const removalSet = new Set((nodeIds || []).filter(Boolean));
    if (!removalSet.size || !session) {
        return session;
    }
    const graphNodes = (session.graphNodes || []).filter(
        (node) => !graphNodeIds(node).some((id) => removalSet.has(id))
    );
    const graphEdges = (session.graphEdges || []).filter(
        (edge) => !removalSet.has(edge.source) && !removalSet.has(edge.target)
    );
    const contextualEdges = (session.contextualEdges || []).filter(
        (edge) => !removalSet.has(edge.source) && !removalSet.has(edge.target)
    );
    const retrievalLedger = mergeRetrievalLedger(
        { retrievalLedger: session.retrievalLedger || {} },
        [],
        {
            reasonByNodeId: Object.fromEntries(
                [...removalSet].map((nodeId) => [nodeId, "hidden"])
            ),
        }
    );
    return {
        ...session,
        graphNodes,
        graphEdges,
        contextualEdges,
        retrievalLedger,
        contextualEdgeSignature: "",
        highlighted: (session.highlighted || []).filter((id) => !removalSet.has(id)),
    };
}

/**
 * Merge connection API candidates (node + edges) into the session graph.
 */
export function mergeConnectionCandidatesIntoSession(session, candidates = [], originTag = "top") {
    let graphNodes = [...(session.graphNodes || [])];
    let graphEdges = [...(session.graphEdges || [])];
    for (const item of candidates) {
        const candidate = item?.candidate;
        if (!candidate?.node_id) {
            continue;
        }
        ({ graphNodes, graphEdges } = mergeGraphPayload(
            graphNodes,
            graphEdges,
            [{ ...candidate, is_anchor: false }],
            item.edges || [],
            originTag
        ));
    }
    return { graphNodes, graphEdges };
}

function normalizeManualAddRows(rows = []) {
    return (rows || [])
        .map((row) => ({
            node_id: row.node_id || row.id,
            node_type: row.node_type || row.type,
            type: row.node_type || row.type,
            label: row.label || row.node_id,
            subtitle: row.subtitle || "",
        }))
        .filter((item) => item.node_id && item.node_type);
}

/**
 * Place new nodes on the canvas immediately without fetching links or relayout-blocking work.
 */
export function addNodesToGraphLocally(session, rows = []) {
    const items = normalizeManualAddRows(rows);
    if (!items.length) {
        return session;
    }

    const graphNodes = [...(session.graphNodes || [])];
    const existingIds = new Set(graphNodes.map((node) => node.id));
    const newItems = items.filter((item) => !existingIds.has(item.node_id));
    if (!newItems.length) {
        return session;
    }

    for (const item of newItems) {
        graphNodes.push(
            normalizeGraphNode(
                {
                    id: item.node_id,
                    node_id: item.node_id,
                    node_type: item.node_type,
                    type: item.node_type,
                    label: item.label,
                    subtitle: item.subtitle,
                    pending_rebuild: true,
                },
                { originTag: "manual_pending" }
            )
        );
    }

    const reasonByNodeId = Object.fromEntries(
        newItems.map((item) => [item.node_id, "yes"])
    );
    let retrievalLedger = mergeRetrievalLedger(
        { retrievalLedger: session.retrievalLedger || {} },
        newItems.map((item) => ({
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

    const pendingById = new Map(
        (session.pendingNodeAdds || []).map((item) => [item.node_id, item])
    );
    for (const item of newItems) {
        pendingById.set(item.node_id, item);
    }

    return {
        ...session,
        graphNodes,
        retrievalLedger,
        pendingNodeAdds: Array.from(pendingById.values()),
        pendingGraphRebuild: true,
    };
}

/**
 * Fetch links for pending manual adds and merge them into the graph.
 */
export async function rebuildGraphFromPendingAdds(apiClient, session) {
    const pending = session?.pendingNodeAdds || [];
    if (!pending.length) {
        return {
            ...session,
            pendingGraphRebuild: false,
        };
    }
    const next = await addNodesToWorkspaceGraph(apiClient, session, pending);
    const graphNodes = (next.graphNodes || []).map((node) => {
        if (!node?.pending_rebuild) {
            return node;
        }
        const { pending_rebuild, ...rest } = node;
        return rest;
    });
    return {
        ...next,
        graphNodes,
        pendingNodeAdds: [],
        pendingGraphRebuild: false,
    };
}

/**
 * Add ledger rows to the visible graph via session node-links API (Playground manual add).
 */
export async function addNodesToWorkspaceGraph(apiClient, session, rows = []) {
    if (!apiClient?.getInteractiveSessionNodeLinks) {
        throw new Error("Interactive API client is not configured.");
    }
    const items = normalizeManualAddRows(rows);
    if (!items.length) {
        return session;
    }

    const geneSetItems = items.filter(isGeneSetRow);
    if (geneSetItems.length) {
        logGeneSetAdd("node-links request", {
            inputRows: geneSetItems,
            extra: {
                existing_node_ids: (session.graphNodes || []).map((node) => node.id),
            },
        });
    }

    const payload = await apiClient.getInteractiveSessionNodeLinks({
        existing_node_ids: (session.graphNodes || []).map((node) => node.id),
        new_items: items,
    });

    if (geneSetItems.length) {
        logGeneSetAdd("node-links response", {
            nodeLinksPayload: payload,
            mergedNodes: (payload.nodes || []).filter(isGeneSetRow),
        });
    }

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

export function isInspectableEdge(edge) {
    if (!edge) {
        return false;
    }
    const family = String(edge.family || edge.relation || edge.label || "").toLowerCase();
    if (family.includes("trait_gene") || family.includes("gene_trait")) {
        return true;
    }
    if (family.includes("gene_factor") || family.includes("factor_gene")) {
        return true;
    }
    if (family.includes("factor_trait") || family.includes("trait_factor")) {
        return true;
    }
    const source = String(edge.source || "");
    const target = String(edge.target || "");
    if (
        (source.startsWith("trait:") && target.startsWith("gene:")) ||
        (source.startsWith("gene:") && target.startsWith("trait:"))
    ) {
        return true;
    }
    if (
        (source.startsWith("gene:") && target.startsWith("factor:")) ||
        (source.startsWith("factor:") && target.startsWith("gene:"))
    ) {
        return true;
    }
    if (
        (source.startsWith("trait:") && target.startsWith("factor:")) ||
        (source.startsWith("factor:") && target.startsWith("trait:"))
    ) {
        return true;
    }
    return false;
}

export function findSessionEdge(session, edgeId, sourceId, targetId) {
    const edges = [...(session?.graphEdges || []), ...(session?.contextualEdges || [])];
    if (edgeId) {
        const match = edges.find((edge) => edge.id === edgeId);
        if (match) {
            return match;
        }
    }
    if (sourceId && targetId) {
        return (
            edges.find(
                (edge) => edge.source === sourceId && edge.target === targetId
            ) ||
            edges.find(
                (edge) => edge.source === targetId && edge.target === sourceId
            ) ||
            null
        );
    }
    return null;
}

/** Empty canvas session — add nodes via Expand KG or the assistant. */
export function createBlankCanvasSession({ label = "Blank canvas" } = {}) {
    const buckets = emptyStarterBuckets();
    return {
        label,
        blankCanvas: true,
        graphNodes: [],
        graphEdges: [],
        contextualEdges: [],
        contextualEdgeSignature: "",
        retrievalLedger: {},
        highlighted: [],
        nodeConnectionEvidenceCache: {},
        nodeExpressionProfileCache: {},
        nodeExpressionReferenceById: {},
        nodeSigChainPacketCache: {},
        nodeFactorLoadingsCache: {},
        edgeProvenanceById: {},
        graphInterpretations: [],
        graphInterpretation: null,
        graphInterpretationLoading: false,
        sigChainRuns: [],
        sigChainRun: null,
        sigChainLoading: false,
        datasetRuns: [],
        datasetRun: null,
        datasetLoading: false,
        context: "",
        starterBuckets: buckets,
        anchorItems: [],
        addNeighboringNodes: false,
        graphFilterCache: {},
        visibilityFilterLayers: [],
        pendingNodeAdds: [],
        pendingGraphRebuild: false,
    };
}
