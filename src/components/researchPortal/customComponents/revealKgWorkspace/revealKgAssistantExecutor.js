/** Execute validated canvas assistant plans (v2). */

import {
    detectBulkCanvasOverflow,
    bulkWorkflowStepNote,
    revealWorkflowLink,
} from "./revealKgBulkWorkflowGuidance.js";
import {
    addKeyNodesBatch,
    addNodesToGraphLocally,
    addNodesToWorkspaceGraph,
    canRemoveGraphNode,
    findGraphNode,
    isKeyNode,
    keyNodeItemsFromSession,
    removeKeyNodesBatch,
    removeNodesFromWorkspaceGraph,
} from "./revealKgGraphBootstrap.js";
import { buildVisibilityFilterOnSession } from "./revealKgGraphFilterApply.js";
import {
    patchSessionExpandControls,
    patchSessionGraphFilters,
} from "./revealKgGraphFilterUtils.js";
import { expandGraphOnSession } from "./revealKgGraphExpand.js";
import { prepareTraitGeneSetExpandExecution } from "./revealKgTraitGeneSetExpand.js";
import {
    appendExpansionHistoryEntry,
    buildExpansionHistoryEntry,
} from "./revealKgExpansionHistoryUtils.js";
import {
    EXPLAIN_SCOPE,
    executeGraphExplanationOnSession,
} from "./revealKgExplainUtils.js";
import {
    buildCfdeDatasetRun,
    buildCfdeDatasetSearchPayload,
    patchCfdeDatasetRun,
} from "./revealKgCfdeDatasetUtils.js";
import {
    buildSigChainPrioritizationQuestion,
    buildSigChainPrioritizePayload,
    computeSigChainDraftSnapshot,
    ensureSigChainDraft,
    mergeGraphEdgesForSigChainRun,
    patchSigChainRun,
    edgesForVisibleNodes,
} from "./revealKgSigChainPrioritizeUtils.js";
import { getAssistantActionDefinition } from "./revealKgAssistantTools.js";
import { getAssistantActionPreconditionMessage } from "./revealKgAssistantActionPreconditions.js";
import { toggleVisibilityFilterLayer, collectInvisibleNodeIds } from "./revealKgVisibilityFilterUtils.js";
import { resolveAssistantAddNodeRows } from "./revealKgAssistantAddNode.js";
import { resolveIntentAddNodes } from "./revealKgIntentAddNodes.js";
import { resolvePhenotypeGeneSetRows } from "./revealKgPhenotypeGeneSetAdd.js";
import { resolveGeneSetCrossingRows } from "./revealKgGeneSetCrossingAdd.js";
import {
    buildMapGenesMatrixForSession,
    buildMapGenesRun,
    getSelectedGeneSetGraphNodesFromSession,
    getSelectedGeneSetNodesFromSession,
} from "./revealKgMapGenesUtils.js";
import { gatherCopyAndOpenProvenanceExplorer } from "./revealKgGeneSetProvenance.js";
import { resolveAssistantLibraryGraph } from "./revealKgAssistantLibraryResolve.js";
import {
    resolveAssistantGeneNodes,
    resolveAssistantInspectSubject,
    resolveAssistantSeedAnchorItems,
    resolveAssistantTargetNodeIds,
    resolveUnselectNodeIds,
    resolveVisibleNodeIds,
} from "./revealKgAssistantTargetResolve.js";
import { resolveConnectedSelectionNodeIds } from "./revealKgSelectConnectedNodes.js";

function resolveFilterLayerId(session, filterRef) {
    const layers = session?.visibilityFilterLayers || [];
    if (!layers.length) {
        throw new Error("No saved visibility filters on this graph.");
    }
    const ref = String(filterRef || "last").trim();
    if (ref === "last" || ref === "latest") {
        return layers[layers.length - 1].id;
    }
    const match = layers.find((layer) => layer.id === ref);
    if (!match) {
        throw new Error(`Visibility filter "${ref}" was not found.`);
    }
    return match.id;
}

function graphFiltersPatchFromOptions(options = {}) {
    const filterType = options.filter_type || "intent";
    if (filterType === "novelty") {
        const known = options.novelty_known === true;
        const novel = options.novelty_novel === true;
        if (known && novel) {
            return {
                relevanceEnabled: false,
                intent: "",
                noveltyKnown: true,
                noveltyNovel: false,
            };
        }
        if (!known && !novel) {
            return {
                relevanceEnabled: false,
                intent: "",
                noveltyKnown: false,
                noveltyNovel: true,
            };
        }
        return {
            relevanceEnabled: false,
            intent: "",
            noveltyKnown: known,
            noveltyNovel: novel,
        };
    }
    if (filterType === "expression") {
        return {
            relevanceEnabled: false,
            expressionTissue: options.expression_tissue || "",
            expressionCellType: options.expression_cell_type || "",
            expressionAbsoluteMin: options.expression_absolute_min ?? "",
            expressionRelativeMax: options.expression_relative_max ?? "",
        };
    }
    return {
        intent: String(options.intent || "").trim(),
        relevanceEnabled: Boolean(String(options.intent || "").trim()),
        relevanceMode: options.relevance_mode || "llm",
        noveltyKnown: options.novelty_known === true,
        noveltyNovel: options.novelty_novel === true,
    };
}

function bulkWorkflowMeta(runtime = {}) {
    const overflow = detectBulkCanvasOverflow(runtime.userQuery || "");
    if (!overflow) {
        return {};
    }
    return {
        bulkWorkflowNote: bulkWorkflowStepNote(overflow),
        bulkWorkflowLink: revealWorkflowLink(),
    };
}

function expandFiltersPatchFromOptions(options = {}) {
    const filterType = options.filter_type || "none";
    const explicitIntent = String(options.intent || "").trim();
    if (filterType === "intent") {
        return {
            intent: explicitIntent,
            relevanceEnabled: Boolean(explicitIntent),
            relevanceMode: options.relevance_mode || "llm",
        };
    }
    if (filterType === "novelty") {
        const known = options.novelty_known === true;
        const novel = options.novelty_novel === true;
        if (known && novel) {
            return {
                relevanceEnabled: false,
                noveltyKnown: true,
                noveltyNovel: false,
            };
        }
        if (!known && !novel) {
            return {
                relevanceEnabled: false,
                noveltyKnown: false,
                noveltyNovel: true,
            };
        }
        return {
            relevanceEnabled: false,
            noveltyKnown: known,
            noveltyNovel: novel,
        };
    }
    if (filterType === "expression") {
        return {
            relevanceEnabled: false,
            expressionTissue: options.expression_tissue || "",
            expressionCellType: options.expression_cell_type || "",
            expressionAbsoluteMin: options.expression_absolute_min ?? "",
            expressionRelativeMax: options.expression_relative_max ?? "",
        };
    }
    if (explicitIntent) {
        return {
            intent: explicitIntent,
            relevanceEnabled: true,
            relevanceMode: options.relevance_mode || "llm",
        };
    }
    return {};
}

function sigChainNoveltyFromOptions(options = {}) {
    if (options.novelty_known && !options.novelty_novel) {
        return "known";
    }
    if (options.novelty_novel && !options.novelty_known) {
        return "novel";
    }
    return "any";
}

function graphNodeSnapshot(node) {
    return {
        id: node.id,
        label: node.label || node.id,
        type: node.node_type || node.type || "",
        node_type: node.node_type || node.type || "",
        is_anchor: Boolean(node.is_anchor),
    };
}

async function runAssistantAction(session, step, runtime) {
    const { apiClient, expressionOptions, interactiveLlmAvailable, anchorItems, onProgress } =
        runtime;
    const action = step.action;
    const target = step.target || {};
    const options = step.options || {};
    const definition = getAssistantActionDefinition(action);
    if (definition?.requires_interactive_llm && !interactiveLlmAvailable) {
        throw new Error(
            `${action} requires interactive LLM classification, which is not available.`
        );
    }

    const preconditionMessage = getAssistantActionPreconditionMessage(session, step);
    if (preconditionMessage) {
        throw new Error(preconditionMessage);
    }

    switch (action) {
        case "select_nodes": {
            if (options.clear) {
                return {
                    session: { ...session, highlighted: [] },
                    meta: { cleared: true },
                };
            }
            let nextSession = session;
            if (options.replace) {
                nextSession = { ...nextSession, highlighted: [] };
            }
            const nodeIds = resolveAssistantTargetNodeIds(nextSession, target, options);
            if (!nodeIds.length) {
                throw new Error("No nodes matched the selection criteria.");
            }
            const { session: markedSession, addedIds } = addKeyNodesBatch(nextSession, nodeIds);
            return {
                session: markedSession,
                meta: { markedCount: addedIds.length, nodeIds: addedIds },
            };
        }
        case "select_visible_nodes": {
            if (options.clear) {
                return {
                    session: { ...session, highlighted: [] },
                    meta: { cleared: true },
                };
            }
            let nextSession = session;
            if (options.replace) {
                nextSession = { ...nextSession, highlighted: [] };
            }
            const nodeIds = resolveVisibleNodeIds(
                nextSession,
                target,
                expressionOptions,
                options
            );
            if (!nodeIds.length) {
                throw new Error("No visible nodes matched the selection criteria.");
            }
            const { session: markedSession, addedIds } = addKeyNodesBatch(nextSession, nodeIds);
            return {
                session: markedSession,
                meta: {
                    markedCount: addedIds.length,
                    nodeIds: addedIds,
                    visibleCount: nodeIds.length,
                },
            };
        }
        case "select_connected_nodes": {
            let nextSession = session;
            if (options.replace === true) {
                nextSession = { ...nextSession, highlighted: [] };
            }
            const { seedNodeId, nodeIds } = resolveConnectedSelectionNodeIds(
                nextSession,
                target
            );
            const { session: markedSession, addedIds } = addKeyNodesBatch(
                nextSession,
                nodeIds
            );
            const seedNode = findGraphNode(markedSession, seedNodeId);
            return {
                session: markedSession,
                meta: {
                    markedCount: addedIds.length,
                    nodeIds: addedIds,
                    seedNodeId,
                    seedLabel: seedNode?.label || seedNodeId,
                },
            };
        }
        case "unselect_nodes": {
            const nodeIds = resolveUnselectNodeIds(
                session,
                target,
                expressionOptions,
                options
            );
            if (options.clear || options.all) {
                return {
                    session: { ...session, highlighted: [] },
                    meta: { cleared: true, unselectedCount: nodeIds.length },
                };
            }
            if (!nodeIds.length) {
                throw new Error("No selected nodes matched the unselect criteria.");
            }
            const { session: nextSession, removedIds } = removeKeyNodesBatch(session, nodeIds);
            return {
                session: nextSession,
                meta: { unselectedCount: removedIds.length, nodeIds: removedIds },
            };
        }
        case "open_expand_panel": {
            const seedItems = resolveAssistantSeedAnchorItems(session, target);
            runtime.openExpandGraphPanel?.({
                seedNodeIds: seedItems.map((item) => item.node_id || item.id).filter(Boolean),
            });
            return {
                session,
                meta: { seedCount: seedItems.length },
            };
        }
        case "open_expansion_history":
            runtime.openExpandGraphPanel?.({ tab: "history" });
            return { session, meta: { uiAction: "open_expansion_history" } };
        case "remove_node": {
            onProgress?.("Removing nodes…");
            const nodeIds = resolveAssistantTargetNodeIds(session, target, options);
            if (!nodeIds.length) {
                throw new Error("No nodes matched the removal target.");
            }
            const unmarkIds = new Set(
                nodeIds.filter((nodeId) => isKeyNode(session, nodeId))
            );
            const workingSession = unmarkIds.size
                ? {
                      ...session,
                      highlighted: (session.highlighted || []).filter(
                          (id) => !unmarkIds.has(id)
                      ),
                  }
                : session;
            const removable = nodeIds.filter((nodeId) =>
                canRemoveGraphNode(workingSession, nodeId)
            );
            if (!removable.length) {
                throw new Error(
                    "Those nodes cannot be removed. Unmark selected nodes first, then try again."
                );
            }
            const skipped = nodeIds.length - removable.length;
            const nextSession = removeNodesFromWorkspaceGraph(workingSession, removable);
            return {
                session: nextSession,
                meta: {
                    removedCount: removable.length,
                    skippedCount: skipped,
                    unmarkedCount: unmarkIds.size,
                },
            };
        }
        case "remove_invisible_nodes": {
            onProgress?.("Removing hidden nodes…");
            const nodeIds = collectInvisibleNodeIds(
                session,
                runtime.expressionOptions || {}
            );
            if (!nodeIds.length) {
                throw new Error("No hidden nodes to remove.");
            }
            const nextSession = removeNodesFromWorkspaceGraph(session, nodeIds);
            return {
                session: { ...nextSession, contextualEdgeSignature: "" },
                meta: { removedCount: nodeIds.length },
            };
        }
        case "add_node": {
            onProgress?.("Adding node…");
            const rows = await resolveAssistantAddNodeRows(session, target, options, runtime);
            const existingIds = new Set((session.graphNodes || []).map((node) => node.id));
            const rowsToAdd = rows.filter((row) => row?.node_id && !existingIds.has(row.node_id));
            const previousCount = session.graphNodes?.length || 0;
            let nextSession = session;
            for (const row of rowsToAdd) {
                nextSession = addNodesToGraphLocally(nextSession, [row]);
            }
            const addedCount = Math.max(
                0,
                (nextSession.graphNodes?.length || 0) - previousCount
            );
            if (!addedCount) {
                const labelText = rows.map((row) => row.label).filter(Boolean).join(", ");
                throw new Error(
                    labelText
                        ? `"${labelText}" is already on the graph.`
                        : "Those nodes are already on the graph."
                );
            }
            return {
                session: nextSession,
                meta: {
                    addedCount,
                    skippedCount: Math.max(0, rows.length - rowsToAdd.length),
                    labels: rowsToAdd.map((row) => row.label),
                    ...bulkWorkflowMeta(runtime),
                },
            };
        }
        case "add_nodes_by_intent": {
            if (!interactiveLlmAvailable) {
                throw new Error("Intention-based add requires an LLM backend.");
            }
            const intention = String(
                options.research_intent || runtime.userQuery || ""
            ).trim();
            if (!intention) {
                throw new Error("add_nodes_by_intent requires a research intention.");
            }
            onProgress?.("Planning catalog searches…");
            const result = await resolveIntentAddNodes(intention, session, {
                apiClient,
                sessionContext: session.context || "",
                nodeTypes: options.node_types,
                userQuery: runtime.userQuery || "",
                onProgress,
            });
            const previousCount = session.graphNodes?.length || 0;
            const nextSession = await addNodesToWorkspaceGraph(
                apiClient,
                session,
                result.rows
            );
            const addedCount = Math.max(
                0,
                (nextSession.graphNodes?.length || 0) - previousCount
            );
            if (!addedCount) {
                throw new Error("Matching nodes are already on the graph.");
            }
            return {
                session: nextSession,
                meta: {
                    addedCount,
                    labels: result.rows.map((row) => row.label),
                    explanation: result.plan.explanation,
                    geneGuidance: result.gene_guidance,
                    searchCount: result.searchLog.length,
                },
            };
        }
        case "add_gene_set_crossing": {
            const searchQuery = String(
                options.search_query || runtime.userQuery || ""
            ).trim();
            if (!searchQuery) {
                throw new Error("add_gene_set_crossing requires a search query.");
            }
            onProgress?.("Searching crossing gene sets…");
            const limit = options.limit ?? options.count;
            const existingNodeIds = (session.graphNodes || [])
                .map((node) => node.id)
                .filter(Boolean);
            const result = await resolveGeneSetCrossingRows(
                apiClient,
                searchQuery,
                limit,
                { existingNodeIds }
            );
            const previousCount = session.graphNodes?.length || 0;
            const nextSession = await addNodesToWorkspaceGraph(
                apiClient,
                session,
                result.rows
            );
            const addedCount = Math.max(
                0,
                (nextSession.graphNodes?.length || 0) - previousCount
            );
            if (!addedCount) {
                throw new Error("Matching crossing gene sets are already on the graph.");
            }
            return {
                session: nextSession,
                meta: {
                    addedCount,
                    labels: result.rows.map((row) => row.label),
                    searchQuery: result.searchQuery,
                    rawMatchCount: result.rawCount,
                    crossingMatchCount: result.crossingCount,
                    ...bulkWorkflowMeta(runtime),
                },
            };
        }
        case "add_phenotype_gene_sets": {
            const searchQuery = String(
                options.search_query || runtime.userQuery || ""
            ).trim();
            if (!searchQuery) {
                throw new Error("add_phenotype_gene_sets requires a search query.");
            }
            onProgress?.("Searching trait–gene set associations…");
            const limit = options.limit ?? options.count;
            const existingNodeIds = (session.graphNodes || [])
                .map((node) => node.id)
                .filter(Boolean);
            const result = await resolvePhenotypeGeneSetRows(
                apiClient,
                searchQuery,
                limit,
                {
                    existingNodeIds,
                    session,
                    interactiveLlmAvailable,
                    onProgress,
                }
            );
            const previousCount = session.graphNodes?.length || 0;
            const nextSession = await addNodesToWorkspaceGraph(
                apiClient,
                session,
                result.rows
            );
            const addedCount = Math.max(
                0,
                (nextSession.graphNodes?.length || 0) - previousCount
            );
            if (!addedCount) {
                throw new Error("Matching trait and gene set nodes are already on the graph.");
            }
            return {
                session: nextSession,
                meta: {
                    addedCount,
                    labels: result.rows.map((row) => row.label),
                    pairCount: result.pairCount,
                    traitCount: result.rows.filter((row) => row.node_type === "trait").length,
                    geneSetCount: result.rows.filter((row) => row.node_type === "gene_set")
                        .length,
                    searchQuery: result.searchQuery,
                    originalQuery: result.originalQuery,
                    queryTranslations: result.queryTranslations,
                    ...bulkWorkflowMeta(runtime),
                },
            };
        }
        case "open_filter_panel":
            runtime.openFilterGraphPanel?.();
            return { session, meta: { uiAction: "open_filter_panel" } };
        case "open_my_library":
            runtime.openMyLibrary?.();
            return { session, meta: { uiAction: "open_my_library" } };
        case "open_library_graph": {
            const record = resolveAssistantLibraryGraph(runtime.savedLibraryGraphs || [], {
                graphId: options.graph_id,
                graphLabel: options.graph_label,
            });
            const loadedSession = runtime.loadLibraryGraph?.(record);
            if (!loadedSession) {
                throw new Error("Could not load that saved graph.");
            }
            return {
                session: loadedSession,
                meta: { graphLabel: record.label, graphId: record.id },
            };
        }
        case "focus_graph_view": {
            const scope = options.scope || "target";
            if (scope === "entire_graph") {
                runtime.focusGraphView?.({ nodeIds: [], resetView: true });
                return { session, meta: { resetView: true, focusedCount: 0 } };
            }
            const nodeIds = resolveAssistantTargetNodeIds(session, target, options);
            if (!nodeIds.length) {
                throw new Error("No nodes matched the focus target.");
            }
            runtime.focusGraphView?.({
                nodeIds,
                fit: options.fit !== false,
            });
            return { session, meta: { focusedCount: nodeIds.length } };
        }
        case "expand_graph": {
            onProgress?.("Expanding graph…");
            const seedItems = resolveAssistantSeedAnchorItems(session, target);
            const traitGeneSet = prepareTraitGeneSetExpandExecution(seedItems, options, {
                stepLabel: step.label,
                userQuery: runtime.userQuery,
            });
            const patchedOptions = traitGeneSet
                ? {
                      ...options,
                      target_type: "gene_set",
                      ...(traitGeneSet.expandMode === "semantic"
                          ? {
                                filter_type: "intent",
                                intent: traitGeneSet.expandFilters.intent,
                            }
                          : {}),
                      count: traitGeneSet.limit,
                  }
                : options;
            const expandFilters = expandFiltersPatchFromOptions(patchedOptions);
            let nextSession = patchSessionExpandControls(
                session,
                {
                    expandFilters,
                    targetType: traitGeneSet?.targetType || patchedOptions.target_type || "all",
                    limit: patchedOptions.count || 15,
                    ...(patchedOptions.connection_scope
                        ? { connectionScope: patchedOptions.connection_scope }
                        : {}),
                    ...(patchedOptions.reducer ? { reducer: patchedOptions.reducer } : {}),
                },
                expressionOptions
            );
            const result = await expandGraphOnSession(nextSession, {
                apiClient,
                expressionOptions,
                anchorItems: seedItems.length ? seedItems : anchorItems,
                interactiveLlmAvailable: Boolean(runtime.interactiveLlmAvailable),
                onProgress,
            });
            if (traitGeneSet?.expandMode === "semantic" && !(result.addedCount || 0)) {
                throw new Error("No relevant trait–gene set pairs found.");
            }
            const appliedExpandFilters =
                result.session.controls?.expandFilters || expandFilters;
            const controls = result.session.controls || {};
            const sessionWithHistory = appendExpansionHistoryEntry(
                result.session,
                buildExpansionHistoryEntry({
                    addedItems: result.addedItems,
                    addedCount: result.addedCount,
                    expandFilters: appliedExpandFilters,
                    controls,
                    seedSummary: `${seedItems.length} seed node${seedItems.length === 1 ? "" : "s"}`,
                    seedMode: "selected",
                })
            );
            return {
                session: sessionWithHistory,
                meta: {
                    addedCount: result.addedCount || 0,
                    ...bulkWorkflowMeta(runtime),
                },
            };
        }
        case "filter_graph": {
            const mode = options.mode || "build";
            if (mode === "enable" || mode === "disable") {
                const layerId = resolveFilterLayerId(session, options.filter_ref);
                const layers = session.visibilityFilterLayers || [];
                const layer = layers.find((entry) => entry.id === layerId);
                const shouldEnable = mode === "enable";
                if (layer && (layer.enabled !== false) === shouldEnable) {
                    return {
                        session,
                        meta: { layerId, filterLabel: layer?.name || "" },
                    };
                }
                return {
                    session: toggleVisibilityFilterLayer(session, layerId, expressionOptions),
                    meta: {
                        layerId,
                        enabled: shouldEnable,
                        filterLabel: layer?.name || "",
                    },
                };
            }
            onProgress?.("Building visibility filter…");
            let nextSession = patchSessionGraphFilters(
                session,
                graphFiltersPatchFromOptions(options),
                expressionOptions
            );
            const result = await buildVisibilityFilterOnSession(nextSession, {
                apiClient,
                expressionOptions,
                anchorItems,
                onProgress,
            });
            return {
                session: result.session,
                meta: {
                    layerId: result.layer?.id,
                    afterVisibleCount: result.afterVisibleCount,
                    totalNodeCount: result.session?.graphNodes?.length || 0,
                    filterLabel: result.layer?.name || "",
                },
            };
        }
        case "explain_graph": {
            onProgress?.("Generating graph explanation…");
            const scope =
                options.scope === "entire_graph"
                    ? EXPLAIN_SCOPE.ENTIRE_GRAPH
                    : EXPLAIN_SCOPE.KEY_NODES;
            const result = await executeGraphExplanationOnSession(session, {
                scope,
                apiClient,
                queryText: options.query_text,
                additionalContext: options.additional_context,
            });
            return {
                session: result.session,
                meta: { explanationId: result.meta?.explanationId, scope, openExplain: true },
            };
        }
        case "build_hypotheses": {
            onProgress?.("Ranking pathways…");
            if (!apiClient?.prioritizeInteractiveSigChains) {
                throw new Error("Connection ranking API is not configured.");
            }
            if (!keyNodeItemsFromSession(session).length) {
                throw new Error("Mark nodes as selected before building hypotheses.");
            }
            let draft = ensureSigChainDraft(session, { forceNew: false });
            const snapshot = computeSigChainDraftSnapshot(session);
            const noveltyFilter = sigChainNoveltyFromOptions(options);
            draft = patchSigChainRun(draft, {
                queryText:
                    options.query_text ||
                    buildSigChainPrioritizationQuestion({
                        selectedNodes: snapshot.selectedNodes,
                        intent: snapshot.intent,
                        noveltyFilter,
                    }),
                additionalContext: options.additional_context ?? draft.additionalContext,
                noveltyFilter,
                graphNodes: snapshot.graphNodes,
                selectedNodes: snapshot.selectedNodes,
                status: "loading",
                error: "",
                pathwayCache: {},
            });
            let workingSession = {
                ...session,
                sigChainRun: draft,
                sigChainRuns: [
                    draft,
                    ...(session.sigChainRuns || []).filter((entry) => entry.id !== draft.id),
                ],
                sigChainLoading: true,
            };
            let extraContextualEdges = [];
            const visibleNodes = draft.graphNodes || snapshot.graphNodes || [];
            if (visibleNodes.length >= 2 && apiClient.getInteractiveSubgraphEdges) {
                const subgraphPayload = await apiClient.getInteractiveSubgraphEdges({
                    node_ids: visibleNodes.map((node) => node.id),
                    connection_scope: "direct",
                });
                const baseEdgeIds = new Set((session.graphEdges || []).map((edge) => edge.id));
                extraContextualEdges = (subgraphPayload?.edges || []).filter(
                    (edge) => !baseEdgeIds.has(edge.id)
                );
                workingSession = {
                    ...workingSession,
                    contextualEdges: extraContextualEdges,
                };
            }
            const mergedEdges = mergeGraphEdgesForSigChainRun(
                workingSession,
                extraContextualEdges
            );
            const visibleNodeIds = new Set(visibleNodes.map((node) => node.id));
            draft = patchSigChainRun(draft, {
                graphEdges: edgesForVisibleNodes(mergedEdges, visibleNodeIds),
            });
            const payload = await apiClient.prioritizeInteractiveSigChains(
                buildSigChainPrioritizePayload(workingSession, draft)
            );
            const successRun = patchSigChainRun(draft, {
                status: payload?.status === "error" ? "error" : "success",
                completedAt: new Date().toISOString(),
                payload,
                error: payload?.error || "",
            });
            return {
                session: {
                    ...workingSession,
                    sigChainRun: successRun,
                    sigChainRuns: [
                        successRun,
                        ...(workingSession.sigChainRuns || []).filter(
                            (entry) => entry.id !== successRun.id
                        ),
                    ],
                    sigChainLoading: false,
                },
                meta: { openHypotheses: true, chainCount: successRun.payload?.chains?.length || 0 },
            };
        }
        case "find_datasets": {
            onProgress?.("Finding related datasets…");
            const geneNodes = resolveAssistantGeneNodes(session, target).map(graphNodeSnapshot);
            if (!geneNodes.length) {
                throw new Error(
                    "Mark one or more genes as selected on the canvas before finding related datasets."
                );
            }
            if (!apiClient?.findInteractiveCfdeDatasets) {
                throw new Error("CFDE dataset search API is not configured.");
            }
            const run = buildCfdeDatasetRun(geneNodes);
            let workingSession = {
                ...session,
                datasetRun: run,
                datasetRuns: [run, ...(session.datasetRuns || [])],
                datasetLoading: true,
            };
            const payload = await apiClient.findInteractiveCfdeDatasets(
                buildCfdeDatasetSearchPayload(workingSession, geneNodes)
            );
            const nextRun = patchCfdeDatasetRun(run, {
                status: payload?.status === "error" ? "error" : "success",
                completedAt: new Date().toISOString(),
                payload,
                error: payload?.error || "",
            });
            return {
                session: {
                    ...workingSession,
                    datasetRun: nextRun,
                    datasetRuns: [nextRun, ...(session.datasetRuns || []).slice(1)],
                    datasetLoading: false,
                },
                meta: {
                    openDatasets: true,
                    datasetCount: nextRun.payload?.datasets?.length || 0,
                },
            };
        }
        case "map_genes": {
            onProgress?.("Mapping shared genes…");
            const geneSetNodes = getSelectedGeneSetNodesFromSession(session);
            if (!geneSetNodes.length) {
                throw new Error(
                    "Mark one or more gene sets as selected on the canvas before mapping genes."
                );
            }
            const result = await buildMapGenesMatrixForSession(session);
            if (result.error && !result.columns?.length) {
                throw new Error(result.error);
            }
            const run = buildMapGenesRun(result, geneSetNodes);
            return {
                session: {
                    ...session,
                    mapGenesRun: run,
                },
                meta: {
                    openMapGenes: true,
                    mapGenesColumns: run.columns,
                    mapGenesRows: run.rows,
                    mapGenesSkippedGeneSets: run.skippedGeneSets,
                    mapGenesError: run.error,
                    geneSetCount: geneSetNodes.length,
                    sharedGeneCount: run.rows?.length || 0,
                },
            };
        }
        case "open_provenance_explorer": {
            onProgress?.("Opening provenance explorer…");
            const geneSetNodes = getSelectedGeneSetGraphNodesFromSession(session);
            if (!geneSetNodes.length) {
                throw new Error(
                    "Mark one or more gene sets as selected on the canvas before opening the provenance explorer."
                );
            }
            const result = await gatherCopyAndOpenProvenanceExplorer(geneSetNodes);
            return {
                session,
                meta: {
                    openProvenanceExplorer: true,
                    geneSetCount: result.geneSetCount,
                    provenanceExplorerUrl: result.url,
                },
            };
        }
        case "export_graph":
            runtime.openExportGraph?.();
            return { session, meta: { uiAction: "export_graph" } };
        case "import_graph":
            runtime.openImportGraph?.();
            return { session, meta: { uiAction: "import_graph" } };
        case "save_graph":
            runtime.openSaveGraph?.();
            return { session, meta: { uiAction: "save_graph" } };
        case "new_graph":
            runtime.openNewGraph?.();
            return { session, meta: { uiAction: "new_graph" } };
        case "download_snapshot":
            await runtime.downloadSnapshot?.();
            return { session, meta: { uiAction: "download_snapshot" } };
        case "set_contextual_edges_visible": {
            if (!runtime.setGraphViewOptions) {
                throw new Error("Graph view options are not available.");
            }
            runtime.setGraphViewOptions({ hideContextualEdges: !options.visible });
            return { session, meta: { hideContextualEdges: !options.visible } };
        }
        case "set_jumping_edges_visible": {
            if (!runtime.setGraphViewOptions) {
                throw new Error("Graph view options are not available.");
            }
            runtime.setGraphViewOptions({ hideJumpingEdges: !options.visible });
            return { session, meta: { hideJumpingEdges: !options.visible } };
        }
        case "toggle_data_table": {
            runtime.setGraphTableOpen?.(Boolean(options.open));
            return { session, meta: { graphTableOpen: Boolean(options.open) } };
        }
        case "inspect": {
            const subject = resolveAssistantInspectSubject(session, target, options);
            if (subject.subject === "edge") {
                runtime.inspectEdge?.({
                    edgeId: subject.edgeId,
                    sourceId: subject.sourceId,
                    targetId: subject.targetId,
                });
            } else {
                runtime.inspectNode?.({ nodeId: subject.nodeId });
            }
            return { session, meta: { inspect: subject } };
        }
        default:
            throw new Error(`Unsupported action "${action}".`);
    }
}

export async function executeAssistantPlan(
    session,
    steps = [],
    runtime = {},
    { startIndex = 0 } = {}
) {
    if (!session) {
        throw new Error("No active graph session.");
    }
    const list = Array.isArray(steps) ? steps : [];
    if (!list.length) {
        throw new Error("Plan has no steps to execute.");
    }
    let workingSession = session;
    const stepResults = [];
    for (let index = startIndex; index < list.length; index += 1) {
        const step = list[index];
        runtime.onStepStart?.(step, index);
        try {
            const result = await runAssistantAction(workingSession, step, runtime);
            workingSession = result.session;
            stepResults.push({ step, ok: true, meta: result.meta || {} });
            runtime.onStepComplete?.(step, index, workingSession, result.meta);
        } catch (error) {
            runtime.onStepError?.(step, index, error);
            throw error;
        }
    }
    return { session: workingSession, stepResults };
}
