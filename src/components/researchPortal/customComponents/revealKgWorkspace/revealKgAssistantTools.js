/** Canvas assistant action catalog (v2 planner). */

import { CANVAS_ASSISTANT_PER_STEP_MAX } from "./revealKgBulkWorkflowGuidance.js";
import { TRAIT_GENE_SET_PAIR_SEARCH_MAX } from "./revealKgTraitGeneSetExpand.js";

export const ASSISTANT_NODE_TYPES = ["gene", "gene_set", "factor", "trait"];

/**
 * One action per user-facing canvas capability.
 * Each step uses: action, label, target (default all), options (action-specific).
 */
export const ASSISTANT_ACTIONS = [
    {
        action: "remove_node",
        description:
            "Remove node(s) from the canvas by name or target. One step — auto-unmarks removal targets; do not prepend select_nodes clear.",
        has_options: false,
        options: {},
    },
    {
        action: "add_node",
        description:
            "Add gene(s), trait(s), mechanism(s), or gene set(s) by catalog search. Places nodes on the canvas first; structural edges are built in a follow-up rebuild step. Does not fetch expansion neighbors — use expand_graph for that.",
        has_options: true,
        options: {
            node_type: "gene | gene_set | factor | trait (default gene when adding by label)",
            search_label: "catalog query or exact label to search for",
            limit: `optional number 1–${CANVAS_ASSISTANT_PER_STEP_MAX} — add top N catalog matches (phrase search for gene sets, traits, mechanisms; genes when limit > 1 or multi-word query)`,
        },
    },
    {
        action: "add_nodes_by_intent",
        description:
            "Add gene sets, mechanisms, and traits by describing research intention in plain language. LLM plans catalog search phrases and adds up to 20 total matches per step (does not add genes — use expand_graph from added nodes for genes).",
        has_options: true,
        options: {
            research_intent:
                "full scientific question or goal (defaults to the user query when omitted)",
            node_types:
                "optional [gene_set, factor, trait] — when set, only those types are added; otherwise inferred from phrases like \"add gene set nodes\"",
        },
        requires_interactive_llm: true,
    },
    {
        action: "add_gene_set_crossing",
        description:
            "Search and add crossing (intersection) gene sets from two programs/corpora in one semantic query. Use when the user says crossed with, intersection, or overlap between sources (e.g. GTEx crossed with LINCS). Runs one gene-set search and adds only catalog nodes whose ids contain ___ (subtitle shows ∩). Do not split into separate per-program searches.",
        has_options: true,
        options: {
            search_query:
                "full crossing search phrase including biology and both programs (defaults to user query)",
            limit: `optional number 1–${CANVAS_ASSISTANT_PER_STEP_MAX} — max crossing gene sets to add (default 8)`,
        },
    },
    {
        action: "add_phenotype_gene_sets",
        description:
            "Search trait–gene set association pairs by research question using phenotype-mode embedding search. Adds matching traits and gene sets (up to 20 total nodes per step). Use when the user asks for phenotypes/traits and gene sets together, or gives an open-ended research question without naming mechanisms. Do not use for mechanism-only or gene-set-only requests.",
        has_options: true,
        options: {
            search_query:
                "plain-language research question for embedding search (defaults to user query). Replace phenotype/trait database ids with human-readable labels — never pass raw gcat_trait_* or trait: ids when a readable name is known.",
            limit: `optional number 1–${CANVAS_ASSISTANT_PER_STEP_MAX} — max association pairs to fetch (default 10)`,
        },
    },
    {
        action: "remove_invisible_nodes",
        description:
            "Permanently delete all nodes currently hidden by visibility filters from the graph.",
        has_options: false,
        options: {},
    },
    {
        action: "open_filter_panel",
        description:
            "Open the visibility filter panel for manual review (does not build or run a filter).",
        has_options: false,
        options: {},
    },
    {
        action: "close_filter_panel",
        description: "Close the visibility filter panel.",
        has_options: false,
        options: {},
    },
    {
        action: "close_expand_panel",
        description: "Close the Expand KG panel.",
        has_options: false,
        options: {},
    },
    {
        action: "open_my_library",
        description: "Open My library to browse saved graphs in this browser.",
        has_options: false,
        options: {},
    },
    {
        action: "open_library_graph",
        description:
            "Load a saved graph from My library onto the canvas by label (see saved_library_graphs in session context).",
        has_options: true,
        options: {
            graph_label: "saved graph title (required unless graph_id is set)",
            graph_id: "optional saved graph id",
        },
    },
    {
        action: "open_expand_panel",
        description:
            "Open the Expand KG panel with seed nodes prefilled. Does not run expansion — use expand_graph to fetch neighbors immediately.",
        has_options: false,
        options: {},
    },
    {
        action: "open_expansion_history",
        description:
            "Open the Expand KG panel on the History tab to review past expansion runs.",
        has_options: false,
        options: {},
    },
    {
        action: "focus_graph_view",
        description:
            "Pan and zoom the canvas to show target nodes, or reset to the full graph when scope is entire_graph.",
        has_options: true,
        options: {
            scope: "target (default) | entire_graph",
            fit: "boolean — zoom to fit target nodes (default true)",
        },
    },
    {
        action: "expand_graph",
        description:
            "Fetch and add neighbor nodes from the API. Seeds are usually selected nodes unless the user names a specific node or edge. For trait seeds expanding to gene sets, set target_type gene_set with filter_type intent and options.intent (phenotype semantic search).",
        has_options: true,
        options: {
            target_type: "all | gene | gene_set | factor | trait",
            count: `number 1–${CANVAS_ASSISTANT_PER_STEP_MAX} gene sets to add per step (without intent: trait connection scores; with intent: phenotype semantic search up to ${TRAIT_GENE_SET_PAIR_SEARCH_MAX} pairs per trait)`,
            connection_scope: "direct | two_hop",
            reducer: "max (any) | mean (balanced) | min (all)",
            filter_type: "none | intent | novelty | expression",
            intent: "string when filter_type is intent",
            relevance_mode: "llm | semantic",
            novelty_known: "boolean",
            novelty_novel: "boolean",
            expression_tissue: "string",
            expression_cell_type: "string",
            expression_absolute_min: "number or empty",
            expression_relative_max: "number or empty",
        },
        requires_interactive_llm: true,
    },
    {
        action: "filter_graph",
        description:
            "Build or toggle a visibility filter layer that annotates nodes and controls what is shown.",
        has_options: true,
        options: {
            mode: "build (default) | enable | disable",
            filter_ref: "last | filter_id when mode is enable or disable",
            filter_type: "intent | novelty | expression (for build)",
            intent: "string when using intent",
            relevance_mode: "llm | semantic",
            novelty_known: "boolean",
            novelty_novel: "boolean",
            expression_tissue: "string",
            expression_cell_type: "string",
            expression_absolute_min: "number or empty",
            expression_relative_max: "number or empty",
        },
        requires_interactive_llm: true,
    },
    {
        action: "explain_graph",
        description:
            "Generate an LLM explanation of nodes on the canvas (selected_nodes = blue nodes only; entire_graph = all visible nodes). Does not fetch neighbors.",
        has_options: true,
        options: {
            scope: "selected_nodes | entire_graph",
            query_text: "optional custom question",
            additional_context: "optional extra context",
        },
        requires_interactive_llm: true,
    },
    {
        action: "build_hypotheses",
        description:
            "Rank gene → mechanism → trait pathways among selected nodes and generate hypotheses.",
        has_options: true,
        options: {
            query_text: "optional ranking question",
            additional_context: "optional intent / context",
            novelty_known: "boolean",
            novelty_novel: "boolean",
        },
        requires_interactive_llm: true,
    },
    {
        action: "find_datasets",
        description:
            "Find related CFDE gene sets from selected genes on the canvas. No extra options.",
        has_options: false,
        options: {},
    },
    {
        action: "map_genes",
        description:
            "Map genes shared across selected gene sets. Opens a membership table of genes that appear in more than two selected gene sets.",
        has_options: false,
        options: {},
    },
    {
        action: "open_provenance_explorer",
        description:
            "Gather provenance details for selected gene sets, copy them to the clipboard, and open the provenance explorer.",
        has_options: false,
        options: {},
    },
    {
        action: "export_graph",
        description: "Export the current graph workflow JSON file.",
        has_options: false,
        options: {},
    },
    {
        action: "import_graph",
        description: "Open the import-graph flow.",
        has_options: false,
        options: {},
    },
    {
        action: "save_graph",
        description: "Save the current graph to My library (layout only).",
        has_options: false,
        options: {},
    },
    {
        action: "new_graph",
        description: "Start a new graph (Manage → New graph).",
        has_options: false,
        options: {},
    },
    {
        action: "download_snapshot",
        description: "Download an HTML graph snapshot.",
        has_options: false,
        options: {},
    },
    {
        action: "set_contextual_edges_visible",
        description: "Show or hide dashed contextual edges on the canvas.",
        has_options: true,
        options: {
            visible: "boolean — true to show, false to hide",
        },
    },
    {
        action: "set_jumping_edges_visible",
        description: "Show or hide jumping / hopping edges on the canvas.",
        has_options: true,
        options: {
            visible: "boolean — true to show, false to hide",
        },
    },
    {
        action: "toggle_data_table",
        description: "Open or close the graph data table panel.",
        has_options: true,
        options: {
            open: "boolean — true to open, false to close",
        },
    },
    {
        action: "inspect",
        description: "Open the inspector for a node or edge.",
        has_options: true,
        options: {
            subject: "node | edge (default node when target is a node, edge when target is edge)",
        },
    },
    {
        action: "unselect_nodes",
        description:
            "Remove nodes from the current selection (unmark blue nodes) without deleting them from the graph. Use options.clear to unselect everything; options.visible with target.node_types for visible genes/traits; or target by name/filter like select_nodes.",
        has_options: true,
        options: {
            clear: "boolean — unselect all currently selected nodes",
            all: "alias for clear",
            visible: "boolean — only unselect nodes currently visible on the canvas",
            limit: "optional cap when resolving visible matches (same as select_visible_nodes)",
        },
    },
    {
        action: "select_visible_nodes",
        description:
            "Mark all nodes currently visible on the canvas as selected (blue). Respects active visibility filters. Use target.node_types to limit to genes, traits, etc.",
        has_options: true,
        options: {
            replace: "boolean — clear existing selection first",
            clear: "boolean — remove all selected nodes (ignores visibility)",
            limit: `optional number — select at most N visible nodes (1–${CANVAS_ASSISTANT_PER_STEP_MAX}, alphabetical by label)`,
        },
    },
    {
        action: "select_connected_nodes",
        description:
            "Mark the seed node and every node directly linked by an active or contextual (dashed) edge. Use when the user says select connected nodes or nodes connected to a named node. Requires exactly one seed via target.node_labels, target.node_ids, or a single selected node.",
        has_options: true,
        options: {
            replace: "boolean — clear existing selection first (default false; keeps current selection)",
        },
    },
    {
        action: "select_nodes",
        description:
            "Mark nodes as selected (blue). Use target to choose which nodes; use options for top-N and ranking. For neighborhood selection around one node, use select_connected_nodes instead.",
        has_options: true,
        options: {
            replace: "boolean — clear existing selection first",
            clear: "boolean — remove all selected nodes (ignores target)",
            limit: `number — keep only top N matches (1–${CANVAS_ASSISTANT_PER_STEP_MAX})`,
            rank_by: "relevance | connection",
            match: "pass | fail when using last_filter_pass/fail target",
            connected_to_label: "label for connection ranking when using limit + rank_by connection (not neighborhood select)",
            connected_to_node_type: "gene | gene_set | factor | trait",
        },
    },
];

export function assistantActionsForPrompt() {
    return ASSISTANT_ACTIONS.map(
        ({ action, description, has_options, options, requires_interactive_llm }) => ({
            action,
            description,
            has_options,
            options,
            requires_interactive_llm: Boolean(requires_interactive_llm),
        })
    );
}

export function getAssistantActionDefinition(actionId) {
    return ASSISTANT_ACTIONS.find((entry) => entry.action === actionId) || null;
}
