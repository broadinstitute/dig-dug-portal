/** Short user-facing summaries after an assistant step completes. */

function withBulkWorkflowNote(message, meta = {}) {
    const note = String(meta.bulkWorkflowNote || "").trim();
    if (!note) {
        return message;
    }
    const base = String(message || "").trim();
    return base ? `${base} ${note}` : note;
}

function quotedFilterLabel(meta = {}) {
    const label = String(meta.filterLabel || "").trim();
    return label ? `“${label}”` : "";
}

export function formatAssistantStepSummary(step, meta = {}) {
    const action = step?.action;
    const label = String(step?.label || "").trim();

    switch (action) {
        case "expand_graph": {
            const count = Number(meta.addedCount);
            if (Number.isFinite(count) && count >= 0) {
                return withBulkWorkflowNote(
                    count
                        ? `Added ${count} node${count === 1 ? "" : "s"} to the graph.`
                        : "Expansion finished — no new nodes matched the request.",
                    meta
                );
            }
            return withBulkWorkflowNote(
                label ? `Finished: ${label}` : "Graph expansion finished.",
                meta
            );
        }
        case "filter_graph": {
            const filterName = quotedFilterLabel(meta);
            if (meta.enabled === true) {
                return filterName
                    ? `Turned on filter ${filterName}.`
                    : "Turned on the visibility filter.";
            }
            if (meta.enabled === false) {
                return filterName
                    ? `Turned off filter ${filterName}.`
                    : "Turned off the visibility filter.";
            }
            const visible = meta.afterVisibleCount;
            const total = meta.totalNodeCount;
            const filterLabel = String(meta.filterLabel || "").trim();
            if (Number.isFinite(visible)) {
                const namePrefix = filterLabel ? `${filterLabel} — ` : "";
                if (Number.isFinite(total) && total > visible) {
                    const hidden = total - visible;
                    return `${namePrefix}${visible} of ${total} node${
                        total === 1 ? "" : "s"
                    } visible (${hidden} hidden).`;
                }
                return `${namePrefix}${visible} node${visible === 1 ? "" : "s"} visible on canvas.`;
            }
            return label ? `Finished: ${label}` : "Visibility filter updated.";
        }
        case "select_connected_nodes": {
            const count = Number(meta.markedCount);
            const seed = String(meta.seedLabel || "").trim();
            if (Number.isFinite(count)) {
                return seed
                    ? `Selected ${count} node${count === 1 ? "" : "s"} connected to ${seed}.`
                    : `Selected ${count} connected node${count === 1 ? "" : "s"}.`;
            }
            return label ? `Finished: ${label}` : "Updated connected-node selection.";
        }
        case "select_nodes": {
            if (meta.cleared) {
                return "Cleared node selection.";
            }
            const count = Number(meta.markedCount);
            if (Number.isFinite(count)) {
                return `Selected ${count} node${count === 1 ? "" : "s"} on the canvas.`;
            }
            return label ? `Finished: ${label}` : "Updated node selection.";
        }
        case "select_visible_nodes": {
            if (meta.cleared) {
                return "Cleared node selection.";
            }
            const count = Number(meta.markedCount);
            if (Number.isFinite(count)) {
                return `Selected ${count} visible node${count === 1 ? "" : "s"} on the canvas.`;
            }
            return label ? `Finished: ${label}` : "Selected visible nodes.";
        }
        case "unselect_nodes": {
            if (meta.cleared) {
                const count = Number(meta.unselectedCount);
                if (Number.isFinite(count) && count > 0) {
                    return `Unselected ${count} node${count === 1 ? "" : "s"}.`;
                }
                return "Cleared node selection.";
            }
            const count = Number(meta.unselectedCount);
            if (Number.isFinite(count)) {
                return `Unselected ${count} node${count === 1 ? "" : "s"}.`;
            }
            return label ? `Finished: ${label}` : "Updated node selection.";
        }
        case "explain_graph":
            return "Graph explanation is ready — open Explain graph to read it.";
        case "build_hypotheses": {
            const chains = Number(meta.chainCount);
            if (Number.isFinite(chains)) {
                return chains
                    ? `Ranked ${chains} pathway${chains === 1 ? "" : "s"} — open Build hypotheses to review.`
                    : "Pathway ranking finished — no pathways matched the current graph.";
            }
            return "Hypothesis ranking finished — open Build hypotheses to review.";
        }
        case "find_datasets": {
            const count = Number(meta.datasetCount);
            if (Number.isFinite(count)) {
                return count
                    ? `Found ${count} related dataset${count === 1 ? "" : "s"} — open Find related datasets to review.`
                    : "No related datasets matched the selected genes.";
            }
            return "Dataset search finished.";
        }
        case "map_genes": {
            const count = Number(meta.sharedGeneCount);
            if (Number.isFinite(count)) {
                return count
                    ? `Mapped ${count} shared gene${count === 1 ? "" : "s"} across selected gene sets.`
                    : "No genes are shared across more than two of the selected gene sets.";
            }
            return "Opened Map genes.";
        }
        case "open_provenance_explorer": {
            const count = Number(meta.geneSetCount);
            if (Number.isFinite(count) && count > 0) {
                return `Copied ${count} gene set${count === 1 ? "" : "s"} and opened the provenance explorer.`;
            }
            return "Opened the provenance explorer.";
        }
        case "open_expand_panel": {
            const count = Number(meta.seedCount);
            if (Number.isFinite(count) && count > 0) {
                return `Opened Expand KG with ${count} seed node${count === 1 ? "" : "s"}.`;
            }
            return "Opened Expand KG.";
        }
        case "focus_graph_view": {
            const count = Number(meta.focusedCount);
            if (meta.resetView) {
                return "Fitted the full graph in view.";
            }
            if (Number.isFinite(count) && count > 0) {
                return `Centered the view on ${count} node${count === 1 ? "" : "s"}.`;
            }
            return "Adjusted the graph view.";
        }
        case "inspect":
            return meta.inspect?.subject === "edge"
                ? "Opened the inspector for that edge."
                : "Opened the inspector for that node.";
        case "set_contextual_edges_visible":
            return meta.hideContextualEdges
                ? "Contextual edges are now hidden."
                : "Contextual edges are now visible.";
        case "set_jumping_edges_visible":
            return meta.hideJumpingEdges
                ? "Jumping edges are now hidden."
                : "Jumping edges are now visible.";
        case "toggle_data_table":
            return meta.graphTableOpen
                ? "Opened the data table."
                : "Closed the data table.";
        case "export_graph":
            return "Opened Export graph.";
        case "import_graph":
            return "Opened Import graph.";
        case "save_graph":
            return "Opened Save to library.";
        case "new_graph":
            return "Opened new graph setup.";
        case "download_snapshot":
            return meta.downloaded === false
                ? "Could not download a snapshot — the canvas is empty."
                : "Downloaded the graph snapshot.";
        case "remove_node": {
            const count = Number(meta.removedCount);
            if (Number.isFinite(count)) {
                const skipped = Number(meta.skippedCount) || 0;
                const base = `Removed ${count} node${count === 1 ? "" : "s"} from the graph.`;
                return skipped
                    ? `${base} ${skipped} selected node${skipped === 1 ? "" : "s"} could not be removed.`
                    : base;
            }
            return label ? `Finished: ${label}` : "Removed node(s) from the graph.";
        }
        case "remove_invisible_nodes": {
            const count = Number(meta.removedCount);
            if (Number.isFinite(count)) {
                return count
                    ? `Removed ${count} hidden node${count === 1 ? "" : "s"} from the graph.`
                    : "No hidden nodes were on the graph.";
            }
            return "Removed hidden nodes from the graph.";
        }
        case "add_node": {
            const count = Number(meta.addedCount);
            if (Number.isFinite(count) && count > 0) {
                return withBulkWorkflowNote(
                    `Added ${count} node${count === 1 ? "" : "s"} to the graph. Edges will rebuild shortly.`,
                    meta
                );
            }
            return withBulkWorkflowNote(
                label ? `Finished: ${label}` : "Added node(s) to the graph.",
                meta
            );
        }
        case "add_nodes_by_intent": {
            const count = Number(meta.addedCount);
            const base =
                Number.isFinite(count) && count > 0
                    ? `Added ${count} node${count === 1 ? "" : "s"} from your research question.`
                    : label || "Finished adding nodes from your research question.";
            return meta.geneGuidance ? `${base} ${meta.geneGuidance}` : base;
        }
        case "add_phenotype_gene_sets": {
            const count = Number(meta.addedCount);
            const traits = Number(meta.traitCount);
            const geneSets = Number(meta.geneSetCount);
            if (Number.isFinite(count) && count > 0) {
                const detail = [];
                if (Number.isFinite(traits) && traits > 0) {
                    detail.push(`${traits} trait${traits === 1 ? "" : "s"}`);
                }
                if (Number.isFinite(geneSets) && geneSets > 0) {
                    detail.push(`${geneSets} gene set${geneSets === 1 ? "" : "s"}`);
                }
                const breakdown = detail.length ? ` (${detail.join(", ")})` : "";
                return withBulkWorkflowNote(
                    `Added ${count} node${count === 1 ? "" : "s"} from trait–gene set search${breakdown}.`,
                    meta
                );
            }
            return withBulkWorkflowNote(
                label || "Finished trait–gene set search.",
                meta
            );
        }
        case "add_gene_set_crossing": {
            const count = Number(meta.addedCount);
            return withBulkWorkflowNote(
                Number.isFinite(count) && count > 0
                    ? `Added ${count} crossing gene set${count === 1 ? "" : "s"} (∩).`
                    : label || "No crossing gene sets matched the search.",
                meta
            );
        }
        case "open_filter_panel":
            return "Opened the visibility filter panel.";
        case "open_my_library":
            return "Opened My library.";
        case "open_library_graph":
            return meta.graphLabel
                ? `Loaded “${meta.graphLabel}” from My library.`
                : "Loaded a saved graph from My library.";
        default:
            return label ? `Finished: ${label}` : "Step completed.";
    }
}
