/** Resolve planner targets to graph node ids and anchor items. */

import {
    findGraphNode,
    graphNodeToAnchorItem,
    normalizeKeyNodeIds,
} from "./revealKgGraphBootstrap.js";
import { candidatePassesCombinedFilter } from "./revealKgGraphFilterUtils.js";
import { getDisplayGraph } from "./revealKgGraphDisplayUtils.js";

function nodeTypeOf(node) {
    return String(node?.type || node?.node_type || "").trim();
}

function toFiniteNumber(value) {
    if (value === null || value === undefined || value === "") {
        return null;
    }
    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
}

function relevanceScoreForNode(nodeId, layer, session) {
    const labelInfo = layer?.labelsByNodeId?.[nodeId] || {};
    return (
        toFiniteNumber(labelInfo.relevance_score) ??
        toFiniteNumber(labelInfo.aggregate_score) ??
        toFiniteNumber(session.retrievalLedger?.[nodeId]?.aggregate_score) ??
        -Infinity
    );
}

function connectionScoreToNode(session, nodeId, targetNodeId) {
    if (!targetNodeId) {
        return -Infinity;
    }
    const edges = [...(session.graphEdges || []), ...(session.contextualEdges || [])];
    let best = -Infinity;
    for (const edge of edges) {
        const connects =
            (edge.source === nodeId && edge.target === targetNodeId) ||
            (edge.target === nodeId && edge.source === targetNodeId);
        if (!connects) {
            continue;
        }
        const score = toFiniteNumber(edge.normalized_score ?? edge.weight ?? edge.score);
        if (score != null) {
            best = Math.max(best, score);
        }
    }
    return best;
}

function resolveRankTargetNodeId(session, params = {}) {
    if (params.connected_to_node_id) {
        return params.connected_to_node_id;
    }
    const label = String(params.connected_to_label || "").trim().toLowerCase();
    if (label) {
        const match = (session.graphNodes || []).find((node) =>
            String(node.label || "").toLowerCase().includes(label)
        );
        if (match) {
            return match.id;
        }
    }
    const nodeType = params.connected_to_node_type;
    if (nodeType) {
        const matches = (session.graphNodes || []).filter(
            (node) => nodeTypeOf(node) === nodeType
        );
        if (matches.length === 1) {
            return matches[0].id;
        }
    }
    return null;
}

function resolveLastFilterLayer(session) {
    const layers = session?.visibilityFilterLayers || [];
    if (!layers.length) {
        throw new Error("No visibility filter layer is available yet.");
    }
    return layers[layers.length - 1];
}

function filterNodesByTypes(nodes, nodeTypes = []) {
    if (!nodeTypes.length) {
        return nodes;
    }
    return nodes.filter((node) => nodeTypes.includes(nodeTypeOf(node)));
}

function resolveNodeIdsFromLabels(session, labels = []) {
    const wanted = new Set(
        labels.map((label) => String(label || "").trim().toLowerCase()).filter(Boolean)
    );
    if (!wanted.size) {
        return [];
    }
    return (session.graphNodes || [])
        .filter((node) => wanted.has(String(node.label || "").trim().toLowerCase()))
        .map((node) => node.id);
}

function resolveNodeIdsFromFilterLayer(session, layer, { nodeTypes = [], match = "pass" } = {}) {
    const matchPass = match !== "fail";
    const filters = layer.criteria || {};
    const labels = layer.labelsByNodeId || {};
    const expression = layer.expressionByNodeId || {};
    return (session.graphNodes || [])
        .filter((node) => {
            if (nodeTypes.length && !nodeTypes.includes(nodeTypeOf(node))) {
                return false;
            }
            const labelInfo = labels[node.id];
            const expressionInfo = expression[node.id];
            const passes = candidatePassesCombinedFilter(
                labelInfo,
                expressionInfo,
                filters
            );
            return matchPass ? passes : !passes;
        })
        .map((node) => node.id);
}

function rankAndLimitNodeIds(session, nodeIds, layer, options = {}) {
    const rawLimit = Number(options.limit);
    const limit =
        Number.isFinite(rawLimit) && rawLimit > 0
            ? Math.min(50, Math.max(1, rawLimit))
            : 0;
    if (!limit || nodeIds.length <= limit) {
        return nodeIds;
    }
    const rankBy =
        options.rank_by ||
        (options.connected_to_label || options.connected_to_node_type
            ? "connection"
            : "relevance");
    const targetNodeId =
        rankBy === "connection" ? resolveRankTargetNodeId(session, options) : null;
    const scored = nodeIds.map((nodeId) => {
        const score =
            rankBy === "connection"
                ? connectionScoreToNode(session, nodeId, targetNodeId)
                : relevanceScoreForNode(nodeId, layer, session);
        const node = findGraphNode(session, nodeId);
        return { nodeId, score, label: node?.label || nodeId };
    });
    scored.sort((left, right) => {
        if (right.score !== left.score) {
            return right.score - left.score;
        }
        return String(left.label).localeCompare(String(right.label || ""), undefined, {
            sensitivity: "base",
        });
    });
    return scored.slice(0, limit).map((entry) => entry.nodeId);
}

function safeLastFilterLayer(session) {
    const layers = session?.visibilityFilterLayers || [];
    return layers.length ? layers[layers.length - 1] : null;
}

/**
 * Resolve a planner target to node ids on the current session.
 */
export function resolveAssistantTargetNodeIds(session, target = {}, options = {}) {
    const scope = target.scope || "all";
    const nodeTypes = Array.isArray(target.node_types) ? target.node_types : [];

    if (scope === "selected_nodes") {
        let ids = normalizeKeyNodeIds(session);
        if (nodeTypes.length) {
            ids = ids.filter((nodeId) => {
                const node = findGraphNode(session, nodeId);
                return node && nodeTypes.includes(nodeTypeOf(node));
            });
        }
        return rankAndLimitNodeIds(session, ids, safeLastFilterLayer(session), options);
    }

    if (scope === "node_types") {
        const ids = (session.graphNodes || [])
            .filter((node) => !nodeTypes.length || nodeTypes.includes(nodeTypeOf(node)))
            .map((node) => node.id);
        return rankAndLimitNodeIds(session, ids, safeLastFilterLayer(session), options);
    }

    if (scope === "node" || scope === "nodes") {
        let ids = [];
        if (target.node_ids?.length) {
            ids = target.node_ids.filter((nodeId) => findGraphNode(session, nodeId));
        }
        if (target.node_labels?.length) {
            ids = [...new Set([...ids, ...resolveNodeIdsFromLabels(session, target.node_labels)])];
        }
        if (nodeTypes.length) {
            ids = ids.filter((nodeId) => {
                const node = findGraphNode(session, nodeId);
                return node && nodeTypes.includes(nodeTypeOf(node));
            });
        }
        return rankAndLimitNodeIds(session, ids, safeLastFilterLayer(session), options);
    }

    if (scope === "last_filter_pass" || scope === "last_filter_fail") {
        const layer = resolveLastFilterLayer(session);
        const ids = resolveNodeIdsFromFilterLayer(session, layer, {
            nodeTypes,
            match: scope === "last_filter_fail" ? "fail" : "pass",
        });
        return rankAndLimitNodeIds(session, ids, layer, options);
    }

    if (scope === "all") {
        const ids = filterNodesByTypes(session.graphNodes || [], nodeTypes).map((node) => node.id);
        return rankAndLimitNodeIds(session, ids, safeLastFilterLayer(session), options);
    }

    return [];
}

function resolveAssistantEdgeEndpointNodeIds(session, target = {}) {
    if (target.scope !== "edge" || !target.edge) {
        return [];
    }
    const sourceLabel = String(target.edge.source_label || "").trim().toLowerCase();
    const targetLabel = String(target.edge.target_label || "").trim().toLowerCase();
    const edge = [...(session.graphEdges || []), ...(session.contextualEdges || [])].find(
        (entry) => {
            const sourceNode = findGraphNode(session, entry.source);
            const targetNode = findGraphNode(session, entry.target);
            const sourceMatch = sourceLabel
                ? String(sourceNode?.label || "").trim().toLowerCase().includes(sourceLabel)
                : true;
            const targetMatch = targetLabel
                ? String(targetNode?.label || "").trim().toLowerCase().includes(targetLabel)
                : true;
            return sourceMatch && targetMatch;
        }
    );
    if (!edge) {
        throw new Error("Could not find that edge on the graph.");
    }
    return [edge.source, edge.target].filter(Boolean);
}

export function resolveAssistantSeedAnchorItems(session, target = {}) {
    if (target.scope === "edge" && target.edge) {
        const nodeIds = resolveAssistantEdgeEndpointNodeIds(session, target);
        if (!nodeIds.length) {
            throw new Error("No seed nodes matched the edge target.");
        }
        return nodeIds
            .map((nodeId) => graphNodeToAnchorItem(findGraphNode(session, nodeId)))
            .filter(Boolean);
    }
    const nodeIds = resolveAssistantTargetNodeIds(session, target);
    if (!nodeIds.length && target.scope === "selected_nodes") {
        throw new Error("Mark at least one selected node before expanding.");
    }
    if (!nodeIds.length) {
        throw new Error("No seed nodes matched the expansion target.");
    }
    return nodeIds
        .map((nodeId) => graphNodeToAnchorItem(findGraphNode(session, nodeId)))
        .filter(Boolean);
}

export function resolveAssistantInspectSubject(session, target = {}, options = {}) {
    if (target.scope === "edge" && target.edge) {
        const sourceLabel = String(target.edge.source_label || "").trim().toLowerCase();
        const targetLabel = String(target.edge.target_label || "").trim().toLowerCase();
        const edge = [...(session.graphEdges || []), ...(session.contextualEdges || [])].find(
            (entry) => {
                const sourceNode = findGraphNode(session, entry.source);
                const targetNode = findGraphNode(session, entry.target);
                const sourceMatch = sourceLabel
                    ? String(sourceNode?.label || "").trim().toLowerCase().includes(sourceLabel)
                    : true;
                const targetMatch = targetLabel
                    ? String(targetNode?.label || "").trim().toLowerCase().includes(targetLabel)
                    : true;
                return sourceMatch && targetMatch;
            }
        );
        if (!edge) {
            throw new Error("Could not find that edge on the graph.");
        }
        return {
            subject: options.subject === "node" ? "node" : "edge",
            edgeId: edge.id,
            sourceId: edge.source,
            targetId: edge.target,
        };
    }

    const nodeIds = resolveAssistantTargetNodeIds(session, target);
    if (nodeIds.length !== 1) {
        throw new Error("Inspect requires exactly one node target.");
    }
    return {
        subject: options.subject === "edge" ? "edge" : "node",
        nodeId: nodeIds[0],
    };
}

export function resolveAssistantGeneNodes(session, target = {}) {
    const geneTarget = {
        ...target,
        scope: target.scope || "selected_nodes",
        node_types: ["gene"],
    };
    return resolveAssistantTargetNodeIds(session, geneTarget)
        .map((nodeId) => findGraphNode(session, nodeId))
        .filter((node) => node && nodeTypeOf(node) === "gene");
}

/** Node ids currently shown on the canvas (respects enabled visibility filters). */
export function resolveVisibleNodeIds(
    session,
    target = {},
    expressionOptions = {},
    options = {}
) {
    const { visibleNodes } = getDisplayGraph(session, { expressionOptions });
    const nodeTypes = Array.isArray(target.node_types) ? target.node_types : [];
    let nodes = visibleNodes;
    if (nodeTypes.length) {
        nodes = nodes.filter((node) => nodeTypes.includes(nodeTypeOf(node)));
    }
    const rawLimit = Number(options.limit);
    const limit =
        Number.isFinite(rawLimit) && rawLimit > 0
            ? Math.min(50, Math.max(1, rawLimit))
            : 0;
    if (limit && nodes.length > limit) {
        nodes = [...nodes].sort((left, right) =>
            String(left.label || left.id).localeCompare(String(right.label || right.id), undefined, {
                sensitivity: "base",
            })
        );
        nodes = nodes.slice(0, limit);
    }
    return nodes.map((node) => node.id);
}

/** Selected node ids to unmark — intersects target/visible matches with current selection. */
export function resolveUnselectNodeIds(
    session,
    target = {},
    expressionOptions = {},
    options = {}
) {
    const selectedIds = normalizeKeyNodeIds(session);
    if (!selectedIds.length) {
        return [];
    }
    if (options.clear || options.all) {
        return selectedIds;
    }
    const candidateIds = options.visible
        ? resolveVisibleNodeIds(session, target, expressionOptions, options)
        : resolveAssistantTargetNodeIds(session, target, options);
    const candidateSet = new Set(candidateIds);
    return selectedIds.filter((nodeId) => candidateSet.has(nodeId));
}
