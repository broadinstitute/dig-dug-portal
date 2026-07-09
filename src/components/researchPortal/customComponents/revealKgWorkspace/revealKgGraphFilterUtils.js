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

export function expandNeedsLlm(filters = {}) {
    return graphFilterNeedsLlm(filters);
}

export function getExpansionOriginTag(filters = {}) {
    if (filters.noveltyKnown && !filters.noveltyNovel) {
        return "known";
    }
    if (filters.noveltyNovel && !filters.noveltyKnown) {
        return "novel";
    }
    return "top";
}

export const MATCH_REQUIREMENT_OPTIONS = [
    { value: "max", label: "Any" },
    { value: "min", label: "All" },
    { value: "mean", label: "Balanced" },
];

export const MATCH_REDUCER_HELP =
    "Controls how connection scores combine across your selected nodes. Any keeps nodes that strongly match at least one selected node. Balanced averages support across selected nodes. All requires every selected node to support the node — missing support from any selected node excludes it.";

export const EXPAND_TARGET_TYPE_OPTIONS = [
    { value: "all", label: "All valid types" },
    { value: "gene", label: "Genes" },
    { value: "gene_set", label: "Gene sets" },
    { value: "factor", label: "Mechanisms" },
    { value: "trait", label: "Traits" },
];

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
        return "Show known and novel nodes";
    }
    if (filters.noveltyKnown && !filters.noveltyNovel) {
        return "Show known nodes only";
    }
    if (filters.noveltyNovel && !filters.noveltyKnown) {
        return "Show novel nodes only";
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

/** User-facing label for expression-based visibility filters. */
export function describeExpressionFilterLabel(filters = {}) {
    if (!hasExpressionFilter(filters)) {
        return null;
    }
    const tissue = String(filters.expressionTissue || "").trim();
    const cell = String(filters.expressionCellType || "").trim();
    let location = "the selected tissue";
    if (tissue && cell) {
        location = `${tissue} / ${cell}`;
    } else if (tissue) {
        location = tissue;
    } else if (cell) {
        location = cell;
    }
    const thresholds = [];
    if (String(filters.expressionAbsoluteMin || "").trim() !== "") {
        thresholds.push(`min expression ${filters.expressionAbsoluteMin}`);
    }
    if (String(filters.expressionRelativeMax || "").trim() !== "") {
        thresholds.push(`max relative ${filters.expressionRelativeMax}`);
    }
    const thresholdText = thresholds.length ? ` (${thresholds.join(", ")})` : "";
    return `Show genes expressed in ${location}${thresholdText}`;
}

/** User-facing label for intent / relevance visibility filters. */
export function describeIntentFilterLabel(filters = {}) {
    const intent = String(filters.intent || "").trim();
    if (!intent) {
        return null;
    }
    const truncated = intent.length > 50 ? `${intent.slice(0, 47)}…` : intent;
    return `Show nodes matching “${truncated}”`;
}

/** Build a readable filter-layer name from criteria. */
export function summarizeVisibilityFilterCriteria(filters = {}, index = 0) {
    const parts = [];
    const expressionLabel = describeExpressionFilterLabel(filters);
    if (expressionLabel) {
        parts.push(expressionLabel);
    }
    const noveltyLabel = describeNoveltyFilter(filters);
    if (noveltyLabel !== "any") {
        parts.push(noveltyLabel);
    }
    const intentLabel = describeIntentFilterLabel(filters);
    if (intentLabel) {
        parts.push(intentLabel);
    }
    if (parts.length) {
        return parts.join(" · ");
    }
    return `Filter ${index + 1}`;
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
    const existingExpandFilters = session.controls?.expandFilters || {};
    return {
        ...session,
        controls: {
            reducer: "mean",
            connectionScope: "direct",
            targetType: "all",
            limit: 15,
            ...(session.controls || {}),
            graphFilters: {
                ...graphDefaults,
                ...existingGraphFilters,
                expressionReferenceId:
                    existingGraphFilters.expressionReferenceId ||
                    expressionOptions?.default_reference_id ||
                    "",
            },
            expandFilters: {
                ...graphDefaults,
                ...existingExpandFilters,
                expressionReferenceId:
                    existingExpandFilters.expressionReferenceId ||
                    expressionOptions?.default_reference_id ||
                    "",
            },
        },
        graphFilterCache: session.graphFilterCache || {},
        candidateCache: session.candidateCache || {},
        visibilityFilterLayers: Array.isArray(session.visibilityFilterLayers)
            ? session.visibilityFilterLayers
            : [],
        appliedGraphFilter: session.appliedGraphFilter || null,
        historyEntries: Array.isArray(session.historyEntries) ? session.historyEntries : [],
    };
}

export function patchSessionExpandControls(session, patch = {}, expressionOptions = {}) {
    const defaults = createDefaultGraphFilters(expressionOptions);
    const current = session?.controls || {};
    const currentExpand = current.expandFilters || defaults;
    const nextControls = { ...current, ...patch };
    if (patch.expandFilters) {
        nextControls.expandFilters = {
            ...currentExpand,
            ...patch.expandFilters,
        };
    }
    return {
        ...session,
        controls: nextControls,
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
