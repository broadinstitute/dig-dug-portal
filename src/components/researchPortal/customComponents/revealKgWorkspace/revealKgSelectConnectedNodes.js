/** Select nodes connected to a seed via active or contextual edges (1-hop). */

import { findGraphNode } from "./revealKgGraphBootstrap.js";
import { directAndContextualConnectedNodeIds } from "./revealKgInspectorUtils.js";

function resolveNodeIdsFromLabelsLocal(session, labels = []) {
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

export function resolveSeedNodeIdForConnectedSelect(session, target = {}) {
    const scope = target.scope || "all";
    if (scope === "node" || scope === "nodes") {
        let ids = [];
        if (target.node_ids?.length) {
            ids = target.node_ids.filter((nodeId) => findGraphNode(session, nodeId));
        }
        if (target.node_labels?.length) {
            ids = [
                ...new Set([
                    ...ids,
                    ...resolveNodeIdsFromLabelsLocal(session, target.node_labels),
                ]),
            ];
        }
        if (ids.length === 1) {
            return ids[0];
        }
        if (ids.length > 1) {
            throw new Error(
                "Select connected nodes requires exactly one seed node — name a single node."
            );
        }
    }
    if (scope === "selected_nodes") {
        const selected = (session.highlighted || []).filter((nodeId) =>
            findGraphNode(session, nodeId)
        );
        if (selected.length === 1) {
            return selected[0];
        }
        if (selected.length > 1) {
            throw new Error(
                "Select connected nodes requires exactly one seed — mark one node or name it in the request."
            );
        }
    }
    return null;
}

export function connectedNodeIdsForSession(session, seedNodeId) {
    return directAndContextualConnectedNodeIds(
        seedNodeId,
        session.graphEdges || [],
        session.contextualEdges || [],
        session.graphNodes || []
    );
}

export function resolveConnectedSelectionNodeIds(session, target = {}) {
    const seedNodeId = resolveSeedNodeIdForConnectedSelect(session, target);
    if (!seedNodeId) {
        throw new Error(
            "Name the seed node to select neighbors for, or mark exactly one node as selected."
        );
    }
    const nodeIds = connectedNodeIdsForSession(session, seedNodeId);
    if (!nodeIds.length) {
        const node = findGraphNode(session, seedNodeId);
        throw new Error(
            `No connected nodes were found for ${node?.label || seedNodeId}.`
        );
    }
    return { seedNodeId, nodeIds };
}

export function mentionsSelectConnectedInQuery(userQuery) {
    const query = String(userQuery || "");
    return (
        /\b(?:select|mark)\b[\s\S]*\bconnected\b/i.test(query) ||
        /\bconnected\s+nodes?\b/i.test(query)
    );
}

export function parseConnectedSeedLabelFromQuery(userQuery) {
    const query = String(userQuery || "").trim();
    const patterns = [
        /\bconnected\s+to\s+(?:the\s+)?(?:gene|trait|mechanism|factor|gene[\s-]?set)\s+([A-Za-z0-9][\w.-]*)/i,
        /\bconnected\s+to\s+([A-Za-z0-9][\w.-]*)/i,
        /\bfor\s+([A-Za-z0-9][\w.-]*)\s*$/i,
    ];
    for (const pattern of patterns) {
        const match = query.match(pattern);
        if (match?.[1]) {
            return match[1].trim();
        }
    }
    return "";
}
