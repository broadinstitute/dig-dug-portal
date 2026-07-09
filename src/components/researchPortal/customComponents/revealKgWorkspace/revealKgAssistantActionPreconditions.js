/** Pre-execution checks for assistant actions (session / graph state). */

function hasGraphNodes(session) {
    return (session?.graphNodes?.length || 0) > 0;
}

function hasSelectedKeyNodes(session) {
    const highlighted = session?.highlighted || session?.keyNodes || [];
    return Array.isArray(highlighted) ? highlighted.length > 0 : false;
}

/**
 * @returns {string|null} User-facing reason the step cannot run, or null if OK.
 */
export function getAssistantActionPreconditionMessage(session, step) {
    const action = String(step?.action || "").trim();
    if (!action) {
        return null;
    }
    if (!session) {
        return "Start a canvas session before running assistant actions.";
    }

    switch (action) {
        case "open_filter_panel":
            if (!hasGraphNodes(session)) {
                return "The filter panel can't open on an empty canvas. Add nodes first (Expand KG → Add nodes, or ask the assistant to add entities).";
            }
            break;
        case "filter_graph":
        case "remove_invisible_nodes":
            if (!hasGraphNodes(session)) {
                return "Visibility filters need nodes on the canvas. Add nodes or load a saved graph first.";
            }
            break;
        case "expand_graph":
            if (!hasGraphNodes(session)) {
                return "Expand needs at least one seed node on the canvas. Add nodes first, then expand from them.";
            }
            break;
        case "explain_graph":
            if (!hasGraphNodes(session)) {
                return "Explain graph needs nodes on the canvas. Add or load a graph first.";
            }
            break;
        case "build_hypotheses":
            if (!hasGraphNodes(session)) {
                return "Build hypotheses needs nodes on the canvas. Add or load a graph first.";
            }
            if (!hasSelectedKeyNodes(session)) {
                return "Mark one or more nodes as selected on the canvas before building hypotheses.";
            }
            break;
        case "export_graph":
        case "save_graph":
        case "download_snapshot":
            if (!hasGraphNodes(session)) {
                return "There is nothing to export or save yet. Add nodes or load a saved graph first.";
            }
            break;
        case "map_genes":
        case "open_provenance_explorer":
            if (!hasGraphNodes(session)) {
                return "This action needs a graph on the canvas. Add nodes first.";
            }
            if (!hasSelectedKeyNodes(session)) {
                return "Select one or more gene sets on the canvas (blue highlight), then try again.";
            }
            break;
        case "find_datasets":
            if (!hasGraphNodes(session)) {
                return "Find related datasets needs genes on the canvas. Add genes first.";
            }
            if (!hasSelectedKeyNodes(session)) {
                return "Select one or more genes on the canvas (blue highlight), then try again.";
            }
            break;
        case "focus_graph_view": {
            const scope = step?.options?.scope || "target";
            if (scope === "entire_graph" && !hasGraphNodes(session)) {
                return "Fit view needs nodes on the canvas.";
            }
            break;
        }
        default:
            break;
    }
    return null;
}

export function validateAssistantStepPreconditions(session, steps = []) {
    const list = Array.isArray(steps) ? steps : [];
    for (const step of list) {
        const message = getAssistantActionPreconditionMessage(session, step);
        if (message) {
            return message;
        }
    }
    return null;
}

export function assistantPreconditionClarifyJson(message, step) {
    const action = String(step?.action || "").trim();
    const suggestions = [];
    if (
        ["open_filter_panel", "filter_graph", "expand_graph", "explain_graph"].includes(action)
    ) {
        suggestions.push("Add nodes: “Start a new graph”, then Expand KG → Add nodes.");
        suggestions.push("Or say “Open My library” and load a saved graph.");
    } else if (["export_graph", "save_graph", "download_snapshot"].includes(action)) {
        suggestions.push("Build a graph first, or open one from My library.");
    } else if (["map_genes", "find_datasets", "open_provenance_explorer", "build_hypotheses"].includes(action)) {
        suggestions.push("Click nodes on the canvas to mark them selected (blue), then run the action again.");
    } else {
        suggestions.push("Open the Actions tab for example requests.");
    }
    return {
        response_type: "clarify",
        message,
        issues: [message],
        suggestions,
    };
}
