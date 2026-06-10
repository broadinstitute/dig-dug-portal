/** Execute validated canvas assistant plans (v2). */

import {
    addKeyNodesBatch,
    keyNodeItemsFromSession,
} from "./revealKgGraphBootstrap.js";
import { buildVisibilityFilterOnSession } from "./revealKgGraphFilterApply.js";
import {
    patchSessionExpandControls,
    patchSessionGraphFilters,
} from "./revealKgGraphFilterUtils.js";
import { expandGraphOnSession } from "./revealKgGraphExpand.js";
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
import { toggleVisibilityFilterLayer } from "./revealKgVisibilityFilterUtils.js";
import {
    resolveAssistantGeneNodes,
    resolveAssistantInspectSubject,
    resolveAssistantSeedAnchorItems,
    resolveAssistantTargetNodeIds,
} from "./revealKgAssistantTargetResolve.js";

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
        return {
            relevanceEnabled: false,
            noveltyKnown: options.novelty_known !== false,
            noveltyNovel: options.novelty_novel === true,
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

function expandFiltersPatchFromOptions(options = {}) {
    const filterType = options.filter_type || "none";
    if (filterType === "intent") {
        const intent = String(options.intent || "").trim();
        return {
            intent,
            relevanceEnabled: Boolean(intent),
            relevanceMode: options.relevance_mode || "llm",
        };
    }
    if (filterType === "novelty") {
        return {
            relevanceEnabled: false,
            noveltyKnown: options.novelty_known !== false,
            noveltyNovel: options.novelty_novel === true,
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
        case "expand_graph": {
            onProgress?.("Expanding graph…");
            const seedItems = resolveAssistantSeedAnchorItems(session, target);
            const expandFilters = expandFiltersPatchFromOptions(options);
            let nextSession = patchSessionExpandControls(
                session,
                {
                    expandFilters,
                    targetType: options.target_type || "all",
                    limit: options.count || 15,
                    ...(options.connection_scope
                        ? { connectionScope: options.connection_scope }
                        : {}),
                    ...(options.reducer ? { reducer: options.reducer } : {}),
                },
                expressionOptions
            );
            const result = await expandGraphOnSession(nextSession, {
                apiClient,
                expressionOptions,
                anchorItems: seedItems.length ? seedItems : anchorItems,
                onProgress,
            });
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
                meta: { addedCount: result.addedCount || 0 },
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
                    return { session, meta: { layerId } };
                }
                return {
                    session: toggleVisibilityFilterLayer(session, layerId, expressionOptions),
                    meta: { layerId, enabled: shouldEnable },
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
