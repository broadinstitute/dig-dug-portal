/** Expand graph from starting anchors (Playground fetchConnections parity). */

import {
    getAvailableConnectionTargetTypes,
    interleaveCandidateLanes,
    mergeConnectionCandidatesIntoSession,
    keyNodeItemsFromSession,
} from "./revealKgGraphBootstrap.js";
import {
    candidatePassesCombinedFilter,
    candidatePassesExpression,
    classifyContextForFilters,
    createDefaultGraphFilters,
    expressionFilterKey,
    getExpansionOriginTag,
    hasExpressionFilter,
    hasNoveltyRestriction,
    hasRelevanceFilter,
} from "./revealKgGraphFilterUtils.js";
import {
    ledgerEntryFromGraphNode,
    markGraphNodesShownInLedger,
    mergeRetrievalLedger,
} from "./revealKgRetrievalLedger.js";

const CLASSIFY_BATCH_SIZE = 20;

function resolveExpandTargetTypes(session, anchorItems) {
    const connectionScope = session.controls?.connectionScope || "direct";
    const targetType = session.controls?.targetType || "all";
    const available = getAvailableConnectionTargetTypes(anchorItems, connectionScope);
    if (targetType === "all") {
        return available;
    }
    return available.includes(targetType) ? [targetType] : [];
}

function expandLimit(session) {
    const raw = Number(session.controls?.limit);
    if (!Number.isFinite(raw) || raw < 1) {
        return 15;
    }
    return Math.min(20, Math.max(1, Math.floor(raw)));
}

async function fetchConnectionLanes(apiClient, session, anchorItems, targetTypes, classifyContext) {
    const excludeNodeIds = (session.graphNodes || []).map((node) => node.id);
    const candidateLanes = {};
    for (const targetType of targetTypes) {
        const payload = await apiClient.getInteractiveConnections({
            anchor_items: anchorItems,
            context: classifyContext,
            target_type: targetType,
            reducer: session.controls?.reducer || "mean",
            connection_scope: session.controls?.connectionScope || "direct",
            limit: 100,
            exclude_node_ids: excludeNodeIds,
        });
        candidateLanes[targetType] = payload.candidates || [];
    }
    return candidateLanes;
}

async function fetchExpressionByCandidateId(apiClient, filters, candidates, expressionOptions) {
    if (!apiClient?.getInteractiveExpressionFilter || !candidates.length) {
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
        items: candidates.map((item) => item.candidate),
    });
    return Object.fromEntries((payload.items || []).map((item) => [item.node_id, item]));
}

function ledgerReasonForCandidate(item, labelsByNodeId, expressionByNodeId, filters, includedIds) {
    const nodeId = item.candidate?.node_id;
    if (!nodeId) {
        return "unseen";
    }
    if (includedIds.has(nodeId)) {
        return "yes";
    }
    const labelInfo = labelsByNodeId[nodeId];
    const expressionInfo = expressionByNodeId[nodeId];
    if (
        hasExpressionFilter(filters) &&
        !candidatePassesExpression(expressionInfo, filters)
    ) {
        return "expression";
    }
    if (
        (hasNoveltyRestriction(filters) || hasRelevanceFilter(filters)) &&
        !candidatePassesCombinedFilter(labelInfo, expressionInfo, filters)
    ) {
        return "llm";
    }
    return "limit";
}

function finalizeExpandSession(session, candidates, filtered, originTag, ledgerExtras = {}) {
    const existingIds = new Set((session.graphNodes || []).map((node) => node.id));
    const toMerge = filtered.filter((item) => !existingIds.has(item.candidate?.node_id));
    const { graphNodes, graphEdges } = mergeConnectionCandidatesIntoSession(
        session,
        toMerge,
        originTag
    );

    const includedIds = new Set(toMerge.map((item) => item.candidate.node_id));
    const { labelsByNodeId = {}, expressionByNodeId = {}, filters = {} } = ledgerExtras;

    const retrievalLedger = mergeRetrievalLedger(session, candidates, {
        labelsByNodeId,
        reasonByNodeId: Object.fromEntries(
            candidates.map((item) => [
                item.candidate.node_id,
                ledgerReasonForCandidate(
                    item,
                    labelsByNodeId,
                    expressionByNodeId,
                    filters,
                    includedIds
                ),
            ])
        ),
    });

    let nextLedger = { ...retrievalLedger };
    for (const node of graphNodes) {
        if (!nextLedger[node.id]) {
            nextLedger[node.id] = ledgerEntryFromGraphNode(node, "yes");
        }
    }
    nextLedger = markGraphNodesShownInLedger(nextLedger, graphNodes);

    const addedItems = toMerge.map((item) => ({
        node_id: item.candidate.node_id,
        label: item.candidate.label,
        subtitle: item.candidate.subtitle || "",
    }));

    return {
        session: {
            ...session,
            graphNodes,
            graphEdges,
            retrievalLedger: nextLedger,
            graphInterpretation: null,
        },
        addedCount: addedItems.length,
        addedItems,
    };
}

function expandCacheKey(session, anchorItems, targetTypes) {
    const seedKey = (anchorItems || [])
        .map((item) => item.node_id)
        .filter(Boolean)
        .sort()
        .join(",");
    return `${seedKey}:mixed:${targetTypes.join(",")}:${session.controls?.reducer || "mean"}:${session.controls?.connectionScope || "direct"}`;
}

export async function expandGraphOnSession(
    session,
    {
        apiClient,
        expressionOptions = {},
        anchorItems: anchorItemsOverride = null,
        onProgress = () => {},
    } = {}
) {
    if (!session) {
        throw new Error("No active graph session.");
    }
    if (!apiClient?.getInteractiveConnections) {
        throw new Error("Connection ranking API is not configured.");
    }

    const anchorItems = anchorItemsOverride?.length
        ? anchorItemsOverride
        : keyNodeItemsFromSession(session);
    if (!anchorItems.length) {
        throw new Error("Mark at least one selected node to expand from.");
    }

    const expandFilters =
        session.controls?.expandFilters || createDefaultGraphFilters(expressionOptions);
    const limit = expandLimit(session);
    const classifyContext = classifyContextForFilters(expandFilters, session.context);
    const originTag = getExpansionOriginTag(expandFilters);
    const needsNoveltyClassification = hasNoveltyRestriction(expandFilters);
    const needsRelevanceClassification = hasRelevanceFilter(expandFilters);
    const needsExpressionFiltering = hasExpressionFilter(expandFilters);
    const needsClassification = needsNoveltyClassification || needsRelevanceClassification;

    const targetTypes = resolveExpandTargetTypes(session, anchorItems);
    if (!targetTypes.length) {
        throw new Error("No valid target types are available for that anchor set and scope.");
    }

    const cacheKey = expandCacheKey(session, anchorItems, targetTypes);
    let cacheEntry = session.candidateCache?.[cacheKey];

    if (!cacheEntry?.candidates?.length) {
        onProgress("Fetching connection candidates…");
        const candidateLanes = await fetchConnectionLanes(
            apiClient,
            session,
            anchorItems,
            targetTypes,
            classifyContext
        );
        const mergedCandidates = interleaveCandidateLanes(
            candidateLanes,
            Number.MAX_SAFE_INTEGER
        );
        cacheEntry = {
            lanesByType: candidateLanes,
            candidates: mergedCandidates,
            classifications: {},
            expressionFilters: {},
        };
        session = {
            ...session,
            candidateCache: {
                ...(session.candidateCache || {}),
                [cacheKey]: cacheEntry,
            },
            retrievalLedger: mergeRetrievalLedger(session, mergedCandidates, {
                reasonByNodeId: Object.fromEntries(
                    mergedCandidates.map((item) => [item.candidate.node_id, "unseen"])
                ),
            }),
        };
    }

    const candidates = cacheEntry.candidates || [];
    if (!candidates.length) {
        return finalizeExpandSession(session, [], [], originTag, { filters: expandFilters });
    }

    if (!needsClassification) {
        let mergedCandidates = candidates;
        let expressionByNodeId = {};

        if (needsExpressionFiltering) {
            onProgress("Applying expression filter…");
            const expressionKey = expressionFilterKey(expandFilters);
            expressionByNodeId =
                cacheEntry.expressionFilters?.[expressionKey] ||
                (await fetchExpressionByCandidateId(
                    apiClient,
                    expandFilters,
                    mergedCandidates,
                    expressionOptions
                ));
            cacheEntry = {
                ...cacheEntry,
                expressionFilters: {
                    ...(cacheEntry.expressionFilters || {}),
                    [expressionKey]: expressionByNodeId,
                },
            };
            session = {
                ...session,
                candidateCache: {
                    ...(session.candidateCache || {}),
                    [cacheKey]: cacheEntry,
                },
            };
            mergedCandidates = mergedCandidates.filter((item) =>
                candidatePassesExpression(
                    expressionByNodeId[item.candidate.node_id],
                    expandFilters
                )
            );
        }

        const filtered = mergedCandidates.slice(0, limit);
        const result = finalizeExpandSession(session, candidates, filtered, originTag, {
            filters: expandFilters,
            expressionByNodeId,
        });
        if (!result.addedCount) {
            throw new Error("No new connections matched that request.");
        }
        return result;
    }

    if (!apiClient?.classifyInteractiveCandidates) {
        throw new Error("Candidate classification API is not configured.");
    }

    const classificationKey = `context:${classifyContext}`;
    const expressionKey = expressionFilterKey(expandFilters);
    const existingClassification = cacheEntry.classifications?.[classificationKey] || {
        labels: {},
        classifiedCount: 0,
    };
    let labelsByNodeId = { ...(existingClassification.labels || {}) };
    let expressionByNodeId = cacheEntry.expressionFilters?.[expressionKey] || {};

    if (needsExpressionFiltering && !Object.keys(expressionByNodeId).length) {
        onProgress("Applying expression filter…");
        expressionByNodeId = await fetchExpressionByCandidateId(
            apiClient,
            expandFilters,
            candidates,
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

    let classifiedCount = existingClassification.classifiedCount || 0;
    const totalBatches = Math.ceil(candidates.length / CLASSIFY_BATCH_SIZE);

    const passes = (item) =>
        candidatePassesCombinedFilter(
            labelsByNodeId[item.candidate.node_id],
            expressionByNodeId[item.candidate.node_id],
            expandFilters
        );

    let filtered = candidates.filter(passes);

    while (filtered.length < limit && classifiedCount < candidates.length) {
        const batchIndex = Math.floor(classifiedCount / CLASSIFY_BATCH_SIZE) + 1;
        const batch = candidates.slice(classifiedCount, classifiedCount + CLASSIFY_BATCH_SIZE);
        onProgress(`Classifying expansion batch ${batchIndex} of ${totalBatches}…`);
        const classification = await apiClient.classifyInteractiveCandidates({
            anchor_items: anchorItems,
            context: classifyContext,
            target_type: "mixed",
            reducer: session.controls?.reducer || "mean",
            connection_scope: session.controls?.connectionScope || "direct",
            candidates: batch,
            classify_novelty: needsNoveltyClassification,
            classify_relevance: needsRelevanceClassification,
            relevance_mode: expandFilters.relevanceMode || "llm",
            relevance_threshold: expandFilters.relevanceThreshold || 0.3,
            requested_label: "expand",
            batch_index: batchIndex,
            total_batches: totalBatches,
        });
        for (const item of classification.items || []) {
            if (item.candidate_id) {
                labelsByNodeId[item.candidate_id] = item;
            }
        }
        classifiedCount += batch.length;
        filtered = candidates.filter(passes);
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
        candidateCache: {
            ...(session.candidateCache || {}),
            [cacheKey]: cacheEntry,
        },
    };

    const limited = filtered.slice(0, limit);
    const result = finalizeExpandSession(session, candidates, limited, originTag, {
        labelsByNodeId,
        expressionByNodeId,
        filters: expandFilters,
    });
    if (!result.addedCount) {
        throw new Error("No new connections matched that request.");
    }
    return result;
}
