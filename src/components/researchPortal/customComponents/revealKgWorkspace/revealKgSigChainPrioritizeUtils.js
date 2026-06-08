/** SIG-chain prioritization helpers (Playground InteractiveReveal parity; Canvas uses selected nodes for anchors + active set). */

import {
    composeEditableExplanationPrompt,
    resolveExplainBackgroundContext,
    resolveExplainIntent,
} from "./revealKgExplainUtils.js";
import {
    findGraphNode,
    keyNodeItemsFromSession,
    normalizeKeyNodeIds,
} from "./revealKgGraphBootstrap.js";
import { effectiveRetrievalLedger } from "./revealKgRetrievalLedger.js";

export const SIG_CHAIN_MATRIX_TABS = [
    { id: "gene_trait", label: "Genes × Traits", title: "Genes × Traits" },
    { id: "gene_factor", label: "Genes × Mechanisms", title: "Genes × Mechanisms" },
    { id: "factor_trait", label: "Mechanisms × Traits", title: "Mechanisms × Traits" },
];

function graphNodeSnapshot(node) {
    return {
        id: node.id,
        label: node.label || node.id,
        type: node.node_type || node.type || "",
        node_type: node.node_type || node.type || "",
        is_anchor: Boolean(node.is_anchor),
    };
}

export function selectedNodeObjectsFromSession(session) {
    const selectedIds = new Set(normalizeKeyNodeIds(session));
    return (session?.graphNodes || [])
        .filter((node) => selectedIds.has(node.id))
        .map(graphNodeSnapshot);
}

export function visibleGraphNodesFromSession(session) {
    return (session?.graphNodes || []).map(graphNodeSnapshot);
}

export function getSigChainPrioritizationSnapshot(session) {
    const visibleNodes = visibleGraphNodesFromSession(session);
    const selectedNodes = selectedNodeObjectsFromSession(session);
    const graphSignature = JSON.stringify({
        node_ids: visibleNodes.map((node) => node.id).sort(),
        selected_node_ids: selectedNodes.map((node) => node.id).sort(),
    });
    return { visibleNodes, selectedNodes, graphSignature };
}

export function resolveSigChainIntent(session) {
    return resolveExplainIntent(session);
}

export function resolveSigChainNoveltyFilter(session, run = null) {
    if (run?.noveltyFilter) {
        return run.noveltyFilter;
    }
    const filters = session?.controls?.sigChainFilters || {};
    if (filters.noveltyKnown && !filters.noveltyNovel) {
        return "known";
    }
    if (filters.noveltyNovel && !filters.noveltyKnown) {
        return "novel";
    }
    return "any";
}

export function buildSigChainPrioritizationQuestion({
    selectedNodes,
    intent,
    noveltyFilter,
}) {
    const selectedSummary =
        (selectedNodes || []).map((node) => node.label || node.id).join(", ") ||
        "your selected nodes";
    const noveltyClause =
        noveltyFilter && noveltyFilter !== "any"
            ? ` Keep ${noveltyFilter} candidates as a loose filter, not as a ranking criterion.`
            : "";
    return `Find the strongest gene → mechanism → trait connections among ${selectedSummary} on this graph${
        intent ? `, with respect to ${intent}` : ""
    }. First keep any connection that could plausibly matter, then rank the survivors by mechanistic coherence, relevance, and likely usefulness.${noveltyClause}`;
}

export function buildSigChainExplainQuestion({
    activeNodes,
    selectedNodes,
    intent,
    backgroundContext,
}) {
    const targetSummary =
        (activeNodes || []).map((node) => node.label).join(", ") ||
        "the nodes in this connection";
    const selectedSummary =
        (selectedNodes || []).map((node) => node.label).join(", ") ||
        "your selected nodes";
    return `How might ${targetSummary} relate to ${selectedSummary}${
        intent ? `, specifically with respect to ${intent}` : ""
    }${
        backgroundContext ? `, in the context of ${backgroundContext}` : ""
    }? Please answer three questions. What is already known here? What seems novel or potentially impactful here? What are sensible next steps to validate or follow up on this connection?`;
}

export function buildFullSigChainPrioritizationPromptPreview({
    queryText,
    additionalContext,
    graphNodes = [],
    graphEdges = [],
    selectedNodes = [],
}) {
    const selectedLines = selectedNodes.length
        ? selectedNodes
              .map(
                  (node) =>
                      `- ${node.label || node.id} (${node.type || node.node_type || "unknown"})`
              )
              .join("\n")
        : "- (no selected nodes)";
    const nodeLines = graphNodes.length
        ? graphNodes
              .map(
                  (node) =>
                      `- ${node.id}: ${node.label || node.id} (${node.type || node.node_type || "unknown"})`
              )
              .join("\n")
        : "- (no visible nodes)";
    const edgeLines = graphEdges.length
        ? graphEdges
              .map((edge) => {
                  const source = edge.source_label || edge.source;
                  const target = edge.target_label || edge.target;
                  const label =
                      edge.label || edge.family || edge.relation || "related";
                  return `- ${source} -> ${target} (${label})`;
              })
              .join("\n")
        : "- (no visible edges)";
    return [
        composeEditableExplanationPrompt(queryText, additionalContext) ||
            "(no question entered)",
        "",
        "Selected nodes used to rank connection stories:",
        selectedLines,
        "",
        "Candidate gene → mechanism → trait connections will be generated from the visible graph and sent to the LLM for ranking.",
        "",
        "Visible graph sent to the LLM:",
        "",
        "Nodes:",
        nodeLines,
        "",
        "Edges:",
        edgeLines,
    ].join("\n");
}

export function computeSigChainDraftSnapshot(session) {
    const { visibleNodes, selectedNodes, graphSignature } =
        getSigChainPrioritizationSnapshot(session);
    const intent = resolveSigChainIntent(session);
    const noveltyFilter = resolveSigChainNoveltyFilter(session);
    const queryText = buildSigChainPrioritizationQuestion({
        selectedNodes,
        intent,
        noveltyFilter,
    });
    const additionalContext = resolveExplainBackgroundContext(session);
    return {
        queryText,
        additionalContext,
        selectedNodes,
        graphNodes: visibleNodes,
        graphSignature,
        intent,
        noveltyFilter,
    };
}

function sigChainDraftMatchesSnapshot(draft, snapshot) {
    if (!draft || !snapshot) {
        return false;
    }
    return (
        draft.queryText === snapshot.queryText &&
        draft.additionalContext === snapshot.additionalContext &&
        draft.graphSignature === snapshot.graphSignature &&
        draft.intent === snapshot.intent &&
        draft.noveltyFilter === snapshot.noveltyFilter &&
        JSON.stringify(draft.selectedNodes || []) ===
            JSON.stringify(snapshot.selectedNodes || [])
    );
}

export function buildSigChainPrioritizationDraft(session) {
    const snapshot = computeSigChainDraftSnapshot(session);
    const runId = `sig-chain-run-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    const startedAt = new Date().toISOString();
    const promptPreview = buildFullSigChainPrioritizationPromptPreview({
        queryText: snapshot.queryText,
        additionalContext: snapshot.additionalContext,
        graphNodes: snapshot.graphNodes,
        graphEdges: [],
        selectedNodes: snapshot.selectedNodes,
    });
    return {
        id: runId,
        status: "draft",
        startedAt,
        completedAt: "",
        graphSignature: snapshot.graphSignature,
        intent: snapshot.intent,
        noveltyFilter: snapshot.noveltyFilter,
        queryText: snapshot.queryText,
        additionalContext: snapshot.additionalContext,
        promptPreview,
        selectedNodes: snapshot.selectedNodes,
        graphNodes: snapshot.graphNodes,
        graphEdges: [],
        payload: null,
        error: "",
        pathwayCache: {},
    };
}

export function ensureSigChainDraft(session, { forceNew = false } = {}) {
    const runs = session?.sigChainRuns || [];
    const current = session?.sigChainRun;
    const snapshot = computeSigChainDraftSnapshot(session);
    if (
        !forceNew &&
        current &&
        (current.status === "draft" || current.status === "error")
    ) {
        if (sigChainDraftMatchesSnapshot(current, snapshot)) {
            return current;
        }
        return patchSigChainRun(current, snapshot);
    }
    const existingDraft = runs.find((entry) => entry.status === "draft");
    if (!forceNew && existingDraft) {
        if (sigChainDraftMatchesSnapshot(existingDraft, snapshot)) {
            return existingDraft;
        }
        return patchSigChainRun(existingDraft, snapshot);
    }
    return buildSigChainPrioritizationDraft(session);
}

export function patchSigChainRun(run, patch) {
    if (!run) {
        return run;
    }
    const next = { ...run, ...patch };
    if (
        patch.queryText !== undefined ||
        patch.additionalContext !== undefined ||
        patch.graphEdges !== undefined ||
        patch.selectedNodes !== undefined ||
        patch.graphNodes !== undefined
    ) {
        next.promptPreview = buildFullSigChainPrioritizationPromptPreview({
            queryText: next.queryText,
            additionalContext: next.additionalContext,
            graphNodes: next.graphNodes || [],
            graphEdges: next.graphEdges || [],
            selectedNodes: next.selectedNodes || [],
        });
    }
    return next;
}

export function labelsByNodeIdFromSession(session) {
    const ledger = effectiveRetrievalLedger({
        graphNodes: session?.graphNodes || [],
        retrievalLedger: session?.retrievalLedger || {},
    });
    return Object.fromEntries(
        Object.entries(ledger).map(([nodeId, entry]) => [
            nodeId,
            {
                novelty_label: entry.novelty_label,
                relevance_label: entry.relevance_label,
                rationale: entry.rationale,
            },
        ])
    );
}

export function mergeGraphEdgesForSigChainRun(session, extraContextualEdges = []) {
    const seen = new Set();
    const merged = [];
    for (const edge of [
        ...(session?.graphEdges || []),
        ...(session?.contextualEdges || []),
        ...(extraContextualEdges || []),
    ]) {
        if (!edge?.source || !edge?.target) {
            continue;
        }
        const key = edge.id || `${edge.source}->${edge.target}`;
        if (seen.has(key)) {
            continue;
        }
        seen.add(key);
        merged.push(edge);
    }
    return merged;
}

export function edgesForVisibleNodes(edges, visibleNodeIds) {
    const nodeSet =
        visibleNodeIds instanceof Set ? visibleNodeIds : new Set(visibleNodeIds || []);
    return (edges || []).filter(
        (edge) => nodeSet.has(edge.source) && nodeSet.has(edge.target)
    );
}

export function buildSigChainPrioritizePayload(session, run) {
    const userPrompt = composeEditableExplanationPrompt(
        run.queryText,
        run.additionalContext
    );
    const anchorItems = keyNodeItemsFromSession(session);
    const selectedNodes = run.selectedNodes?.length
        ? run.selectedNodes
        : selectedNodeObjectsFromSession(session);
    return {
        anchor_items: anchorItems,
        context: session?.context || "",
        intent: run.intent || resolveSigChainIntent(session),
        user_prompt: userPrompt,
        graph_nodes: run.graphNodes || [],
        graph_edges: run.graphEdges || [],
        active_set_nodes: selectedNodes,
        novelty_filter: run.noveltyFilter || resolveSigChainNoveltyFilter(session, run),
        labels_by_node_id: labelsByNodeIdFromSession(session),
        limit: 5,
    };
}

export function buildSigChainPacketPayload(session, { chain, graphNodes, graphEdges }) {
    return {
        anchor_items: keyNodeItemsFromSession(session),
        context: session?.context || "",
        intent: resolveSigChainIntent(session),
        chain,
        graph_nodes: graphNodes || [],
        graph_edges: graphEdges || [],
    };
}

export function buildSigChainHypothesisPayload(session, { packet, chain, selectedNodes }) {
    const explainIntent = resolveSigChainIntent(session) || chain?.intent || "";
    const backgroundContext = resolveExplainBackgroundContext(session);
    const activeNodes = (packet?.nodes || []).filter((node) => !node.is_anchor);
    const queryText = buildSigChainExplainQuestion({
        activeNodes,
        selectedNodes: selectedNodes || selectedNodeObjectsFromSession(session),
        intent: explainIntent,
        backgroundContext,
    });
    const userPrompt = composeEditableExplanationPrompt(queryText, backgroundContext);
    return {
        anchor_items: keyNodeItemsFromSession(session),
        context: backgroundContext || session?.context || "",
        target: "sig_chain",
        intent: explainIntent,
        background_context: backgroundContext,
        user_prompt: userPrompt,
        graph_nodes: packet?.nodes || [],
        graph_edges: packet?.edges || [],
        queryText,
        backgroundContext,
    };
}

export function formatPathwayRunHeadline(chainCount, status) {
    if (status === "loading") {
        return "Finding connections…";
    }
    if (status === "error") {
        return "Could not rank connections";
    }
    if (status === "draft") {
        return "Connection ranking draft";
    }
    const countLabel = `${chainCount} connection${chainCount === 1 ? "" : "s"}`;
    return `${countLabel} found. Review each pathway graph, then generate a hypothesis.`;
}

export function sigChainPathwayKey(chain) {
    return chain?.chain_id || chain?.title || "connection";
}

export function sigChainRunTimestampLabel(run) {
    const raw = run?.completedAt || run?.startedAt;
    if (!raw) {
        return "";
    }
    try {
        return new Date(raw).toLocaleString();
    } catch {
        return "";
    }
}

export function sigChainRunSummaryLabel(run) {
    const chainCount = run?.payload?.chains?.length || 0;
    if (!chainCount) {
        return "No pathways ranked";
    }
    return `${chainCount} pathway${chainCount === 1 ? "" : "s"}`;
}

export function successfulSigChainRuns(session) {
    const runs = session?.sigChainRuns || [];
    const successes = runs.filter((run) => run.status === "success");
    return successes.slice().reverse();
}

export function findGraphNodeLabel(session, nodeId) {
    const node = findGraphNode(session, nodeId);
    return node?.label || nodeId || "";
}
