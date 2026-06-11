/** Compact session snapshot for canvas assistant planning. */

import { normalizeKeyNodeIds } from "./revealKgGraphBootstrap.js";

function countNodesByType(nodes = []) {
    const counts = { gene: 0, gene_set: 0, factor: 0, trait: 0 };
    for (const node of nodes) {
        const type = String(node?.type || node?.node_type || "").trim();
        if (Object.prototype.hasOwnProperty.call(counts, type)) {
            counts[type] += 1;
        }
    }
    return counts;
}

function summarizeNode(node) {
    return {
        node_id: node.id || node.node_id,
        label: node.label || node.id,
        type: node.type || node.node_type,
        is_starting_node: Boolean(node.is_anchor),
        is_selected: false,
    };
}

export function buildAssistantSessionContext(
    session,
    { interactiveLlmAvailable = false, viewOptions = {}, savedLibraryGraphs = [] } = {}
) {
    if (!session) {
        return null;
    }
    const nodes = session.graphNodes || [];
    const selectedIds = new Set(normalizeKeyNodeIds(session));
    const selectedNodes = nodes.filter((node) => selectedIds.has(node.id));
    const selectedGenes = selectedNodes.filter(
        (node) => String(node?.type || node?.node_type || "").trim() === "gene"
    );
    const traitLabels = nodes
        .filter((node) => String(node?.type || node?.node_type || "").trim() === "trait")
        .map((node) => node.label || node.id);
    const nodeSummaries = nodes.slice(0, 120).map((node) => ({
        ...summarizeNode(node),
        is_selected: selectedIds.has(node.id),
    }));
    const nodeById = new Map(nodes.map((node) => [node.id, node]));
    const graphEdges = session.graphEdges || [];
    const sampleEdges = graphEdges.slice(0, 60).map((edge) => {
        const source = nodeById.get(edge.source);
        const target = nodeById.get(edge.target);
        return {
            edge_id: edge.id,
            source_label: source?.label || edge.source,
            target_label: target?.label || edge.target,
            source_type: source?.type || source?.node_type || "",
            target_type: target?.type || target?.node_type || "",
        };
    });
    const layers = (session.visibilityFilterLayers || []).map((layer, index) => ({
        index: index + 1,
        id: layer.id,
        name: layer.name,
        enabled: layer.enabled !== false,
        intent: String(layer.criteria?.intent || "").trim(),
    }));
    return {
        graph_label: String(session.label || "").trim() || "Untitled graph",
        session_context: String(session.context || "").trim(),
        node_counts: countNodesByType(nodes),
        total_nodes: nodes.length,
        selected_node_ids: Array.from(selectedIds),
        selected_node_labels: selectedNodes.map((node) => node.label || node.id),
        selected_gene_count: selectedGenes.length,
        selected_gene_labels: selectedGenes.map((node) => node.label || node.id),
        trait_labels_on_graph: traitLabels,
        selected_trait_labels: selectedNodes
            .filter((node) => String(node?.type || node?.node_type || "").trim() === "trait")
            .map((node) => node.label || node.id),
        visibility_filters: layers,
        sample_nodes: nodeSummaries,
        nodes_truncated: nodes.length > nodeSummaries.length,
        sample_edges: sampleEdges,
        edges_truncated: graphEdges.length > sampleEdges.length,
        saved_library_graphs: (savedLibraryGraphs || []).slice(0, 40).map((record) => ({
            id: record.id,
            label: String(record.label || record.id || "").trim() || "Untitled graph",
        })),
        interactive_llm_available: Boolean(interactiveLlmAvailable),
        view_options: {
            hide_jumping_edges: viewOptions.hideJumpingEdges !== false,
            hide_contextual_edges: viewOptions.hideContextualEdges !== false,
        },
    };
}
