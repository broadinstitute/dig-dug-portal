/** Explain-graph helpers (Playground InteractiveReveal parity + workspace scopes). */

import {
    findGraphNode,
    graphNodeToAnchorItem,
    isStartingGraphNode,
    keyNodeItemsFromSession,
    normalizeKeyNodeIds,
} from "./revealKgGraphBootstrap.js";

export const EXPLAIN_SCOPE = {
    KEY_NODES: "key_nodes",
    ENTIRE_GRAPH: "entire_graph",
};

function visibleGraphEdges(session) {
    return [
        ...(session?.graphEdges || []),
        ...(session?.contextualEdges || []),
    ];
}

export function resolveExplainIntent(session) {
    const explicit = String(session?.controls?.explainIntent || "").trim();
    if (explicit) {
        return explicit;
    }
    const graphIntent = String(session?.appliedGraphFilter?.intent || "").trim();
    if (graphIntent) {
        return graphIntent;
    }
    return String(session?.controls?.expandFilters?.intent || "").trim();
}

export function resolveExplainBackgroundContext(session) {
    return (
        String(session?.explainContext || "").trim() ||
        String(session?.context || "").trim()
    );
}

export function composeEditableExplanationPrompt(queryText, additionalContext) {
    const query = String(queryText || "").trim();
    const context = String(additionalContext || "").trim();
    if (query && context) {
        return `${query}\n\nAdditional intent / context:\n${context}`;
    }
    return query || context;
}

export function buildExplainQuestion({
    activeNodes,
    anchorItems,
    intent,
    backgroundContext,
}) {
    const targetSummary =
        (activeNodes || []).map((node) => node.label).join(", ") ||
        "the visible non-anchor nodes";
    const anchorSummary =
        (anchorItems || []).map((item) => item.label).join(", ") || "(none)";
    return `How might ${targetSummary} relate to ${anchorSummary}${
        intent ? `, specifically with respect to ${intent}` : ""
    }${
        backgroundContext ? `, in the context of ${backgroundContext}` : ""
    }? Please answer two questions. What is already known about this question? What are some novel connections here that might be impactful?`;
}

export function buildKeyNodesExplainQuestion({
    keyNodes,
    intent,
    backgroundContext,
}) {
    const summary =
        (keyNodes || []).map((node) => node.label).join(", ") || "the key nodes";
    return `How do ${summary} relate to each other within this graph${
        intent ? `, specifically with respect to ${intent}` : ""
    }${
        backgroundContext ? `, in the context of ${backgroundContext}` : ""
    }? Please answer two questions. What is already known about these relationships? What are some novel connections here that might be impactful?`;
}

export function buildEntireGraphExplainQuestion({
    activeNodes,
    keyNodeItems,
    intent,
    backgroundContext,
}) {
    const graphSummary =
        (activeNodes || []).map((node) => node.label).join(", ") ||
        "all nodes in this graph";
    const keySummary =
        (keyNodeItems || []).map((item) => item.label).join(", ") ||
        "the key nodes";
    return `Summarize what this knowledge graph shows about how ${graphSummary} connect, with emphasis on relationships to ${keySummary}${
        intent ? `, specifically with respect to ${intent}` : ""
    }${
        backgroundContext ? `, in the context of ${backgroundContext}` : ""
    }? Please answer two questions. What is already known about this question? What are some novel connections here that might be impactful?

Also recommend which nodes on this graph should be marked as key nodes for follow-up hypothesis work. Choose nodes that best capture the mechanistic story (typically about 3–8 nodes).

After your narrative, append a fenced JSON block with this exact shape (use only node_id values from the graph snapshot):
\`\`\`json
{"suggested_key_nodes":[{"node_id":"<id>","label":"<label>","rationale":"<one sentence>"}]}
\`\`\``;
}

export function buildFullExplanationPromptPreview({
    queryText,
    additionalContext,
    graphNodes = [],
    graphEdges = [],
}) {
    const nodeLines = graphNodes.length
        ? graphNodes
              .map(
                  (node) =>
                      `- ${node.id}: ${node.label || node.node_id || node.id} (${node.type || node.node_type || "unknown"}${node.is_anchor ? ", starting node" : ""})`
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
        "Visible graph sent to the LLM:",
        "",
        "Nodes:",
        nodeLines,
        "",
        "Edges:",
        edgeLines,
    ].join("\n");
}

export function getExplanationScopeKey(scope, nodeIds = []) {
    const sorted = [...(nodeIds || [])].filter(Boolean).sort();
    return `${scope}:${sorted.join("|") || "none"}`;
}

function edgesWithLabels(edges, nodeLabelById) {
    return (edges || []).map((edge) => ({
        ...edge,
        source_label: nodeLabelById[edge.source] || edge.source,
        target_label: nodeLabelById[edge.target] || edge.target,
    }));
}

function keyNodeSet(session) {
    return new Set(normalizeKeyNodeIds(session));
}

export function countKeyNodes(session) {
    return normalizeKeyNodeIds(session).length;
}

export function buildExplanationDraft(session, scope = EXPLAIN_SCOPE.KEY_NODES) {
    const explainIntent = resolveExplainIntent(session);
    const backgroundContext = resolveExplainBackgroundContext(session);
    const graphNodes = session?.graphNodes || [];
    const keyIds = keyNodeSet(session);
    const keyNodeItems = keyNodeItemsFromSession(session);

    let focusNodes;
    let focusEdges;
    let activeNodes;
    let queryText;
    let scopeNodeIds;
    let helperText;
    let apiTarget;

    if (scope === EXPLAIN_SCOPE.ENTIRE_GRAPH) {
        focusNodes = graphNodes;
        const focusNodeIds = new Set(focusNodes.map((node) => node.id));
        focusEdges = visibleGraphEdges(session).filter(
            (edge) => focusNodeIds.has(edge.source) && focusNodeIds.has(edge.target)
        );
        activeNodes = graphNodes.filter((node) => !isStartingGraphNode(node));
        queryText = buildEntireGraphExplainQuestion({
            activeNodes: activeNodes.length ? activeNodes : graphNodes,
            keyNodeItems,
            intent: explainIntent,
            backgroundContext,
        });
        scopeNodeIds = graphNodes.map((node) => node.id).sort();
        helperText =
            "Includes every node and edge on the canvas. The LLM may also suggest key nodes you can add in one click.";
        apiTarget = "graph";
    } else {
        focusNodes = graphNodes.filter((node) => keyIds.has(node.id));
        const focusNodeIds = new Set(focusNodes.map((node) => node.id));
        focusEdges = visibleGraphEdges(session).filter(
            (edge) => focusNodeIds.has(edge.source) && focusNodeIds.has(edge.target)
        );
        activeNodes = focusNodes;
        queryText = buildKeyNodesExplainQuestion({
            keyNodes: focusNodes,
            intent: explainIntent,
            backgroundContext,
        });
        scopeNodeIds = focusNodes.map((node) => node.id).sort();
        helperText = "This explanation is limited to nodes marked as key nodes.";
        apiTarget = "active_set";
    }

    const nodeLabelById = Object.fromEntries(
        focusNodes.map((node) => [node.id, node.label || node.id])
    );
    const targetEdges = edgesWithLabels(focusEdges, nodeLabelById);
    const scopeKey = getExplanationScopeKey(scope, scopeNodeIds);

    return {
        id: `explanation-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        status: "draft",
        scope,
        target: apiTarget,
        scope_key: scopeKey,
        scope_node_ids: scopeNodeIds,
        scope_node_labels: focusNodes
            .slice()
            .sort((left, right) =>
                String(left.label || "").localeCompare(String(right.label || ""))
            )
            .map((node) => node.label || node.id),
        graph_nodes: focusNodes,
        graph_edges: targetEdges,
        query_text: queryText,
        additional_context: backgroundContext,
        intent: explainIntent,
        background_context: backgroundContext,
        prompt_preview: buildFullExplanationPromptPreview({
            queryText,
            additionalContext: backgroundContext,
            graphNodes: focusNodes,
            graphEdges: targetEdges,
        }),
        panel_title: "Explanation",
        helper_text: helperText,
        interpretation: "",
        suggested_key_nodes: [],
        error: "",
    };
}

export function patchExplanationEntry(entry, patch) {
    if (!entry) {
        return entry;
    }
    const next = { ...entry, ...patch };
    if (patch.query_text !== undefined || patch.additional_context !== undefined) {
        next.prompt_preview = buildFullExplanationPromptPreview({
            queryText:
                patch.query_text !== undefined ? patch.query_text : entry.query_text,
            additionalContext:
                patch.additional_context !== undefined
                    ? patch.additional_context
                    : entry.additional_context,
            graphNodes: entry.graph_nodes || [],
            graphEdges: entry.graph_edges || [],
        });
    }
    return next;
}

export function explanationApiPayload(session, entry) {
    const userPrompt = composeEditableExplanationPrompt(
        entry.query_text,
        entry.additional_context
    );
    return {
        anchor_items: keyNodeItemsFromSession(session),
        context: entry.additional_context || session?.context || "",
        target: entry.target || "graph",
        intent: entry.intent || "",
        background_context: entry.additional_context || "",
        user_prompt: userPrompt,
        graph_nodes: entry.graph_nodes || [],
        graph_edges: entry.graph_edges || [],
    };
}

export function successfulGraphExplanations(session) {
    const entries = session?.graphInterpretations || [];
    const successes = entries.filter(
        (entry) => entry.status === "success" && entry.interpretation
    );
    return successes.slice().reverse();
}

export function explainScopeLabel(scope) {
    if (scope === EXPLAIN_SCOPE.ENTIRE_GRAPH) {
        return "Entire graph";
    }
    if (scope === EXPLAIN_SCOPE.KEY_NODES) {
        return "Key nodes";
    }
    return "Graph";
}

export function latestSuccessfulExplanation(session) {
    const entries = successfulGraphExplanations(session);
    return entries.length ? entries[entries.length - 1] : null;
}

export function findGraphNodeLabel(session, nodeId) {
    const node = findGraphNode(session, nodeId);
    return node?.label || nodeId || "";
}

function tryParseSuggestedKeyNodesJson(raw) {
    if (!raw || typeof raw !== "string") {
        return [];
    }
    try {
        const parsed = JSON.parse(raw.trim());
        const items = parsed?.suggested_key_nodes;
        return Array.isArray(items) ? items : [];
    } catch (error) {
        return [];
    }
}

function extractSuggestedKeyNodesJson(text) {
    const source = String(text || "");
    const fencePattern = /```(?:json)?\s*([\s\S]*?)```/gi;
    let match = fencePattern.exec(source);
    while (match) {
        const items = tryParseSuggestedKeyNodesJson(match[1]);
        if (items.length) {
            return items;
        }
        match = fencePattern.exec(source);
    }
    const inlineMatch = source.match(/\{[\s\S]*"suggested_key_nodes"[\s\S]*\}/);
    if (inlineMatch) {
        const items = tryParseSuggestedKeyNodesJson(inlineMatch[0]);
        if (items.length) {
            return items;
        }
    }
    return [];
}

function resolveSuggestionToGraphNode(item, graphById, graphByLabel) {
    const nodeId = String(item?.node_id || item?.id || "").trim();
    if (nodeId && graphById.has(nodeId)) {
        return graphById.get(nodeId);
    }
    const label = String(item?.label || "").trim().toLowerCase();
    if (label && graphByLabel.has(label)) {
        return graphByLabel.get(label);
    }
    return null;
}

export function parseSuggestedKeyNodesFromInterpretation(
    interpretation,
    graphNodes = []
) {
    const graphById = new Map();
    const graphByLabel = new Map();
    for (const node of graphNodes || []) {
        if (node?.id) {
            graphById.set(node.id, node);
        }
        const label = String(node?.label || "").trim().toLowerCase();
        if (label && !graphByLabel.has(label)) {
            graphByLabel.set(label, node);
        }
    }

    const rawItems = extractSuggestedKeyNodesJson(interpretation);
    const seen = new Set();
    const resolved = [];
    for (const item of rawItems) {
        const graphNode = resolveSuggestionToGraphNode(item, graphById, graphByLabel);
        if (!graphNode?.id || seen.has(graphNode.id)) {
            continue;
        }
        seen.add(graphNode.id);
        resolved.push({
            node_id: graphNode.id,
            label: graphNode.label || graphNode.id,
            node_type: graphNode.node_type || graphNode.type || "",
            rationale: String(item?.rationale || item?.reason || "").trim(),
        });
    }
    return resolved;
}

export function interpretationMarkdownForDisplay(interpretation) {
    let text = String(interpretation || "");
    text = text.replace(
        /```(?:json)?\s*[\s\S]*?"suggested_key_nodes"[\s\S]*?```/gi,
        ""
    );
    return text.trim();
}

export function enrichSuggestedKeyNodes(suggestions, keyNodeIds = []) {
    const keySet = new Set(keyNodeIds || []);
    return (suggestions || []).map((item) => ({
        ...item,
        is_key_node: keySet.has(item.node_id),
    }));
}
