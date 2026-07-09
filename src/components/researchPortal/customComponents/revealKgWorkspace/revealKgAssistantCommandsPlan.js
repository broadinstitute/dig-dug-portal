/** Local command synthesis for Commands-mode Assist (no LLM planner). */

import { buildAssistantSessionContext } from "./revealKgAssistantContext.js";
import { DEFAULT_ASSISTANT_TARGET } from "./revealKgAssistantTarget.js";
import { validateAssistantClarification, validateAssistantPlan } from "./revealKgAssistantPlan.js";
import {
    graphLabelsMentionedInQuery,
    prepareAssistantPlannerJson,
} from "./revealKgAssistantPlanRepair.js";
import { parseExpandCountFromUserQuery } from "./revealKgBulkWorkflowGuidance.js";
import { mentionsExpandTraitToGeneSets } from "./revealKgTraitGeneSetExpand.js";
import {
    assistantPreconditionClarifyJson,
    validateAssistantStepPreconditions,
} from "./revealKgAssistantActionPreconditions.js";

function makePlan(summary, steps) {
    return {
        response_type: "plan",
        summary,
        steps: steps.map((step, index) => ({
            id: step.id || `step-${index + 1}`,
            action: step.action,
            label: step.label,
            target: step.target || { ...DEFAULT_ASSISTANT_TARGET },
            options: step.options || {},
        })),
    };
}

function makeStep(action, label, { target, options } = {}) {
    return {
        action,
        label,
        target: target || { ...DEFAULT_ASSISTANT_TARGET },
        options: options || {},
    };
}

function queryText(query) {
    return String(query || "").trim();
}

function matchesAny(query, patterns) {
    return patterns.some((pattern) => pattern.test(query));
}

function tryDirectCommand(query) {
    const text = queryText(query);
    if (!text) {
        return null;
    }

    if (
        matchesAny(text, [
            /\b(?:new|start|create)\s+(?:a\s+)?(?:graph|canvas|workspace)\b/i,
            /\breset\s+(?:the\s+)?(?:graph|canvas|workspace)\b/i,
            /\bclear\s+(?:the\s+)?(?:graph|canvas|workspace)\b/i,
        ])
    ) {
        return makePlan("Start a new graph.", [
            makeStep("new_graph", "Start a new graph"),
        ]);
    }

    if (/\bopen\s+(?:my\s+)?library\b/i.test(text)) {
        return makePlan("Open My library.", [makeStep("open_my_library", "Open My library")]);
    }

    if (/\bopen\s+(?:the\s+)?(?:visibility\s+)?filter(?:\s+panel)?\b/i.test(text)) {
        return makePlan("Open the filter panel.", [
            makeStep("open_filter_panel", "Open filter panel"),
        ]);
    }
    if (/\bclose\s+(?:the\s+)?(?:visibility\s+)?filter(?:\s+panel)?\b/i.test(text)) {
        return makePlan("Close the filter panel.", [
            makeStep("close_filter_panel", "Close filter panel"),
        ]);
    }

    if (/\bopen\s+(?:the\s+)?expand(?:\s+kg|\s+panel)?\b/i.test(text)) {
        return makePlan("Open the Expand KG panel.", [
            makeStep("open_expand_panel", "Open Expand KG", {
                target: { scope: "selected_nodes" },
            }),
        ]);
    }
    if (/\bclose\s+(?:the\s+)?expand(?:\s+kg|\s+panel)?\b/i.test(text)) {
        return makePlan("Close the Expand KG panel.", [
            makeStep("close_expand_panel", "Close Expand KG"),
        ]);
    }

    if (/\bimport\b[\s\S]*\bgraph\b/i.test(text)) {
        return makePlan("Open graph import.", [makeStep("import_graph", "Import graph")]);
    }

    if (/\bexport\b[\s\S]*\bgraph\b/i.test(text)) {
        return makePlan("Export the graph.", [makeStep("export_graph", "Export graph")]);
    }

    if (/\bsave\b[\s\S]*\b(?:graph|library)\b/i.test(text)) {
        return makePlan("Save graph to My library.", [makeStep("save_graph", "Save graph")]);
    }

    if (/\bdownload\b[\s\S]*\bsnapshot\b/i.test(text)) {
        return makePlan("Download graph snapshot.", [
            makeStep("download_snapshot", "Download snapshot"),
        ]);
    }

    if (
        matchesAny(text, [
            /\bremove\b[\s\S]*\b(?:hidden|invisible)\b[\s\S]*\bnode/i,
            /\bdelete\b[\s\S]*\b(?:hidden|invisible)\b[\s\S]*\bnode/i,
        ])
    ) {
        return makePlan("Remove hidden nodes from the graph.", [
            makeStep("remove_invisible_nodes", "Remove hidden nodes"),
        ]);
    }

    if (/\b(?:open|show)\b[\s\S]*\bdata\s+table\b/i.test(text)) {
        return makePlan("Open the data table.", [
            makeStep("toggle_data_table", "Open data table", { options: { open: true } }),
        ]);
    }
    if (/\b(?:close|hide)\b[\s\S]*\bdata\s+table\b/i.test(text)) {
        return makePlan("Close the data table.", [
            makeStep("toggle_data_table", "Close data table", { options: { open: false } }),
        ]);
    }

    if (/\bshow\b[\s\S]*\bcontextual\b[\s\S]*\bedges?\b/i.test(text)) {
        return makePlan("Show contextual edges.", [
            makeStep("set_contextual_edges_visible", "Show contextual edges", {
                options: { visible: true },
            }),
        ]);
    }
    if (/\bhide\b[\s\S]*\bcontextual\b[\s\S]*\bedges?\b/i.test(text)) {
        return makePlan("Hide contextual edges.", [
            makeStep("set_contextual_edges_visible", "Hide contextual edges", {
                options: { visible: false },
            }),
        ]);
    }

    if (/\bshow\b[\s\S]*\b(?:jumping|hopping)\b[\s\S]*\bedges?\b/i.test(text)) {
        return makePlan("Show jumping edges.", [
            makeStep("set_jumping_edges_visible", "Show jumping edges", {
                options: { visible: true },
            }),
        ]);
    }
    if (/\bhide\b[\s\S]*\b(?:jumping|hopping)\b[\s\S]*\bedges?\b/i.test(text)) {
        return makePlan("Hide jumping edges.", [
            makeStep("set_jumping_edges_visible", "Hide jumping edges", {
                options: { visible: false },
            }),
        ]);
    }

    if (
        matchesAny(text, [
            /\b(?:fit|reset)\s+(?:the\s+)?(?:whole|full|entire)?\s*(?:graph|view|canvas)\b/i,
            /\bzoom\s+out\s+to\s+(?:the\s+)?(?:whole|full|entire)\s+graph\b/i,
        ])
    ) {
        return makePlan("Fit the whole graph in view.", [
            makeStep("focus_graph_view", "Fit graph view", {
                options: { scope: "entire_graph", fit: true },
            }),
        ]);
    }

    return null;
}

function tryRuleCommand(query, sessionContext) {
    const text = queryText(query);
    if (!text) {
        return null;
    }

    if (
        matchesAny(text, [
            /\b(?:unselect|deselect)\s+all(?:\s+nodes?)?\b/i,
            /\b(?:unselect|deselect|clear)\s+(?:selected\s+)?nodes?\b/i,
        ])
    ) {
        return makePlan("Clear node selection.", [
            makeStep("unselect_nodes", "Unselect all nodes", {
                options: { clear: true },
            }),
        ]);
    }

    if (/\bselect\b[\s\S]*\bvisible\b[\s\S]*\bgenes?\b/i.test(text)) {
        return makePlan("Select visible genes.", [
            makeStep("select_visible_nodes", "Select visible genes", {
                target: { scope: "selected_nodes", node_types: ["gene"] },
            }),
        ]);
    }

    if (/\bselect\b[\s\S]*\ball\s+visible\b[\s\S]*\bnodes?\b/i.test(text)) {
        return makePlan("Select all visible nodes.", [
            makeStep("select_visible_nodes", "Select visible nodes", {
                target: { scope: "selected_nodes" },
            }),
        ]);
    }

    if (/\bmap\s+genes?\b/i.test(text)) {
        return makePlan("Map genes across selected gene sets.", [
            makeStep("map_genes", "Map genes", {
                target: { scope: "selected_nodes", node_types: ["gene_set"] },
            }),
        ]);
    }

    if (/\bfind\b[\s\S]*\b(?:related\s+)?datasets?\b/i.test(text)) {
        return makePlan("Find related datasets from selected genes.", [
            makeStep("find_datasets", "Find related datasets", {
                target: { scope: "selected_nodes", node_types: ["gene"] },
            }),
        ]);
    }

    if (/\bprovenance\s+explorer\b/i.test(text)) {
        return makePlan("Open provenance explorer for selected gene sets.", [
            makeStep("open_provenance_explorer", "Open provenance explorer", {
                target: { scope: "selected_nodes", node_types: ["gene_set"] },
            }),
        ]);
    }

    const labels = graphLabelsMentionedInQuery(text, sessionContext);
    if (labels.length === 1) {
        if (/\b(?:remove|delete)\b/i.test(text)) {
            return makePlan(`Remove ${labels[0]} from the graph.`, [
                makeStep("remove_node", `Remove ${labels[0]}`, {
                    target: { scope: "node", node_labels: [labels[0]] },
                }),
            ]);
        }
        if (/\binspect\b/i.test(text)) {
            return makePlan(`Inspect ${labels[0]}.`, [
                makeStep("inspect", `Inspect ${labels[0]}`, {
                    target: { scope: "node", node_labels: [labels[0]] },
                    options: { subject: "node" },
                }),
            ]);
        }
        if (/\b(?:zoom|focus)\b/i.test(text)) {
            return makePlan(`Focus view on ${labels[0]}.`, [
                makeStep("focus_graph_view", `Focus on ${labels[0]}`, {
                    target: { scope: "node", node_labels: [labels[0]] },
                    options: { fit: true },
                }),
            ]);
        }
        if (/\bselect\b/i.test(text) && !/\b(?:unselect|deselect)\b/i.test(text)) {
            return makePlan(`Select ${labels[0]}.`, [
                makeStep("select_nodes", `Select ${labels[0]}`, {
                    target: { scope: "node", node_labels: [labels[0]] },
                }),
            ]);
        }
    }

    const libraryMatch = text.match(
        /\bopen\s+(?:my\s+|saved\s+|the\s+)?(.+?)\s+graph\b/i
    );
    if (libraryMatch?.[1] && !/\b(?:new|expand|filter)\b/i.test(libraryMatch[1])) {
        const graphLabel = String(libraryMatch[1] || "").trim();
        if (graphLabel) {
            return makePlan(`Open saved graph "${graphLabel}".`, [
                makeStep("open_library_graph", `Open ${graphLabel}`, {
                    options: { graph_label: graphLabel },
                }),
            ]);
        }
    }

    if (mentionsExpandTraitToGeneSets(text)) {
        const count = parseExpandCountFromUserQuery(text);
        return makePlan("Expand gene sets from trait.", [
            makeStep("expand_graph", "Expand gene sets from trait", {
                target: { scope: "selected_nodes", node_types: ["trait"] },
                options: {
                    target_type: "gene_set",
                    ...(count ? { count } : {}),
                },
            }),
        ]);
    }

    return null;
}

export function synthesizeCommandsPlan(userQuery, sessionContext) {
    return tryDirectCommand(userQuery) || tryRuleCommand(userQuery, sessionContext);
}

export function commandsPlanClarifyJson(userQuery = "") {
    const query = String(userQuery || "").trim();
    return {
        response_type: "clarify",
        message:
            "Couldn't interpret that as a single direct canvas command. Try a shorter phrase, or describe the full goal so the assistant can plan steps.",
        issues: [
            query
                ? `No command pattern matched: "${query}"`
                : "Empty command request.",
        ],
        suggestions: [
            "Direct: \"Start a new graph\", \"Open My library\", \"Show jumping edges\"",
            "Planned: \"Open filter panel and find gene sets for type 2 diabetes\"",
            "Open the Actions tab to browse example requests.",
        ],
    };
}

/**
 * Resolve a single direct command locally (no LLM). Caller should only invoke when
 * isDirectCommandQuery is true.
 * @returns {{ result: object, raw: object|null }}
 */
export function resolveDirectCommandQuery(
    userQuery,
    session,
    {
        interactiveLlmAvailable = false,
        viewOptions = {},
        savedLibraryGraphs = [],
    } = {}
) {
    const sessionContext = buildAssistantSessionContext(session, {
        interactiveLlmAvailable,
        viewOptions,
        savedLibraryGraphs,
    });
    const synthesized = synthesizeCommandsPlan(userQuery, sessionContext);
    if (!synthesized) {
        return {
            result: validateAssistantClarification(commandsPlanClarifyJson(userQuery)),
            raw: null,
        };
    }

    const prepared = prepareAssistantPlannerJson(synthesized, userQuery, sessionContext);
    if (prepared.type === "clarify") {
        return {
            result: validateAssistantClarification(prepared.json),
            raw: synthesized,
        };
    }

    const result = validateAssistantPlan(prepared.json);
    const preconditionMessage = validateAssistantStepPreconditions(session, result.steps);
    if (preconditionMessage) {
        return {
            result: validateAssistantClarification(
                assistantPreconditionClarifyJson(preconditionMessage, result.steps[0])
            ),
            raw: synthesized,
        };
    }
    result.planSource = "command";
    result.autoExecute = true;
    return {
        result,
        raw: synthesized,
    };
}

/** @deprecated Use resolveDirectCommandQuery */
export function resolveCommandsAssistantQuery(userQuery, session, options = {}) {
    return resolveDirectCommandQuery(userQuery, session, options);
}
