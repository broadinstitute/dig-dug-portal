/** Graph filter helpers (Playground InteractiveReveal parity). */

export function createDefaultGraphFilters(expressionOptions = {}) {
    return {
        noveltyKnown: false,
        noveltyNovel: false,
        relevanceEnabled: false,
        relevanceMode: "llm",
        relevanceThreshold: 0.3,
        intent: "",
        expressionReferenceId: expressionOptions?.default_reference_id || "",
        expressionTissue: "",
        expressionCellType: "",
        expressionAbsoluteMin: "",
        expressionRelativeMax: "",
    };
}

export function graphFiltersMatchDefaults(filters = {}, expressionOptions = {}) {
    const defaults = createDefaultGraphFilters(expressionOptions);
    return (
        Boolean(filters.noveltyKnown) === defaults.noveltyKnown &&
        Boolean(filters.noveltyNovel) === defaults.noveltyNovel &&
        Boolean(filters.relevanceEnabled) === defaults.relevanceEnabled &&
        (filters.relevanceMode || "llm") === defaults.relevanceMode &&
        Number(filters.relevanceThreshold ?? 0.3) === defaults.relevanceThreshold &&
        (filters.intent || "").trim() === defaults.intent &&
        (filters.expressionReferenceId || expressionOptions?.default_reference_id || "") ===
            defaults.expressionReferenceId &&
        (filters.expressionTissue || "") === defaults.expressionTissue &&
        (filters.expressionCellType || "") === defaults.expressionCellType &&
        String(filters.expressionAbsoluteMin || "") === defaults.expressionAbsoluteMin &&
        String(filters.expressionRelativeMax || "") === defaults.expressionRelativeMax
    );
}

export function hasNoveltyRestriction(filters = {}) {
    return Boolean(filters.noveltyKnown) !== Boolean(filters.noveltyNovel);
}

export function hasRelevanceFilter(filters = {}) {
    return Boolean((filters.intent || "").trim()) || Boolean(filters.relevanceEnabled);
}

export function hasExpressionFilter(filters = {}) {
    return (
        Boolean((filters.expressionTissue || "").trim() || (filters.expressionCellType || "").trim()) &&
        (String(filters.expressionAbsoluteMin || "").trim() !== "" ||
            String(filters.expressionRelativeMax || "").trim() !== "")
    );
}

export function graphFilterNeedsLlm(filters = {}) {
    return hasNoveltyRestriction(filters) || hasRelevanceFilter(filters);
}

export function candidatePassesNovelty(labelInfo, filters = {}) {
    if (!hasNoveltyRestriction(filters)) {
        return true;
    }
    if (!labelInfo?.novelty_label) {
        return false;
    }
    if (filters.noveltyKnown) {
        return labelInfo.novelty_label === "known";
    }
    if (filters.noveltyNovel) {
        return labelInfo.novelty_label === "novel";
    }
    return true;
}

export function candidatePassesRelevance(labelInfo, filters = {}) {
    if (!hasRelevanceFilter(filters)) {
        return true;
    }
    return labelInfo?.relevance_label === "relevant";
}

export function candidatePassesFilter(labelInfo, filters = {}) {
    return candidatePassesNovelty(labelInfo, filters) && candidatePassesRelevance(labelInfo, filters);
}

export function candidatePassesExpression(expressionInfo, filters = {}) {
    if (!hasExpressionFilter(filters)) {
        return true;
    }
    return expressionInfo?.passes !== false;
}

export function candidatePassesCombinedFilter(labelInfo, expressionInfo, filters = {}) {
    return candidatePassesFilter(labelInfo, filters) && candidatePassesExpression(expressionInfo, filters);
}

export function toggleNoveltyIncludeCheckbox(filters = {}, selectedLabel) {
    if (selectedLabel === "known") {
        return {
            ...filters,
            noveltyKnown: !filters.noveltyKnown,
        };
    }
    return {
        ...filters,
        noveltyNovel: !filters.noveltyNovel,
    };
}

export function classifyContextForFilters(filters = {}, fallbackContext = "") {
    const baseContext = (fallbackContext || "").trim();
    const intent = (filters.intent || "").trim();
    if (intent && baseContext) {
        return `Primary intent: ${intent}\n\nBackground context: ${baseContext}`;
    }
    if (intent) {
        return `Primary intent: ${intent}`;
    }
    return baseContext;
}

export function expressionFilterKey(filters = {}) {
    return JSON.stringify({
        reference_id: filters.expressionReferenceId || "",
        tissue: filters.expressionTissue || "",
        cell_type: filters.expressionCellType || "",
        absolute_min: String(filters.expressionAbsoluteMin || "").trim(),
        relative_max: String(filters.expressionRelativeMax || "").trim(),
    });
}

export function describeNoveltyFilter(filters = {}) {
    if (!filters.noveltyKnown && !filters.noveltyNovel) {
        return "any";
    }
    if (filters.noveltyKnown && filters.noveltyNovel) {
        return "known and novel";
    }
    if (filters.noveltyKnown && !filters.noveltyNovel) {
        return "known only";
    }
    if (filters.noveltyNovel && !filters.noveltyKnown) {
        return "novel only";
    }
    return "any";
}

export function describeRelevanceMode(filters = {}) {
    const intent = (filters.intent || "").trim();
    if (!intent) {
        return "none";
    }
    return filters.relevanceMode === "semantic" ? "semantic" : "llm";
}

export function describeExpressionFilter(filters = {}) {
    if (!hasExpressionFilter(filters)) {
        return "none";
    }
    const parts = [
        filters.expressionTissue && filters.expressionCellType
            ? `${filters.expressionTissue} / ${filters.expressionCellType}`
            : filters.expressionTissue || filters.expressionCellType || "any tissue / cell type",
    ];
    if (String(filters.expressionAbsoluteMin || "").trim() !== "") {
        parts.push(`abs >= ${filters.expressionAbsoluteMin}`);
    }
    if (String(filters.expressionRelativeMax || "").trim() !== "") {
        parts.push(`rel <= ${filters.expressionRelativeMax}`);
    }
    return parts.join(", ");
}

export function buildCandidateStubFromNode(node) {
    return {
        candidate: {
            node_id: node.id,
            label: node.label,
            node_type: node.type || node.node_type,
            subtitle: node.subtitle || "",
        },
        edges: [],
    };
}

export function getLedgerShownReasonForSession(session, entry, expressionOptions = {}) {
    const node = (session?.graphNodes || []).find((item) => item.id === entry?.node_id);
    if (!node) {
        return entry?.last_reason || "unseen";
    }
    const layers = (session?.visibilityFilterLayers || []).filter(
        (layer) => layer.enabled !== false
    );
    const evaluateLayer = (layer) => {
        const criteria = layer.criteria || layer.filters || {};
        const labelInfo = layer.labelsByNodeId?.[node.id];
        const expressionInfo = layer.expressionByNodeId?.[node.id];
        if (!candidatePassesFilter(labelInfo, criteria)) {
            return "llm";
        }
        if (!candidatePassesExpression(expressionInfo, criteria)) {
            return "expression";
        }
        return "yes";
    };
    if (layers.length) {
        for (const layer of layers) {
            const reason = evaluateLayer(layer);
            if (reason !== "yes") {
                return reason;
            }
        }
        return "yes";
    }
    if (session?.appliedGraphFilter?.active) {
        const reason = evaluateLayer({
            criteria: session.appliedGraphFilter.filters || {},
            labelsByNodeId: session.appliedGraphFilter.labelsByNodeId,
            expressionByNodeId: session.appliedGraphFilter.expressionByNodeId,
        });
        return reason === "yes" ? "yes" : reason;
    }
    return entry?.last_reason || "yes";
}

export function ensureSessionFilterState(session, expressionOptions = {}) {
    if (!session) {
        return session;
    }
    const graphDefaults = createDefaultGraphFilters(expressionOptions);
    const existingGraphFilters = session.controls?.graphFilters || {};
    return {
        ...session,
        controls: {
            reducer: "mean",
            connectionScope: "direct",
            ...(session.controls || {}),
            graphFilters: {
                ...graphDefaults,
                ...existingGraphFilters,
                expressionReferenceId:
                    existingGraphFilters.expressionReferenceId ||
                    expressionOptions?.default_reference_id ||
                    "",
            },
        },
        graphFilterCache: session.graphFilterCache || {},
        visibilityFilterLayers: Array.isArray(session.visibilityFilterLayers)
            ? session.visibilityFilterLayers
            : [],
        appliedGraphFilter: session.appliedGraphFilter || null,
    };
}

export function patchSessionGraphFilters(session, patch = {}, expressionOptions = {}) {
    const current = session?.controls?.graphFilters || createDefaultGraphFilters(expressionOptions);
    return {
        ...session,
        controls: {
            ...(session.controls || {}),
            graphFilters: {
                ...current,
                ...patch,
            },
        },
    };
}
