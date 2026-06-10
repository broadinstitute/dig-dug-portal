/** Build visibility filter layers (annotate nodes; visibility toggled separately). */

import { getDisplayGraph } from "./revealKgGraphDisplayUtils.js";
import {
    buildCandidateStubFromNode,
    candidatePassesCombinedFilter,
    candidatePassesExpression,
    classifyContextForFilters,
    createDefaultGraphFilters,
    expressionFilterKey,
    hasExpressionFilter,
    hasNoveltyRestriction,
    hasRelevanceFilter,
} from "./revealKgGraphFilterUtils.js";
import { mergeRetrievalLedger } from "./revealKgRetrievalLedger.js";
import {
    addVisibilityFilterLayer,
    createVisibilityFilterLayer,
    draftHasBuildCriteria,
    graphFilterDraftDirty,
    normalizeVisibilityFilterLayers,
    resetGraphFilterDraftOnSession,
} from "./revealKgVisibilityFilterUtils.js";

const CLASSIFY_BATCH_SIZE = 20;

async function fetchExpressionByNodeId(apiClient, filters, candidateNodes, expressionOptions) {
    if (!apiClient?.getInteractiveExpressionFilter || !candidateNodes.length) {
        return {};
    }
    const payload = await apiClient.getInteractiveExpressionFilter({
        reference_id: filters.expressionReferenceId || expressionOptions?.default_reference_id || "",
        tissue: filters.expressionTissue,
        cell_type: filters.expressionCellType,
        absolute_min:
            String(filters.expressionAbsoluteMin || "").trim() === ""
                ? null
                : Number(filters.expressionAbsoluteMin),
        relative_max:
            String(filters.expressionRelativeMax || "").trim() === ""
                ? null
                : Number(filters.expressionRelativeMax),
        items: candidateNodes.map(buildCandidateStubFromNode).map((item) => item.candidate),
    });
    return Object.fromEntries((payload.items || []).map((item) => [item.node_id, item]));
}

function reasonForFilteredNode(node, filters, labelsByNodeId, expressionByNodeId) {
    const labelInfo = labelsByNodeId[node.id];
    const expressionInfo = expressionByNodeId[node.id];
    if (candidatePassesCombinedFilter(labelInfo, expressionInfo, filters)) {
        return "yes";
    }
    if (
        hasExpressionFilter(filters) &&
        !candidatePassesExpression(expressionInfo, filters)
    ) {
        return "expression";
    }
    return "llm";
}

export async function buildVisibilityFilterOnSession(
    session,
    { apiClient, expressionOptions = {}, anchorItems = [], onProgress = () => {} } = {}
) {
    if (!session) {
        throw new Error("No active graph session.");
    }
    const filters = session.controls?.graphFilters || createDefaultGraphFilters(expressionOptions);
    if (!draftHasBuildCriteria(filters)) {
        throw new Error("Add expression, novelty, or intent criteria before building a filter.");
    }
    const filterContext = classifyContextForFilters(filters, session.context);
    const needsNoveltyClassification = hasNoveltyRestriction(filters);
    const needsRelevanceClassification = hasRelevanceFilter(filters);
    const needsExpressionFiltering = hasExpressionFilter(filters);
    const needsClassification = needsNoveltyClassification || needsRelevanceClassification;
    const candidateNodes = session.graphNodes || [];
    const existingLayers = normalizeVisibilityFilterLayers(session, expressionOptions);

    const { visibleNodes: beforeVisibleNodes } = getDisplayGraph(session, expressionOptions);
    const beforeVisibleCount = beforeVisibleNodes.length;

    let labelsByNodeId = {};
    let expressionByNodeId = {};

    if (!needsClassification) {
        if (needsExpressionFiltering) {
            onProgress("Annotating expression…");
            expressionByNodeId = await fetchExpressionByNodeId(
                apiClient,
                filters,
                candidateNodes,
                expressionOptions
            );
        }
    } else if (!candidateNodes.length) {
        labelsByNodeId = {};
        expressionByNodeId = {};
    } else {
        const cacheKey = `graph:${candidateNodes
            .map((node) => node.id)
            .sort()
            .join(",")}`;
        let cacheEntry = session.graphFilterCache?.[cacheKey] || {
            classifications: {},
            expressionFilters: {},
        };
        const classificationKey = `context:${filterContext}`;
        const expressionKey = expressionFilterKey(filters);
        const existingClassification = cacheEntry.classifications?.[classificationKey] || {
            labels: {},
            classifiedCount: 0,
        };
        expressionByNodeId = cacheEntry.expressionFilters?.[expressionKey] || {};

        if (needsExpressionFiltering && !Object.keys(expressionByNodeId).length) {
            onProgress("Annotating expression…");
            expressionByNodeId = await fetchExpressionByNodeId(
                apiClient,
                filters,
                candidateNodes,
                expressionOptions
            );
            cacheEntry = {
                ...cacheEntry,
                expressionFilters: {
                    ...(cacheEntry.expressionFilters || {}),
                    [expressionKey]: expressionByNodeId,
                },
            };
        }

        labelsByNodeId = { ...(existingClassification.labels || {}) };
        const candidates = candidateNodes.map(buildCandidateStubFromNode);
        let classifiedCount = existingClassification.classifiedCount || 0;
        const totalBatches = Math.ceil(candidates.length / CLASSIFY_BATCH_SIZE);

        if (!apiClient?.classifyInteractiveCandidates) {
            throw new Error("Candidate classification API is not configured.");
        }

        while (classifiedCount < candidates.length) {
            const batchIndex = Math.floor(classifiedCount / CLASSIFY_BATCH_SIZE) + 1;
            const batch = candidates.slice(classifiedCount, classifiedCount + CLASSIFY_BATCH_SIZE);
            onProgress(`Classifying filter batch ${batchIndex} of ${totalBatches}…`);
            const classification = await apiClient.classifyInteractiveCandidates({
                anchor_items: anchorItems,
                context: filterContext,
                target_type: "mixed",
                reducer: session.controls?.reducer || "mean",
                connection_scope: session.controls?.connectionScope || "direct",
                candidates: batch,
                classify_novelty: needsNoveltyClassification,
                classify_relevance: needsRelevanceClassification,
                relevance_mode: filters.relevanceMode || "llm",
                relevance_threshold: filters.relevanceThreshold || 0.3,
                requested_label: "graph_filter",
                batch_index: batchIndex,
                total_batches: totalBatches,
            });
            for (const item of classification.items || []) {
                if (item.candidate_id) {
                    labelsByNodeId[item.candidate_id] = item;
                }
            }
            classifiedCount += batch.length;
        }

        cacheEntry = {
            ...cacheEntry,
            classifications: {
                ...(cacheEntry.classifications || {}),
                [classificationKey]: {
                    labels: labelsByNodeId,
                    classifiedCount,
                },
            },
        };

        session = {
            ...session,
            graphFilterCache: {
                ...(session.graphFilterCache || {}),
                [cacheKey]: cacheEntry,
            },
        };
    }

    const layer = createVisibilityFilterLayer({
        filters,
        filterContext,
        labelsByNodeId,
        expressionByNodeId,
        enabled: true,
        index: existingLayers.length,
    });

    const nextLedger = mergeRetrievalLedger(session, candidateNodes.map(buildCandidateStubFromNode), {
        labelsByNodeId,
        reasonByNodeId: Object.fromEntries(
            candidateNodes.map((node) => [
                node.id,
                reasonForFilteredNode(node, filters, labelsByNodeId, expressionByNodeId),
            ])
        ),
    });

    let nextSession = addVisibilityFilterLayer(session, layer, expressionOptions);
    nextSession = {
        ...nextSession,
        retrievalLedger: nextLedger,
        explainContext: filterContext,
        graphInterpretation: null,
    };
    nextSession = resetGraphFilterDraftOnSession(nextSession, expressionOptions);

    const afterVisibleCount = getDisplayGraph(nextSession, expressionOptions).visibleNodes.length;

    return {
        session: nextSession,
        layer,
        beforeVisibleCount,
        afterVisibleCount,
        filteredCount: Math.max(0, beforeVisibleCount - afterVisibleCount),
    };
}

export function resetGraphFilterOnSession(session, expressionOptions = {}) {
    return resetGraphFilterDraftOnSession(session, expressionOptions);
}

export function graphFilterCanReset(session, expressionOptions = {}) {
    return graphFilterDraftDirty(session, expressionOptions);
}
