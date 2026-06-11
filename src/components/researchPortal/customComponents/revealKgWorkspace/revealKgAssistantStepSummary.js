/** Short user-facing summaries after an assistant step completes. */

export function formatAssistantStepSummary(step, meta = {}) {
    const action = step?.action;
    const label = String(step?.label || "").trim();

    switch (action) {
        case "expand_graph": {
            const count = Number(meta.addedCount);
            if (Number.isFinite(count) && count >= 0) {
                return count
                    ? `Added ${count} node${count === 1 ? "" : "s"} to the graph.`
                    : "Expansion finished — no new nodes were added.";
            }
            return label ? `Finished: ${label}` : "Graph expansion finished.";
        }
        case "filter_graph": {
            if (meta.enabled === true) {
                return "Enabled the visibility filter.";
            }
            if (meta.enabled === false) {
                return "Disabled the visibility filter.";
            }
            const visible = meta.afterVisibleCount;
            if (Number.isFinite(visible)) {
                return `Built visibility filter — ${visible} node${
                    visible === 1 ? "" : "s"
                } visible.`;
            }
            return label ? `Finished: ${label}` : "Visibility filter updated.";
        }
        case "select_nodes": {
            if (meta.cleared) {
                return "Cleared all selected nodes.";
            }
            const count = Number(meta.markedCount);
            if (Number.isFinite(count)) {
                return `Marked ${count} node${count === 1 ? "" : "s"} as selected.`;
            }
            return label ? `Finished: ${label}` : "Selection updated.";
        }
        case "select_visible_nodes": {
            if (meta.cleared) {
                return "Cleared all selected nodes.";
            }
            const count = Number(meta.markedCount);
            if (Number.isFinite(count)) {
                return `Marked ${count} visible node${count === 1 ? "" : "s"} as selected.`;
            }
            return label ? `Finished: ${label}` : "Visible nodes selected.";
        }
        case "unselect_nodes": {
            if (meta.cleared) {
                const count = Number(meta.unselectedCount);
                if (Number.isFinite(count) && count > 0) {
                    return `Unmarked all ${count} selected node${count === 1 ? "" : "s"}.`;
                }
                return "Cleared all selected nodes.";
            }
            const count = Number(meta.unselectedCount);
            if (Number.isFinite(count)) {
                return `Unmarked ${count} node${count === 1 ? "" : "s"}.`;
            }
            return label ? `Finished: ${label}` : "Selection updated.";
        }
        case "explain_graph":
            return "Graph explanation is ready — review it in Explain graph.";
        case "build_hypotheses": {
            const chains = Number(meta.chainCount);
            if (Number.isFinite(chains)) {
                return chains
                    ? `Ranked ${chains} pathway${chains === 1 ? "" : "s"} — open Build hypotheses to review.`
                    : "Pathway ranking finished — no pathways matched.";
            }
            return "Hypothesis ranking finished.";
        }
        case "find_datasets": {
            const count = Number(meta.datasetCount);
            if (Number.isFinite(count)) {
                return count
                    ? `Found ${count} related dataset${count === 1 ? "" : "s"}.`
                    : "Dataset search finished — no matches.";
            }
            return "Related dataset search finished.";
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
                return "Reset the graph view to show the full canvas.";
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
                ? "Hid contextual edges."
                : "Showing contextual edges.";
        case "set_jumping_edges_visible":
            return meta.hideJumpingEdges ? "Hid jumping edges." : "Showing jumping edges.";
        case "toggle_data_table":
            return meta.graphTableOpen ? "Opened the data table." : "Closed the data table.";
        case "export_graph":
            return "Opened Export graph.";
        case "import_graph":
            return "Opened Import graph.";
        case "save_graph":
            return "Opened Save to library.";
        case "new_graph":
            return "Started a new graph.";
        case "download_snapshot":
            return "Downloaded the graph snapshot.";
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
                return `Removed ${count} hidden node${count === 1 ? "" : "s"} from the graph.`;
            }
            return "Removed hidden nodes from the graph.";
        }
        case "add_node": {
            const count = Number(meta.addedCount);
            if (Number.isFinite(count) && count > 0) {
                return `Added ${count} node${count === 1 ? "" : "s"} to the graph.`;
            }
            return label ? `Finished: ${label}` : "Added node to the graph.";
        }
        case "open_filter_panel":
            return "Opened the visibility filter panel.";
        case "open_my_library":
            return "Opened My library.";
        case "open_library_graph":
            return meta.graphLabel
                ? `Loaded "${meta.graphLabel}" from My library.`
                : "Loaded a saved graph from My library.";
        default:
            return label ? `Finished: ${label}` : "Step completed.";
    }
}
