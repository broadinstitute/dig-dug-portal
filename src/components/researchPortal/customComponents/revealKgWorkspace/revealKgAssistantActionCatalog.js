/** User-facing catalog of canvas assistant actions (Actions tab). */

export const ASSISTANT_ACTION_CATALOG = [
    {
        group: "Graph",
        actions: [
            {
                id: "expand_graph",
                label: "Expand graph",
                description:
                    "Fetch and add up to 20 neighbor nodes per step from selected seeds or a named node.",
                examples: [
                    "Expand from selected genes",
                    "Add 10 neighbor mechanisms to BRCA1",
                    "Expand neighbors from the edge between TP53 and BRCA1",
                ],
            },
            {
                id: "open_expand_panel",
                label: "Open Expand KG",
                description: "Open the Expand KG panel with seeds prefilled (no fetch yet).",
                examples: [
                    "Open expand panel for selected nodes",
                    "Open Expand KG from BRCA1",
                ],
            },
            {
                id: "focus_graph_view",
                label: "Focus view",
                description: "Pan and zoom to selected nodes or fit the whole graph.",
                examples: [
                    "Zoom to selected nodes",
                    "Fit the whole graph in view",
                ],
            },
            {
                id: "filter_graph",
                label: "Filter graph",
                description:
                    "Build or toggle visibility filters by intent, novelty, or expression.",
                examples: [
                    "Filter genes related to insulin resistance",
                    "Enable the last visibility filter",
                ],
            },
            {
                id: "unselect_nodes",
                label: "Unselect nodes",
                description:
                    "Remove nodes from the current selection without deleting them from the graph.",
                examples: [
                    "Unselect all selected nodes",
                    "Unselect all visible genes",
                    "Unselect BRCA1",
                ],
            },
            {
                id: "select_visible_nodes",
                label: "Select visible nodes",
                description:
                    "Mark all nodes currently shown on the canvas as selected (respects visibility filters).",
                examples: [
                    "Select all visible nodes",
                    "Select all visible genes",
                ],
            },
            {
                id: "select_nodes",
                label: "Select nodes",
                description:
                    "Mark nodes as selected (blue) on the canvas, including top-N picks (up to 20 per step).",
                examples: [
                    "Select top 5 genes connected to Type 2 diabetes",
                    "Clear selected nodes",
                ],
            },
            {
                id: "remove_node",
                label: "Remove node",
                description: "Remove one or more nodes from the graph.",
                examples: [
                    "Remove BRCA1 from the graph",
                    "Remove TP53 from the graph",
                ],
            },
            {
                id: "remove_invisible_nodes",
                label: "Remove hidden nodes",
                description: "Delete all nodes currently hidden by visibility filters.",
                examples: ["Remove invisible nodes", "Delete hidden nodes from the graph"],
            },
            {
                id: "add_node",
                label: "Add node",
                description:
                    "Search the catalog and add up to 20 nodes per step. Nodes appear first; edges are rebuilt automatically.",
                examples: [
                    "Add TP53 to the graph",
                    "Add 5 gene sets matching insulin signaling",
                    "Add 10 traits matching type 2 diabetes",
                    "Add 5 mechanisms matching insulin resistance",
                ],
            },
            {
                id: "add_nodes_by_intent",
                label: "Add nodes by intention",
                description:
                    "Describe a research goal; the assistant plans catalog searches and adds up to 20 gene sets, mechanisms, and traits per step.",
                examples: [
                    "Find a glycosylation mechanism that could alter lipoprotein handling and coagulation",
                    "Add nodes related to adipose expansion and adverse metabolic outcomes",
                ],
            },
            {
                id: "open_filter_panel",
                label: "Open filter panel",
                description: "Open the visibility filter panel without running a filter.",
                examples: ["Open the filter panel", "Show visibility filters"],
            },
        ],
    },
    {
        group: "My library",
        actions: [
            {
                id: "open_my_library",
                label: "Open My library",
                description: "Browse graphs saved in this browser.",
                examples: ["Open My library", "Show my saved graphs"],
            },
            {
                id: "open_library_graph",
                label: "Open saved graph",
                description: "Load a named graph from My library onto the canvas.",
                examples: ["Open my Waist-hip ratio graph", "Load saved graph Type 2 diabetes study"],
            },
        ],
    },
    {
        group: "Analyze",
        actions: [
            {
                id: "explain_graph",
                label: "Explain graph",
                description:
                    "Generate an LLM summary of selected nodes or all visible nodes.",
                examples: [
                    "Explain selected nodes",
                    "Explain all visible nodes on the graph",
                ],
            },
            {
                id: "build_hypotheses",
                label: "Build hypotheses",
                description:
                    "Rank gene → mechanism → trait pathways and generate hypotheses.",
                examples: [
                    "Build hypotheses for known pathways only",
                    "Build hypotheses for selected nodes",
                ],
            },
            {
                id: "find_datasets",
                label: "Find related datasets",
                description: "Search CFDE gene sets from selected genes.",
                examples: ["Find related datasets", "Find CFDE gene sets for selected genes"],
            },
        ],
    },
    {
        group: "View",
        actions: [
            {
                id: "set_jumping_edges_visible",
                label: "Jumping edges",
                description: "Show or hide hopping / jumping edges.",
                examples: ["Show jumping edges", "Hide jumping edges"],
            },
            {
                id: "set_contextual_edges_visible",
                label: "Contextual edges",
                description: "Show or hide dashed contextual edges.",
                examples: ["Show contextual edges", "Hide contextual edges"],
            },
            {
                id: "toggle_data_table",
                label: "Data table",
                description: "Open or close the graph data table panel.",
                examples: ["Open the data table", "Close the data table"],
            },
            {
                id: "inspect",
                label: "Inspect",
                description: "Open the inspector for a node or edge on the graph.",
                examples: ["Inspect BRCA1", "Inspect the edge between TP53 and BRCA1"],
            },
        ],
    },
    {
        group: "Manage",
        actions: [
            {
                id: "export_graph",
                label: "Export graph",
                description: "Download the current workflow JSON.",
                examples: ["Export the graph"],
            },
            {
                id: "import_graph",
                label: "Import graph",
                description: "Open the import-graph flow.",
                examples: ["Import a saved graph"],
            },
            {
                id: "save_graph",
                label: "Save to library",
                description: "Save the current graph layout to My library.",
                examples: ["Save this graph to my library"],
            },
            {
                id: "new_graph",
                label: "New graph",
                description: "Start a new graph from scratch.",
                examples: ["Start a new graph"],
            },
            {
                id: "download_snapshot",
                label: "Download snapshot",
                description: "Download an HTML snapshot of the current graph.",
                examples: ["Download a graph snapshot"],
            },
        ],
    },
];

export function catalogActionIds(catalog = ASSISTANT_ACTION_CATALOG) {
    return (catalog || []).flatMap((group) => group.actions.map((action) => action.id));
}

export function defaultProgressMessageForAction(action) {
    switch (action) {
        case "expand_graph":
            return "Expanding graph…";
        case "filter_graph":
            return "Building visibility filter…";
        case "explain_graph":
            return "Generating graph explanation…";
        case "build_hypotheses":
            return "Ranking pathways…";
        case "find_datasets":
            return "Finding related datasets…";
        case "select_nodes":
            return "Updating selected nodes…";
        case "select_visible_nodes":
            return "Selecting visible nodes…";
        case "unselect_nodes":
            return "Updating selection…";
        case "open_expand_panel":
            return "Opening Expand KG…";
        case "focus_graph_view":
            return "Adjusting graph view…";
        case "add_node":
            return "Adding node…";
        case "add_nodes_by_intent":
            return "Finding nodes from your intention…";
        case "remove_node":
            return "Removing nodes…";
        case "remove_invisible_nodes":
            return "Removing hidden nodes…";
        case "open_library_graph":
            return "Loading saved graph…";
        default:
            return "Running assistant action…";
    }
}

export function assistantActionUsesExpandProgress(action) {
    return action === "expand_graph";
}

export function assistantActionShowsProgressOverlay(action, options = {}) {
    if (action === "expand_graph") {
        return true;
    }
    if (action === "filter_graph") {
        return (options.mode || "build") === "build";
    }
    return [
        "explain_graph",
        "build_hypotheses",
        "find_datasets",
    ].includes(action);
}
