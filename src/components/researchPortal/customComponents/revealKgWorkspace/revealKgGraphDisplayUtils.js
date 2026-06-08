/** Display graph visibility (Playground graphDisplayUtils + getDisplayGraph parity). */

import { isNodeVisibleInSession } from "./revealKgVisibilityFilterUtils.js";

export function getGraphFocusNodeIds({
    reanchorSelection = [],
    selectedNodeId = null,
    hoveredNodeId = null,
} = {}) {
    const focusNodeIds = new Set(reanchorSelection || []);
    if (selectedNodeId) {
        focusNodeIds.add(selectedNodeId);
    }
    if (hoveredNodeId) {
        focusNodeIds.add(hoveredNodeId);
    }
    return focusNodeIds;
}

export function isEdgeVisible(edge, visibleNodeIds) {
    return visibleNodeIds.has(edge.source) && visibleNodeIds.has(edge.target);
}

export function isContextualEdgeVisible(edge, focusNodeIds) {
    return focusNodeIds.has(edge.source) || focusNodeIds.has(edge.target);
}

export function buildDisplayEdges({
    graphEdges = [],
    contextualEdges = [],
    visibleNodeIds,
    focusNodeIds,
}) {
    const contextualIds = new Set((contextualEdges || []).map((edge) => edge.id));
    return [...(graphEdges || []), ...(contextualEdges || [])].filter((edge) => {
        if (!isEdgeVisible(edge, visibleNodeIds)) {
            return false;
        }
        if (contextualIds.has(edge.id)) {
            return isContextualEdgeVisible(edge, focusNodeIds);
        }
        return true;
    });
}

export function getDisplayGraph(
    session,
    { hoveredNodeId = null, selectedNodeId = null, expressionOptions = {} } = {}
) {
    if (!session) {
        return {
            visibleNodes: [],
            visibleEdges: [],
            visibleNodeIds: new Set(),
        };
    }
    const visibleNodes = (session.graphNodes || []).filter((node) =>
        isNodeVisibleInSession(node, session, expressionOptions)
    );
    const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
    const focusNodeIds = getGraphFocusNodeIds({
        reanchorSelection: session.reanchorSelection || session.highlighted || [],
        selectedNodeId: selectedNodeId ?? session.selectedNodeId ?? null,
        hoveredNodeId,
    });
    const visibleEdges = buildDisplayEdges({
        graphEdges: session.graphEdges,
        contextualEdges: session.contextualEdges,
        visibleNodeIds,
        focusNodeIds,
    });
    return { visibleNodes, visibleEdges, visibleNodeIds };
}

export function computeContextualEdgeSignature(session) {
    const { visibleNodes } = getDisplayGraph(session);
    const visibleNodeIds = visibleNodes.map((node) => node.id).sort();
    if (visibleNodeIds.length < 2) {
        return "";
    }
    const connectionScope = session.controls?.connectionScope || "direct";
    return `contextual:${connectionScope}:${visibleNodeIds.join("|")}`;
}
