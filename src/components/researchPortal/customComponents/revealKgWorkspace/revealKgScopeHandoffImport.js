/**
 * Resolve a SCOPE CFDE KG handoff file into a REVEAL CANVAS session.
 * Catalog hits become normal nodes; misses become external gray squares.
 */
import {
    isScopeCanvasHandoff,
    splitFactorLabel,
} from "../revealScope/scopeCanvasHandoff.js";
import { fetchCatalogItems } from "./revealKgAssistantAddNode.js";
import { createBlankCanvasSession, normalizeWorkspaceGraph } from "./revealKgGraphBootstrap.js";

function normalizeMatchText(value) {
    return String(value || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");
}

function catalogItemSubtitle(item) {
    return String(item?.subtitle || item?.trait || "").trim();
}

function pickExactLabel(items, query) {
    const needle = normalizeMatchText(query);
    if (!needle) return null;
    return (
        items.find((item) => normalizeMatchText(item?.label) === needle) ||
        null
    );
}

function pickFactorCatalogMatch(items, searchLabel, matchTrait) {
    if (!items.length) return null;
    const labelNeedle = normalizeMatchText(searchLabel);
    const traitNeedle = normalizeMatchText(matchTrait);

    const labelMatches = labelNeedle
        ? items.filter((item) => normalizeMatchText(item?.label) === labelNeedle)
        : [];

    if (traitNeedle) {
        const withTrait = (list) =>
            list.find((item) => normalizeMatchText(catalogItemSubtitle(item)) === traitNeedle);
        const exactBoth = withTrait(labelMatches);
        if (exactBoth) return exactBoth;
        const traitOnly = withTrait(items);
        if (traitOnly && labelMatches.length === 0) return traitOnly;
    }

    if (labelMatches.length === 1) return labelMatches[0];
    if (labelMatches.length > 1) return labelMatches[0];
    if (items.length === 1) return items[0];
    return null;
}

function pickGenericCatalogMatch(items, searchLabel) {
    if (!items.length) return null;
    const exact = pickExactLabel(items, searchLabel);
    if (exact) return exact;
    if (items.length === 1) return items[0];
    const needle = normalizeMatchText(searchLabel);
    const prefix = items.find((item) =>
        normalizeMatchText(item?.label).startsWith(needle)
    );
    return prefix || null;
}

async function resolveHandoffNode(apiClient, node) {
    const type = String(node?.type || "").trim();
    const label = String(node?.label || node?.searchLabel || node?.scopeId || "").trim();
    let searchLabel = String(node?.searchLabel || label).trim();
    let matchTrait = node?.matchTrait ? String(node.matchTrait).trim() : null;

    if (type === "factor" && !matchTrait) {
        const split = splitFactorLabel(label);
        searchLabel = split.searchLabel || searchLabel;
        matchTrait = split.matchTrait;
    }

    if (!type || !searchLabel || !apiClient) {
        return null;
    }

    const limit = type === "factor" ? 15 : 10;
    const items = await fetchCatalogItems(apiClient, type, searchLabel, limit);
    if (!items.length) {
        return null;
    }

    if (type === "factor") {
        return pickFactorCatalogMatch(items, searchLabel, matchTrait);
    }
    return pickGenericCatalogMatch(items, searchLabel);
}

function externalNodeId(scopeId, type) {
    return `scope-ext:${type}:${scopeId}`;
}

/**
 * @param {object} handoff
 * @param {object} apiClient
 * @returns {Promise<object>} Canvas session suitable for loadSessionOntoCanvas
 */
export async function sessionFromScopeCanvasHandoff(handoff, apiClient) {
    if (!isScopeCanvasHandoff(handoff)) {
        throw new Error("File is not a SCOPE CFDE KG Canvas handoff.");
    }
    if (!apiClient) {
        throw new Error("Interactive catalog API is not configured.");
    }

    const scopeToCanvasId = new Map();
    const graphNodes = [];
    const seenCanvasIds = new Set();

    for (const node of handoff.nodes || []) {
        if (!node || !node.scopeId || !node.type) continue;
        const scopeId = String(node.scopeId);
        if (scopeToCanvasId.has(scopeId)) continue;

        let catalogHit = null;
        try {
            catalogHit = await resolveHandoffNode(apiClient, node);
        } catch (error) {
            // eslint-disable-next-line no-console
            console.warn("[reveal-kg] SCOPE handoff catalog resolve failed", node, error);
            catalogHit = null;
        }

        if (catalogHit?.node_id) {
            const canvasId = String(catalogHit.node_id);
            scopeToCanvasId.set(scopeId, canvasId);
            if (!seenCanvasIds.has(canvasId)) {
                seenCanvasIds.add(canvasId);
                graphNodes.push({
                    id: canvasId,
                    node_id: canvasId,
                    type: catalogHit.node_type || node.type,
                    node_type: catalogHit.node_type || node.type,
                    label: catalogHit.label || node.label || canvasId,
                    subtitle: catalogHit.subtitle || "",
                    is_anchor: false,
                    is_external: false,
                    origin_tags: ["scope_handoff"],
                });
            }
            continue;
        }

        const canvasId = externalNodeId(scopeId, node.type);
        scopeToCanvasId.set(scopeId, canvasId);
        if (!seenCanvasIds.has(canvasId)) {
            seenCanvasIds.add(canvasId);
            graphNodes.push({
                id: canvasId,
                node_id: canvasId,
                type: node.type,
                node_type: node.type,
                label: node.label || node.searchLabel || scopeId,
                subtitle: node.matchTrait
                    ? `SCOPE only · trait context: ${node.matchTrait}`
                    : "SCOPE only · not in Canvas catalog",
                is_anchor: false,
                is_external: true,
                scope_id: scopeId,
                origin_tags: ["scope_handoff", "scope_external"],
            });
        }
    }

    const graphEdges = [];
    const seenEdgeIds = new Set();
    (handoff.edges || []).forEach((edge, index) => {
        if (!edge) return;
        const source = scopeToCanvasId.get(String(edge.sourceScopeId));
        const target = scopeToCanvasId.get(String(edge.targetScopeId));
        if (!source || !target || source === target) return;
        const id = `scope-edge:${edge.type || "edge"}:${source}->${target}:${index}`;
        if (seenEdgeIds.has(id)) return;
        seenEdgeIds.add(id);
        graphEdges.push({
            id,
            source,
            target,
            type: edge.type || "scope",
            weight: edge.weight,
            origin_tags: ["scope_handoff"],
        });
    });

    if (!graphNodes.length) {
        throw new Error("SCOPE handoff has no resolvable nodes.");
    }

    const normalized = normalizeWorkspaceGraph(graphNodes, graphEdges);
    const blank = createBlankCanvasSession({
        label: String(handoff.title || "").trim() || "SCOPE CFDE KG",
    });
    // Do not pre-mark every node as selected — that disables Remove and paints the
    // whole graph blue. User picks selected nodes after import like any other graph.
    return {
        ...blank,
        blankCanvas: false,
        label: blank.label,
        context: String(handoff.hypothesisText || "").trim(),
        graphNodes: normalized.graphNodes,
        graphEdges: normalized.graphEdges,
        highlighted: [],
        reanchorSelection: [],
    };
}

export { isScopeCanvasHandoff };
