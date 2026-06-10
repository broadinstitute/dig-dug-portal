/** User-facing catalog of canvas assistant actions (Actions tab). */

export const ASSISTANT_ACTION_CATALOG = [
    {
        group: "Graph",
        actions: [
            {
                id: "expand_graph",
                label: "Expand graph",
                description: "Fetch and add neighbor nodes from selected seeds or a named node.",
                examples: [
                    "Expand from selected genes",
                    "Add 10 neighbor mechanisms to BRCA1",
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
                id: "select_nodes",
                label: "Select nodes",
                description: "Mark nodes as selected (blue) on the canvas, including top-N picks.",
                examples: [
                    "Select top 5 genes connected to Type 2 diabetes",
                    "Clear selected nodes",
                ],
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
