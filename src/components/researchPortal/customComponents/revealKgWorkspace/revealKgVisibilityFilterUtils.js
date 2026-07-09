/** Saved visibility filter layers (annotate nodes; toggle visibility). */

import {
    candidatePassesCombinedFilter,
    candidatePassesExpression,
    candidatePassesFilter,
    createDefaultGraphFilters,
    describeExpressionFilter,
    describeNoveltyFilter,
    graphFiltersMatchDefaults,
    hasExpressionFilter,
    hasNoveltyRestriction,
    hasRelevanceFilter,
    summarizeVisibilityFilterCriteria,
} from "./revealKgGraphFilterUtils.js";

export function createVisibilityFilterLayerId() {
    return `vfilter-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function draftHasBuildCriteria(filters = {}) {
    return (
        hasExpressionFilter(filters) ||
        hasNoveltyRestriction(filters) ||
        hasRelevanceFilter(filters)
    );
}

export function summarizeVisibilityFilterLayer(filters = {}, index = 0) {
    return summarizeVisibilityFilterCriteria(filters, index);
}

export function createVisibilityFilterLayer({
    filters,
    filterContext = "",
    labelsByNodeId = {},
    expressionByNodeId = {},
    name = "",
    enabled = true,
    index = 0,
} = {}) {
    const criteria = { ...(filters || {}) };
    return {
        id: createVisibilityFilterLayerId(),
        name: name || summarizeVisibilityFilterLayer(criteria, index),
        enabled: enabled !== false,
        createdAt: new Date().toISOString(),
        context: filterContext,
        criteria,
        labelsByNodeId: { ...(labelsByNodeId || {}) },
        expressionByNodeId: { ...(expressionByNodeId || {}) },
    };
}

export function layerFromAppliedGraphFilter(appliedGraphFilter) {
    if (!appliedGraphFilter?.active) {
        return null;
    }
    return {
        id: createVisibilityFilterLayerId(),
        name: summarizeVisibilityFilterLayer(appliedGraphFilter.filters || {}, 0),
        enabled: true,
        createdAt: new Date().toISOString(),
        context: appliedGraphFilter.context || "",
        criteria: { ...(appliedGraphFilter.filters || {}) },
        labelsByNodeId: { ...(appliedGraphFilter.labelsByNodeId || {}) },
        expressionByNodeId: { ...(appliedGraphFilter.expressionByNodeId || {}) },
    };
}

export function normalizeVisibilityFilterLayers(session, expressionOptions = {}) {
    let layers = [...(session?.visibilityFilterLayers || [])];
    if (!layers.length && session?.appliedGraphFilter?.active) {
        const migrated = layerFromAppliedGraphFilter(session.appliedGraphFilter);
        if (migrated) {
            layers = [migrated];
        }
    }
    return layers.map((layer, index) => ({
        ...layer,
        id: layer.id || createVisibilityFilterLayerId(),
        name:
            layer.name ||
            summarizeVisibilityFilterLayer(layer.criteria || layer.filters || {}, index),
        enabled: layer.enabled !== false,
        criteria: {
            ...createDefaultGraphFilters(expressionOptions),
            ...(layer.criteria || layer.filters || {}),
        },
        labelsByNodeId: { ...(layer.labelsByNodeId || {}) },
        expressionByNodeId: { ...(layer.expressionByNodeId || {}) },
    }));
}

export function getEnabledVisibilityFilterLayers(session, expressionOptions = {}) {
    return normalizeVisibilityFilterLayers(session, expressionOptions).filter(
        (layer) => layer.enabled !== false
    );
}

export function nodePassesVisibilityLayer(node, layer) {
    const criteria = layer?.criteria || layer?.filters || {};
    const labelInfo = layer?.labelsByNodeId?.[node.id];
    const expressionInfo = layer?.expressionByNodeId?.[node.id];
    return candidatePassesCombinedFilter(labelInfo, expressionInfo, criteria);
}

export function nodePassesEnabledVisibilityLayers(node, session, expressionOptions = {}) {
    const layers = getEnabledVisibilityFilterLayers(session, expressionOptions);
    if (!layers.length) {
        if (session?.appliedGraphFilter?.active) {
            return nodePassesVisibilityLayer(node, {
                criteria: session.appliedGraphFilter.filters || {},
                labelsByNodeId: session.appliedGraphFilter.labelsByNodeId,
                expressionByNodeId: session.appliedGraphFilter.expressionByNodeId,
            });
        }
        return true;
    }
    return layers.every((layer) => nodePassesVisibilityLayer(node, layer));
}

export function isNodeVisibleInSession(node, session, expressionOptions = {}) {
    return nodePassesEnabledVisibilityLayers(node, session, expressionOptions);
}

export function collectInvisibleNodeIds(session, expressionOptions = {}) {
    return (session?.graphNodes || [])
        .filter((node) => !isNodeVisibleInSession(node, session, expressionOptions))
        .map((node) => node.id)
        .filter(Boolean);
}

export function countInvisibleGraphNodes(session, expressionOptions = {}) {
    return collectInvisibleNodeIds(session, expressionOptions).length;
}

export function addVisibilityFilterLayer(session, layer, expressionOptions = {}) {
    const layers = normalizeVisibilityFilterLayers(session, expressionOptions);
    return {
        ...session,
        visibilityFilterLayers: [...layers, layer],
        appliedGraphFilter: null,
    };
}

export function toggleVisibilityFilterLayer(session, layerId, expressionOptions = {}) {
    const layers = normalizeVisibilityFilterLayers(session, expressionOptions).map((layer) =>
        layer.id === layerId ? { ...layer, enabled: !layer.enabled } : layer
    );
    return {
        ...session,
        visibilityFilterLayers: layers,
        appliedGraphFilter: null,
    };
}

export function removeVisibilityFilterLayer(session, layerId, expressionOptions = {}) {
    return {
        ...session,
        visibilityFilterLayers: normalizeVisibilityFilterLayers(
            session,
            expressionOptions
        ).filter((layer) => layer.id !== layerId),
        appliedGraphFilter: null,
    };
}

export function graphFilterDraftDirty(session, expressionOptions = {}) {
    const filters = session?.controls?.graphFilters || {};
    return !graphFiltersMatchDefaults(filters, expressionOptions);
}

export function resetGraphFilterDraftOnSession(session, expressionOptions = {}) {
    if (!session) {
        return session;
    }
    return {
        ...session,
        controls: {
            ...(session.controls || {}),
            graphFilters: createDefaultGraphFilters(expressionOptions),
        },
    };
}

export function ledgerReasonForVisibilityLayers(session, entry, expressionOptions = {}) {
    const node = (session?.graphNodes || []).find((item) => item.id === entry?.node_id);
    if (node && isNodeVisibleInSession(node, session, expressionOptions)) {
        return "yes";
    }
    const layers = getEnabledVisibilityFilterLayers(session, expressionOptions);
    if (node && layers.length) {
        for (const layer of layers) {
            const labelInfo = layer.labelsByNodeId?.[entry.node_id];
            const expressionInfo = layer.expressionByNodeId?.[entry.node_id];
            const criteria = layer.criteria || {};
            if (!candidatePassesFilter(labelInfo, criteria)) {
                return "llm";
            }
            if (!candidatePassesExpression(expressionInfo, criteria)) {
                return "expression";
            }
        }
    } else if (node && session?.appliedGraphFilter?.active) {
        const labelInfo = session.appliedGraphFilter.labelsByNodeId?.[entry.node_id];
        const expressionInfo = session.appliedGraphFilter.expressionByNodeId?.[entry.node_id];
        if (!candidatePassesFilter(labelInfo, session.appliedGraphFilter.filters || {})) {
            return "llm";
        }
        if (
            !candidatePassesExpression(
                expressionInfo,
                session.appliedGraphFilter.filters || {}
            )
        ) {
            return "expression";
        }
    }
    return entry?.last_reason || "unseen";
}
