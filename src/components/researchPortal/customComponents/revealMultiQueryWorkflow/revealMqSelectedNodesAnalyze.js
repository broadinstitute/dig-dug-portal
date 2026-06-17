/** Explain / provenance helpers for Multi Query heatmap + network selections. */

import {
    EXPLAIN_SCOPE,
    buildExplanationDraft,
    buildFullExplanationPromptPreview,
    buildKeyNodesExplainQuestion,
    interpretationMarkdownForDisplay,
    patchExplanationEntry,
} from "../revealKgWorkspace/revealKgExplainUtils.js";
import {
    HEATMAP_SELECTION_KIND,
    isNetworkEdgeHighlighted,
    isNetworkNodeHighlighted,
} from "./revealMqHeatmapSelection.js";

export const SELECTED_NODES_EXPLAIN_SYSTEM_PROMPT = `You are an expert biomedical analyst interpreting a REVEAL Multi Query workflow graph.
The user selected specific nodes (phenotypes, gene set clusters, gene sets, genes, and crossings) from a heatmap and network view.
Respond in clear markdown with two sections:
1. What is already known about how these selected entities relate.
2. What novel or testable connections might be worth exploring next.
Ground your answer in the graph nodes and edges provided. Do not invent entities that are not listed.`;

function normalizeNetworkNodeType(type) {
    const raw = String(type || "").trim();
    const lower = raw.toLowerCase();
    if (lower === "pathway") return "gene_set";
    if (lower === "phenotype") return "trait";
    if (lower === "gene") return "gene";
    if (lower === "factor") return "factor";
    return lower || "entity";
}

export function normalizeFactorDataNetworkNode(node) {
    if (!node || !node.id) return null;
    const nodeType = normalizeNetworkNodeType(node.type);
    return {
        ...node,
        id: node.id,
        node_id: node.id,
        label: node.label || node.id,
        type: nodeType,
        node_type: nodeType,
    };
}

export function geneSetIdsFromSelectedNodes(selectedNodes) {
    const ids = new Set();
    (selectedNodes || []).forEach((node) => {
        if (!node) return;
        if (node.kind === HEATMAP_SELECTION_KIND.GENE_SET && node.geneSetId) {
            ids.add(String(node.geneSetId).trim());
        } else if (node.kind === HEATMAP_SELECTION_KIND.CROSSING && node.colIsGeneSet && node.colLabel) {
            ids.add(String(node.colLabel).trim());
        }
    });
    return [...ids].filter(Boolean);
}

export function selectedNodesSubgraph(network, selectedNodes) {
    const graphNodes = (network?.nodes || [])
        .map(normalizeFactorDataNetworkNode)
        .filter(Boolean)
        .filter((node) => isNetworkNodeHighlighted(node.id, selectedNodes));
    const nodeIds = new Set(graphNodes.map((node) => node.id));
    const labelById = Object.fromEntries(graphNodes.map((node) => [node.id, node.label || node.id]));
    const graphEdges = (network?.edges || [])
        .filter((edge) => {
            if (!edge || !edge.source || !edge.target) return false;
            const visEdge = {
                id: `${edge.source}|${edge.target}`,
                from: edge.source,
                to: edge.target,
            };
            if (isNetworkEdgeHighlighted(visEdge, selectedNodes)) return true;
            return nodeIds.has(edge.source) && nodeIds.has(edge.target);
        })
        .map((edge) => ({
            source: edge.source,
            target: edge.target,
            label: edge.predicate || edge.label || "related",
            source_label: labelById[edge.source] || edge.source,
            target_label: labelById[edge.target] || edge.target,
        }));
    return { graphNodes, graphEdges };
}

export function createSelectedNodesExplainSession(network, selectedNodes, { context = "" } = {}) {
    const { graphNodes, graphEdges } = selectedNodesSubgraph(network, selectedNodes);
    if (!graphNodes.length) {
        throw new Error("Select at least one node on the heatmap or network before explaining.");
    }
    return {
        context: String(context || "").trim(),
        highlighted: graphNodes.map((node) => node.id),
        graphNodes,
        graphEdges,
    };
}

export function buildSelectedNodesExplanationDraft(network, selectedNodes, { context = "" } = {}) {
    const session = createSelectedNodesExplainSession(network, selectedNodes, { context });
    return buildExplanationDraft(session, EXPLAIN_SCOPE.KEY_NODES);
}

export function buildSelectedNodesExplainLlmPrompts(entry, { systemPrompt = SELECTED_NODES_EXPLAIN_SYSTEM_PROMPT } = {}) {
    const userPrompt = buildFullExplanationPromptPreview({
        queryText: entry?.query_text,
        additionalContext: entry?.additional_context,
        graphNodes: entry?.graph_nodes || [],
        graphEdges: entry?.graph_edges || [],
    });
    return {
        systemPrompt,
        userPrompt,
    };
}

/** Same sendPrompt contract as mechanism hypothesis generation (`vm.llmAnalyze`). */
export function sendLlmClientPrompt(llmClient, { systemPrompt, userPrompt }) {
    if (!llmClient || typeof llmClient.sendPrompt !== "function") {
        return Promise.reject(new Error("LLM client is not configured."));
    }
    return new Promise((resolve, reject) => {
        let done = false;
        const finish = (fn) => {
            if (done) return;
            done = true;
            fn();
        };
        llmClient.sendPrompt({
            systemPrompt,
            userPrompt,
            onResponse: (response) => {
                const text = String(response == null ? "" : response).trim();
                if (!text) {
                    finish(() => reject(new Error("Empty LLM response.")));
                    return;
                }
                finish(() => resolve(text));
            },
            onError: (err) => {
                finish(() =>
                    reject(err instanceof Error ? err : new Error(String(err || "Explanation failed.")))
                );
            },
            onEnd: () => {
                if (!done) {
                    finish(() => reject(new Error("Incomplete LLM response.")));
                }
            },
        });
    });
}

export async function runSelectedNodesExplanation({
    network,
    selectedNodes,
    context = "",
    entry = null,
    llmClient,
    systemPrompt = SELECTED_NODES_EXPLAIN_SYSTEM_PROMPT,
}) {
    const session = createSelectedNodesExplainSession(network, selectedNodes, { context });
    let draft = buildExplanationDraft(session, EXPLAIN_SCOPE.KEY_NODES);
    if (entry) {
        draft = patchExplanationEntry(draft, {
            ...(entry.query_text !== undefined ? { query_text: entry.query_text } : {}),
            ...(entry.additional_context !== undefined
                ? { additional_context: entry.additional_context }
                : {}),
        });
    }
    const loadingEntry = patchExplanationEntry(draft, { status: "loading", error: "" });
    const { systemPrompt: resolvedSystemPrompt, userPrompt } = buildSelectedNodesExplainLlmPrompts(
        loadingEntry,
        { systemPrompt }
    );
    const interpretation = await sendLlmClientPrompt(llmClient, {
        systemPrompt: resolvedSystemPrompt,
        userPrompt,
    });
    const timestamp = new Date().toISOString();
    const successEntry = patchExplanationEntry(loadingEntry, {
        interpretation,
        status: "success",
        timestamp,
        timestamp_label: new Date(timestamp).toLocaleTimeString([], {
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        }),
        interpretation_display: interpretationMarkdownForDisplay(interpretation),
        error: "",
    });
    return { session, entry: successEntry };
}

export function selectedNodesExplainHelperText(selectedCount) {
    const count = Number(selectedCount) || 0;
    return `This explanation is limited to ${count} selected node${count === 1 ? "" : "s"} on the heatmap or network.`;
}

export function selectedNodesExplainQueryPreview(selectedNodes, context = "") {
    const labels = (selectedNodes || []).map((node) => node?.label).filter(Boolean);
    return buildKeyNodesExplainQuestion({
        keyNodes: labels.map((label) => ({ label })),
        intent: "",
        backgroundContext: context,
    });
}

function cloneJson(value, fallback = null) {
    try {
        return JSON.parse(JSON.stringify(value));
    } catch (error) {
        return fallback;
    }
}

export function explanationMenuLabel(index, entry) {
    const num = Number(index) + 1;
    const labels = Array.isArray(entry?.scope_node_labels) ? entry.scope_node_labels.filter(Boolean) : [];
    const preview = labels.slice(0, 2).join(", ");
    const suffix = labels.length > 2 ? "…" : "";
    return preview ? `Explanation ${num}: ${preview}${suffix}` : `Explanation ${num}`;
}

export function buildSavedSelectedNodesExplanation({ entry, selectedNodes, context = "" }) {
    if (!entry || entry.status !== "success" || !String(entry.interpretation || "").trim()) {
        return null;
    }
    return {
        id: String(entry.id || `explanation-${Date.now()}`),
        savedAt: entry.timestamp || new Date().toISOString(),
        context: String(context || "").trim(),
        selectedNodes: cloneJson(selectedNodes, []),
        entry: cloneJson(entry, null),
    };
}

export function appendSavedSelectedNodesExplanation(list, record) {
    if (!record || !record.id) return Array.isArray(list) ? list.slice() : [];
    const next = Array.isArray(list) ? list.slice() : [];
    const idx = next.findIndex((item) => item && item.id === record.id);
    if (idx >= 0) {
        next[idx] = record;
    } else {
        next.unshift(record);
    }
    return next;
}

export function savedSelectedNodesExplanationMenuItems(explanations) {
    return (Array.isArray(explanations) ? explanations : [])
        .filter((item) => item && item.entry && item.entry.status === "success")
        .map((item, index) => ({
            id: item.id,
            menuLabel: explanationMenuLabel(index, item.entry),
            savedAt: item.savedAt || item.entry?.timestamp || "",
            title:
                (item.entry?.scope_node_labels || []).join(", ") ||
                item.entry?.query_text ||
                explanationMenuLabel(index, item.entry),
        }));
}

export function findSavedSelectedNodesExplanation(explanations, id) {
    const key = String(id || "");
    if (!key) return null;
    return (Array.isArray(explanations) ? explanations : []).find((item) => item && item.id === key) || null;
}

export function provenanceMenuLabel(index, geneSetIds) {
    const num = Number(index) + 1;
    const labels = (Array.isArray(geneSetIds) ? geneSetIds : []).filter(Boolean).map(String);
    const preview = labels.slice(0, 2).join(", ");
    const suffix = labels.length > 2 ? "…" : "";
    return preview ? `Dataset ${num}: ${preview}${suffix}` : `Dataset ${num}`;
}

export function buildSavedSelectedNodesProvenanceRun({ geneSetIds, items, selectedNodes }) {
    const ids = (Array.isArray(geneSetIds) ? geneSetIds : []).map((id) => String(id).trim()).filter(Boolean);
    if (!ids.length) return null;
    const normalizedItems = cloneJson(items, []);
    const hasContent = normalizedItems.some(
        (item) => item && (item.status === "ok" || item.status === "empty" || item.status === "error")
    );
    if (!hasContent) return null;
    const runId = `provenance-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    return {
        id: runId,
        savedAt: new Date().toISOString(),
        geneSetIds: ids,
        selectedNodes: cloneJson(selectedNodes, []),
        items: normalizedItems,
    };
}

export function appendSavedSelectedNodesProvenanceRun(list, record) {
    if (!record || !record.id) return Array.isArray(list) ? list.slice() : [];
    const next = Array.isArray(list) ? list.slice() : [];
    next.unshift(record);
    return next;
}

export function savedSelectedNodesProvenanceMenuItems(runs) {
    return (Array.isArray(runs) ? runs : [])
        .filter((item) => item && Array.isArray(item.geneSetIds) && item.geneSetIds.length)
        .map((item, index) => ({
            id: item.id,
            menuLabel: provenanceMenuLabel(index, item.geneSetIds),
            savedAt: item.savedAt || "",
            title: item.geneSetIds.join(", "),
        }));
}

export function findSavedSelectedNodesProvenanceRun(runs, id) {
    const key = String(id || "");
    if (!key) return null;
    return (Array.isArray(runs) ? runs : []).find((item) => item && item.id === key) || null;
}
