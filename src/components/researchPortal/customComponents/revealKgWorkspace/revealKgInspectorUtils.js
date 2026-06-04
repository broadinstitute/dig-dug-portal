/** Helpers for KG Workspace Inspector (Playground NodeProvenancePanel parity). */

import {
    getAvailableConnectionTargetTypes,
    isInspectableEdge,
} from "./revealKgGraphBootstrap.js";
import { hierarchyLayerIndex } from "./revealKgGraphColors.js";

export const INSPECTOR_TARGET_TYPE_LABELS = {
    gene: "Genes",
    gene_set: "Gene sets",
    factor: "Mechanisms",
    trait: "Traits",
};

export function normalizeInspectorNodeType(node) {
    return String(node?.node_type || node?.type || "").toLowerCase();
}

export function isGeneInspectorNode(node) {
    if (normalizeInspectorNodeType(node) === "gene") {
        return true;
    }
    const nodeId = String(node?.id || node?.node_id || "");
    return nodeId.startsWith("gene:");
}

export function connectionTargetTypesForNode(node) {
    const nodeType = normalizeInspectorNodeType(node);
    if (!nodeType) {
        return [];
    }
    const base = getAvailableConnectionTargetTypes(
        [{ node_type: nodeType, type: nodeType }],
        "direct"
    );
    if (nodeType === "gene_set") {
        return base;
    }
    return Array.from(new Set([...base, "gene_set"]));
}

export function formatInspectorValue(value, digits = 3) {
    if (value === null || value === undefined || value === "") {
        return "—";
    }
    const numeric = Number(value);
    if (Number.isFinite(numeric)) {
        return numeric.toFixed(digits);
    }
    return String(value);
}

export function graphNodeIdSet(graphNodes) {
    return new Set((graphNodes || []).map((entry) => entry.id).filter(Boolean));
}

/** Map connections API candidates to inspector table rows. */
export function mapConnectionCandidatesToRows(candidates, graphNodes) {
    const onGraph = graphNodeIdSet(graphNodes);
    return (candidates || []).map((item) => {
        const candidate = item.candidate || {};
        const edge = (item.edges || [])[0] || {};
        const candidateId = candidate.node_id || candidate.id;
        return {
            node_id: candidateId,
            label: candidate.label || candidateId,
            subtitle: candidate.subtitle || "",
            type: candidate.node_type || candidate.type || "",
            node_type: candidate.node_type || candidate.type || "",
            connection_score: edge.normalized_score ?? item.aggregate_score,
            aggregate_score: item.aggregate_score,
            raw_max_score: item.raw_max_score,
            raw_mean_score: item.raw_mean_score,
            link_score: item.link_score ?? edge.normalized_score,
            link_raw_score: item.link_raw_score ?? edge.raw_score,
            shown: onGraph.has(candidateId) ? "yes" : "no",
        };
    });
}

function graphNodeLabelById(graphNodes) {
    const labels = new Map();
    for (const node of graphNodes || []) {
        if (node?.id) {
            labels.set(node.id, node.label || node.id);
        }
    }
    return labels;
}

function edgeEndpointIds(edge) {
    return {
        source: edge.source || edge.source_id || edge.source_node_id,
        target: edge.target || edge.target_id || edge.target_node_id,
    };
}

function sortNeighborEntries(entries) {
    return entries.sort((left, right) =>
        left.label.localeCompare(right.label, undefined, { sensitivity: "base" })
    );
}

function neighborEntry(otherId, labels, linkKind, extra = {}) {
    return {
        id: otherId,
        label: labels.get(otherId) || otherId,
        linkKind,
        ...extra,
    };
}

export function connectedNeighborEdgeRef(edge, isContextual = false) {
    const { source, target } = edgeEndpointIds(edge);
    if (!source || !target) {
        return null;
    }
    return {
        edgeId: `${source}→${target}:${edge.id || ""}`,
        sourceId: source,
        targetId: target,
        isContextual: Boolean(isContextual),
        edge,
        inspectable: isInspectableEdge(edge),
    };
}

function shouldPreferEdgeRef(candidate, incumbent) {
    if (!candidate) {
        return false;
    }
    if (!incumbent) {
        return true;
    }
    if (!incumbent.inspectable && candidate.inspectable) {
        return true;
    }
    return false;
}

function upsertDirectNeighbor(map, otherId, labels, onGraph, edge, isContextual) {
    const edgeRef = connectedNeighborEdgeRef(edge, isContextual);
    const entry = neighborEntry(otherId, labels, "direct", {
        edgeRef,
        nodeInspectable: onGraph.has(otherId),
    });
    const existing = map.get(otherId);
    if (!existing || shouldPreferEdgeRef(edgeRef, existing.edgeRef)) {
        map.set(otherId, entry);
    }
}

/** 1-hop neighbors on `edges` (direct link, including jumping edges). */
function oneHopNeighborsForNode(nodeId, edges, labels, onGraph, isContextual = false) {
    const neighbors = new Map();
    for (const edge of edges || []) {
        const { source, target } = edgeEndpointIds(edge);
        const otherId =
            source === nodeId ? target : target === nodeId ? source : null;
        if (!otherId || !onGraph.has(otherId)) {
            continue;
        }
        upsertDirectNeighbor(neighbors, otherId, labels, onGraph, edge, isContextual);
    }
    return neighbors;
}

/** 2-hop neighbors via `edges` only; excludes 1-hop and the inspected node. */
function twoHopOnlyNeighborsForNode(
    nodeId,
    edges,
    labels,
    onGraph,
    oneHop,
    isContextual = false
) {
    const indirect = new Map();
    const directIds = new Set(oneHop.keys());

    for (const midId of directIds) {
        for (const edge of edges || []) {
            const { source, target } = edgeEndpointIds(edge);
            let otherId = null;
            if (source === midId) {
                otherId = target;
            } else if (target === midId) {
                otherId = source;
            }
            if (
                !otherId ||
                otherId === nodeId ||
                directIds.has(otherId) ||
                !onGraph.has(otherId)
            ) {
                continue;
            }
            const edgeRef = connectedNeighborEdgeRef(edge, isContextual);
            const entry = neighborEntry(otherId, labels, "indirect", {
                edgeRef,
                viaNodeId: midId,
                viaLabel: labels.get(midId) || midId,
                nodeInspectable: onGraph.has(otherId),
            });
            const existing = indirect.get(otherId);
            if (!existing || shouldPreferEdgeRef(edgeRef, existing.edgeRef)) {
                indirect.set(otherId, entry);
            }
        }
    }
    return indirect;
}

function connectedNeighborsForEdgeGroup(nodeId, edges, graphNodes, isContextual = false) {
    const labels = graphNodeLabelById(graphNodes);
    const onGraph = graphNodeIdSet(graphNodes);
    const direct = oneHopNeighborsForNode(nodeId, edges, labels, onGraph, isContextual);
    const indirect = twoHopOnlyNeighborsForNode(
        nodeId,
        edges,
        labels,
        onGraph,
        direct,
        isContextual
    );
    return [
        ...sortNeighborEntries([...direct.values()]),
        ...sortNeighborEntries([...indirect.values()]),
    ];
}

/**
 * Connected nodes for inspector: grouped by active vs contextual edges.
 * Within each group, linkKind is `direct` (1-hop, any jump) or `indirect` (2-hop only).
 */
export function groupedConnectedNeighborsForNode(
    nodeId,
    graphEdges,
    contextualEdges,
    graphNodes
) {
    if (!nodeId) {
        return { active: [], contextual: [] };
    }
    return {
        active: connectedNeighborsForEdgeGroup(nodeId, graphEdges, graphNodes, false),
        contextual: connectedNeighborsForEdgeGroup(
            nodeId,
            contextualEdges,
            graphNodes,
            true
        ),
    };
}

export function countEdgesForNode(nodeId, edges) {
    if (!nodeId) {
        return 0;
    }
    const seen = new Set();
    let count = 0;
    for (const edge of edges || []) {
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

export function countLinkedEdgesForNode(nodeId, graphEdges, contextualEdges) {
    return (
        countEdgesForNode(nodeId, graphEdges) +
        countEdgesForNode(nodeId, contextualEdges)
    );
}

export function graphNodeToConnectionAnchor(node) {
    if (!node?.id) {
        return null;
    }
    const nodeType = normalizeInspectorNodeType(node);
    return {
        node_id: node.id,
        node_type: nodeType,
        type: nodeType,
        node_key: node.node_key || node.id.split(":").slice(1).join(":"),
        label: node.label || node.id,
        subtitle: node.subtitle || "",
    };
}

function inspectorCacheHasEntries(cache) {
    return Boolean(cache && typeof cache === "object" && Object.keys(cache).length > 0);
}

/** Node ids with cached Inspector connection and/or expression evidence. */
export function nodeIdsWithInspectorEvidence(session) {
    if (!session) {
        return [];
    }
    const ids = new Set();
    const connectionCache = session.nodeConnectionEvidenceCache || {};
    const expressionCache = session.nodeExpressionProfileCache || {};
    for (const nodeId of Object.keys(connectionCache)) {
        if (inspectorCacheHasEntries(connectionCache[nodeId])) {
            ids.add(nodeId);
        }
    }
    for (const nodeId of Object.keys(expressionCache)) {
        if (inspectorCacheHasEntries(expressionCache[nodeId])) {
            ids.add(nodeId);
        }
    }
    return Array.from(ids);
}

/** Hierarchy edge keys (canvas `hierarchyEdgeKey`) with cached edge provenance. */
export function hierarchyEdgeKeysWithInspectorEvidence(session) {
    if (!session?.edgeProvenanceById) {
        return [];
    }
    const provenance = session.edgeProvenanceById;
    const graphNodes = session.graphNodes || [];
    const nodeById = new Map(graphNodes.map((node) => [node.id, node]));
    const edges = [
        ...(session.graphEdges || []),
        ...(session.contextualEdges || []),
    ];
    const keys = [];
    for (const edge of edges) {
        if (!edge?.id || provenance[edge.id] === undefined) {
            continue;
        }
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        if (!source || !target) {
            keys.push(`${edge.source}→${edge.target}:${edge.id}`);
            continue;
        }
        const sourceLayer = hierarchyLayerIndex(source);
        const targetLayer = hierarchyLayerIndex(target);
        const leftToRight = sourceLayer < targetLayer;
        const sourceId = leftToRight ? edge.source : edge.target;
        const targetId = leftToRight ? edge.target : edge.source;
        keys.push(`${sourceId}→${targetId}:${edge.id}`);
    }
    return keys;
}
