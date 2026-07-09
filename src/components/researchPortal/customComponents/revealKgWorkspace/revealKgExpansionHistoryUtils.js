/** Expansion run history (Playground SessionHistoryPanel parity). */

import {
    EXPAND_TARGET_TYPE_OPTIONS,
    describeNoveltyFilter,
    getExpansionOriginTag,
    hasExpressionFilter,
    MATCH_REQUIREMENT_OPTIONS,
} from "./revealKgGraphFilterUtils.js";

export function describeRelevanceMode(filters = {}) {
    const intent = String(filters.intent || "").trim();
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
    return parts.join("; ");
}

function targetTypeLabel(value = "all") {
    return (
        EXPAND_TARGET_TYPE_OPTIONS.find((option) => option.value === value)?.label ||
        "All valid types"
    );
}

export function expansionHistoryEntriesFromSession(session) {
    return (session?.historyEntries || []).filter((entry) => entry.type === "expand");
}

export function appendExpansionHistoryEntry(session, entry) {
    return {
        ...session,
        historyEntries: [
            {
                id: `history-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
                timestamp: new Date().toISOString(),
                timestamp_label: new Date().toLocaleTimeString([], {
                    hour: "numeric",
                    minute: "2-digit",
                    second: "2-digit",
                }),
                type: "expand",
                ...entry,
            },
            ...(session.historyEntries || []),
        ],
    };
}

export function removeExpansionHistoryEntry(session, entryId) {
    return {
        ...session,
        historyEntries: (session.historyEntries || []).filter((entry) => entry.id !== entryId),
    };
}

export function buildExpansionHistoryEntry({
    addedItems = [],
    addedCount = 0,
    expandFilters = {},
    controls = {},
    seedSummary = "",
    seedMode = "selected",
} = {}) {
    const originTag = getExpansionOriginTag(expandFilters);
    const originLabel =
        originTag === "known"
            ? "Known-only expansion"
            : originTag === "novel"
              ? "Novel-only expansion"
              : "Expansion";
    const reducerLabel =
        MATCH_REQUIREMENT_OPTIONS.find((option) => option.value === (controls.reducer || "mean"))
            ?.label || "Balanced";

    let summary;
    if (seedMode === "edge") {
        summary = addedCount
            ? `Expanded from edge endpoints (${seedSummary}) and added ${addedCount} node${addedCount === 1 ? "" : "s"}.`
            : `Expanded from edge endpoints (${seedSummary}); no new nodes were added.`;
    } else if (seedMode === "node") {
        summary = addedCount
            ? `Expanded from ${seedSummary} and added ${addedCount} node${addedCount === 1 ? "" : "s"}.`
            : `Expanded from ${seedSummary}; no new nodes were added.`;
    } else {
        summary = addedCount
            ? `Expanded from selected nodes and added ${addedCount} node${addedCount === 1 ? "" : "s"}.`
            : "Expansion ran from selected nodes, but no new nodes were added.";
    }

    return {
        title: `${originLabel} added ${addedCount} node${addedCount === 1 ? "" : "s"}`,
        summary,
        seed_mode: seedMode,
        seed_summary: seedSummary,
        filters: {
            novelty: describeNoveltyFilter(expandFilters),
            relevance: describeRelevanceMode(expandFilters),
            expression: describeExpressionFilter(expandFilters),
            reducer: reducerLabel,
            target_type: targetTypeLabel(controls.targetType || "all"),
            connection_scope: controls.connectionScope === "expanded" ? "two-hop" : "direct",
        },
        items: addedItems,
    };
}
