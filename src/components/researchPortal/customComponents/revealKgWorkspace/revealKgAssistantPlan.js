/** Parse and validate canvas assistant plans (v2). */

import {
    ASSISTANT_NODE_TYPES,
    getAssistantActionDefinition,
} from "./revealKgAssistantTools.js";
import {
    DEFAULT_ASSISTANT_TARGET,
    validateAssistantTarget,
} from "./revealKgAssistantTarget.js";
import {
    CANVAS_ASSISTANT_PER_STEP_MAX,
    REVEAL_WORKFLOW_TITLE,
    REVEAL_WORKFLOW_URL,
    workflowGuidanceNote,
    panelGuidanceNoteForTarget,
} from "./revealKgBulkWorkflowGuidance.js";

export function parseAssistantLlmJson(rawString) {
    const cleanString = String(rawString || "")
        .replace(/```json|```/gi, "")
        .replace(/[\r\n]+/g, " ")
        .trim();
    if (!cleanString) {
        return null;
    }
    try {
        return JSON.parse(cleanString);
    } catch (error) {
        return null;
    }
}

function isPlainObject(value) {
    return value && typeof value === "object" && !Array.isArray(value);
}

function validateNodeTypes(value, fieldName) {
    if (value === undefined || value === null) {
        return [];
    }
    if (!Array.isArray(value)) {
        throw new Error(`${fieldName} must be an array.`);
    }
    const invalid = value.filter((entry) => !ASSISTANT_NODE_TYPES.includes(entry));
    if (invalid.length) {
        throw new Error(`${fieldName} has invalid node types: ${invalid.join(", ")}`);
    }
    return value;
}

function assistantPerStepMax() {
    return CANVAS_ASSISTANT_PER_STEP_MAX;
}

function validateStepOptions(action, options = {}) {
    const next = { ...(options || {}) };
    switch (action) {
        case "expand_graph":
            if (next.target_type !== undefined) {
                next.target_type = ASSISTANT_NODE_TYPES.includes(next.target_type)
                    ? next.target_type
                    : "all";
            }
            if (next.count !== undefined) {
                next.count = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.count) || 15)
                );
            }
            if (next.connection_scope !== undefined) {
                next.connection_scope =
                    next.connection_scope === "two_hop" ? "two_hop" : "direct";
            }
            if (next.reducer !== undefined) {
                next.reducer = ["max", "min", "mean"].includes(next.reducer)
                    ? next.reducer
                    : "mean";
            }
            if (next.filter_type !== undefined) {
                next.filter_type = ["none", "intent", "novelty", "expression"].includes(
                    next.filter_type
                )
                    ? next.filter_type
                    : "none";
            }
            if (next.relevance_mode !== undefined) {
                next.relevance_mode =
                    next.relevance_mode === "semantic" ? "semantic" : "llm";
            }
            if (next.intent) {
                next.intent = String(next.intent).trim();
            }
            if (next.novelty_known !== undefined) {
                next.novelty_known = Boolean(next.novelty_known);
            }
            if (next.novelty_novel !== undefined) {
                next.novelty_novel = Boolean(next.novelty_novel);
            }
            break;
        case "filter_graph":
            if (next.mode !== undefined) {
                next.mode = ["build", "enable", "disable"].includes(next.mode)
                    ? next.mode
                    : "build";
            }
            if (!String(next.filter_ref || "").trim()) {
                next.filter_ref = "last";
            }
            if (next.filter_type !== undefined) {
                next.filter_type = ["intent", "novelty", "expression"].includes(
                    next.filter_type
                )
                    ? next.filter_type
                    : "intent";
            }
            if (next.relevance_mode !== undefined) {
                next.relevance_mode =
                    next.relevance_mode === "semantic" ? "semantic" : "llm";
            }
            if (next.intent) {
                next.intent = String(next.intent).trim();
            }
            if (next.novelty_known !== undefined) {
                next.novelty_known = Boolean(next.novelty_known);
            }
            if (next.novelty_novel !== undefined) {
                next.novelty_novel = Boolean(next.novelty_novel);
            }
            break;
        case "explain_graph":
            next.scope =
                next.scope === "entire_graph" ? "entire_graph" : "selected_nodes";
            if (next.query_text) {
                next.query_text = String(next.query_text).trim();
            }
            if (next.additional_context) {
                next.additional_context = String(next.additional_context).trim();
            }
            break;
        case "build_hypotheses":
            if (next.query_text) {
                next.query_text = String(next.query_text).trim();
            }
            if (next.additional_context) {
                next.additional_context = String(next.additional_context).trim();
            }
            if (next.novelty_known !== undefined) {
                next.novelty_known = Boolean(next.novelty_known);
            }
            if (next.novelty_novel !== undefined) {
                next.novelty_novel = Boolean(next.novelty_novel);
            }
            break;
        case "set_contextual_edges_visible":
        case "set_jumping_edges_visible":
            if (next.visible === undefined) {
                throw new Error(`${action} requires options.visible.`);
            }
            next.visible = Boolean(next.visible);
            break;
        case "toggle_data_table":
            if (next.open === undefined) {
                throw new Error("toggle_data_table requires options.open.");
            }
            next.open = Boolean(next.open);
            break;
        case "inspect":
            if (next.subject !== undefined) {
                next.subject = next.subject === "edge" ? "edge" : "node";
            }
            break;
        case "select_connected_nodes":
            if (next.replace !== undefined) {
                next.replace = Boolean(next.replace);
            }
            break;
        case "select_nodes":
            if (next.replace !== undefined) {
                next.replace = Boolean(next.replace);
            }
            if (next.clear !== undefined) {
                next.clear = Boolean(next.clear);
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            if (next.rank_by !== undefined) {
                next.rank_by =
                    next.rank_by === "connection" ? "connection" : "relevance";
            }
            if (next.match !== undefined) {
                next.match = next.match === "fail" ? "fail" : "pass";
            }
            if (next.connected_to_label) {
                next.connected_to_label = String(next.connected_to_label).trim();
            }
            if (next.connected_to_node_type) {
                validateNodeTypes([next.connected_to_node_type], "connected_to_node_type");
            }
            break;
        case "select_visible_nodes":
            if (next.replace !== undefined) {
                next.replace = Boolean(next.replace);
            }
            if (next.clear !== undefined) {
                next.clear = Boolean(next.clear);
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            break;
        case "unselect_nodes":
            if (next.clear !== undefined) {
                next.clear = Boolean(next.clear);
            }
            if (next.all !== undefined) {
                next.all = Boolean(next.all);
            }
            if (next.visible !== undefined) {
                next.visible = Boolean(next.visible);
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            break;
        case "focus_graph_view":
            next.scope =
                next.scope === "entire_graph" ? "entire_graph" : "target";
            if (next.fit !== undefined) {
                next.fit = Boolean(next.fit);
            }
            break;
        case "add_node":
            if (next.node_type !== undefined) {
                next.node_type = ASSISTANT_NODE_TYPES.includes(next.node_type)
                    ? next.node_type
                    : "gene";
            }
            if (next.search_label) {
                next.search_label = String(next.search_label).trim();
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            if (next.count !== undefined) {
                next.count = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.count) || 1)
                );
            }
            break;
        case "add_nodes_by_intent":
            if (next.research_intent) {
                next.research_intent = String(next.research_intent).trim();
            }
            if (next.node_types !== undefined) {
                next.node_types = validateNodeTypes(next.node_types, "node_types");
            }
            break;
        case "add_phenotype_gene_sets":
            if (next.search_query) {
                next.search_query = String(next.search_query).trim();
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            if (next.count !== undefined) {
                next.count = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.count) || 1)
                );
            }
            break;
        case "add_gene_set_crossing":
            if (next.search_query) {
                next.search_query = String(next.search_query).trim();
            }
            if (next.limit !== undefined) {
                next.limit = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.limit) || 1)
                );
            }
            if (next.count !== undefined) {
                next.count = Math.min(
                    assistantPerStepMax(),
                    Math.max(1, Number(next.count) || 1)
                );
            }
            break;
        case "open_library_graph":
            if (next.graph_id) {
                next.graph_id = String(next.graph_id).trim();
            }
            if (next.graph_label) {
                next.graph_label = String(next.graph_label).trim();
            }
            break;
        case "remove_node":
        case "remove_invisible_nodes":
        case "open_filter_panel":
        case "open_my_library":
        case "unselect_nodes":
        case "open_expand_panel":
        case "focus_graph_view":
        case "find_datasets":
        case "map_genes":
        case "open_provenance_explorer":
        case "export_graph":
        case "import_graph":
        case "save_graph":
        case "new_graph":
        case "download_snapshot":
            break;
        default:
            throw new Error(`Unknown action "${action}".`);
    }
    return next;
}

function normalizeStringList(value) {
    if (!Array.isArray(value)) {
        return [];
    }
    return value
        .map((entry) => String(entry || "").trim())
        .filter(Boolean);
}

export function validateAssistantClarification(raw) {
    if (!isPlainObject(raw)) {
        throw new Error("Clarification response was not a JSON object.");
    }
    const message = String(raw.message || raw.summary || "").trim();
    if (!message) {
        throw new Error('Clarification response missing "message".');
    }
    const workflowLink = normalizeWorkflowLink(raw.workflow_link);
    return {
        type: "clarify",
        message,
        issues: normalizeStringList(raw.issues),
        suggestions: normalizeStringList(raw.suggestions),
        ...(workflowLink ? { workflowLink } : {}),
    };
}

function normalizeWorkflowLink(raw) {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const href = String(raw.href || "").trim();
    const label = String(raw.label || "").trim();
    if (!href || !label) {
        return null;
    }
    return { href, label };
}

export function validateAssistantPlan(rawPlan) {
    if (!isPlainObject(rawPlan)) {
        throw new Error("Planner response was not a JSON object.");
    }
    const summary = String(rawPlan.summary || "").trim();
    if (!summary) {
        throw new Error("Planner response missing summary.");
    }
    if (!Array.isArray(rawPlan.steps)) {
        throw new Error("Planner response missing steps array.");
    }
    const steps = rawPlan.steps.map((step, index) => {
        if (!isPlainObject(step)) {
            throw new Error(`Step ${index + 1} is invalid.`);
        }
        const action = String(step.action || step.tool || "").trim();
        if (!getAssistantActionDefinition(action)) {
            throw new Error(`Step ${index + 1} uses unsupported action "${action}".`);
        }
        const label = String(step.label || "").trim();
        if (!label) {
            throw new Error(`Step ${index + 1} missing label.`);
        }
        const id = String(step.id || `step-${index + 1}`).trim();
        const target = validateAssistantTarget(step.target || DEFAULT_ASSISTANT_TARGET, {
            nodeTypes: ASSISTANT_NODE_TYPES,
        });
        const options = validateStepOptions(action, step.options || step.params || {});
        return { id, action, label, target, options };
    });
    const panelShortcuts = normalizePanelShortcuts(rawPlan.panel_shortcuts);
    return {
        type: "plan",
        summary,
        steps,
        ...(panelShortcuts ? { panelShortcuts } : {}),
    };
}

function normalizePanelShortcuts(raw) {
    if (!raw || typeof raw !== "object") {
        return null;
    }
    const workflowLink = normalizeWorkflowLink(raw.workflowLink || raw.workflow_link);
    const panelTarget = String(raw.panelTarget || raw.panel_target || "expand").trim();
    const executeLabel = String(raw.executeLabel || raw.execute_label || "Execute all").trim();
    const panelLabel = String(
        raw.panelLabel || raw.panel_label || "Open panel"
    ).trim();
    const cap = Number(raw.cap) || CANVAS_ASSISTANT_PER_STEP_MAX;
    const hasOverflow = Boolean(raw.hasOverflow ?? raw.has_overflow);
    return {
        cap,
        requested: Number.isFinite(Number(raw.requested)) ? Number(raw.requested) : null,
        hasOverflow,
        executeLabel,
        overflowNote: String(raw.overflowNote || raw.overflow_note || "").trim(),
        panelTarget: ["expand", "add", "filter"].includes(panelTarget)
            ? panelTarget
            : "expand",
        panelLabel,
        expandPanelTab:
            raw.expandPanelTab === "manual" || raw.expand_panel_tab === "manual"
                ? "manual"
                : "discover",
        workflowNote: hasOverflow
            ? String(raw.workflowNote || raw.workflow_note || workflowGuidanceNote()).trim()
            : "",
        panelNote: String(
            raw.panelNote ||
                raw.panel_note ||
                panelGuidanceNoteForTarget(panelTarget)
        ).trim(),
        workflowLink: hasOverflow
            ? workflowLink || {
                  href: REVEAL_WORKFLOW_URL,
                  label: REVEAL_WORKFLOW_TITLE,
              }
            : null,
    };
}

export function initialAssistantStepStates(steps = []) {
    return Object.fromEntries((steps || []).map((step) => [step.id, "pending"]));
}

const EMPTY_ASSISTANT_POST_EFFECTS = Object.freeze({
    graphLoading: false,
    normalizeSession: false,
    clearHiddenSelection: false,
    remindAfterMutation: false,
    forceContextualRefetch: false,
});

/**
 * Post-execution canvas/session side effects per assistant action.
 *
 * graphLoading — full "Building graph…" overlay (initial build/import only; none of the
 *   15 planner actions rebuild the graph from scratch).
 * normalizeSession — withNormalizedKeyNodes + ensureSessionFilterState after session merge.
 * clearHiddenSelection — drop selected nodes that are no longer visible.
 * remindAfterMutation — expansion/save reminders when node count grows.
 * forceContextualRefetch — immediate contextual-edge refetch (expand adds nodes).
 */
export function assistantActionPostEffects(action, options = {}) {
    switch (action) {
        case "expand_graph":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: true,
                remindAfterMutation: true,
                forceContextualRefetch: true,
            };
        case "filter_graph":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: true,
                remindAfterMutation: false,
                forceContextualRefetch: false,
            };
        case "select_nodes":
        case "select_connected_nodes":
        case "select_visible_nodes":
        case "unselect_nodes":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: false,
                remindAfterMutation: false,
                forceContextualRefetch: false,
            };
        case "remove_node":
        case "remove_invisible_nodes":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: true,
                remindAfterMutation: true,
                forceContextualRefetch: true,
            };
        case "add_node":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: false,
                remindAfterMutation: true,
                forceContextualRefetch: false,
            };
        case "add_nodes_by_intent":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: false,
                remindAfterMutation: true,
                forceContextualRefetch: true,
            };
        case "add_phenotype_gene_sets":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: false,
                remindAfterMutation: true,
                forceContextualRefetch: true,
            };
        case "add_gene_set_crossing":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: false,
                remindAfterMutation: true,
                forceContextualRefetch: true,
            };
        case "open_library_graph":
            return {
                graphLoading: false,
                normalizeSession: true,
                clearHiddenSelection: true,
                remindAfterMutation: false,
                forceContextualRefetch: true,
            };
        case "open_filter_panel":
        case "open_my_library":
        case "open_expand_panel":
        case "focus_graph_view":
        case "explain_graph":
        case "build_hypotheses":
        case "find_datasets":
        case "map_genes":
        case "open_provenance_explorer":
        case "export_graph":
        case "import_graph":
        case "save_graph":
        case "new_graph":
        case "download_snapshot":
        case "set_contextual_edges_visible":
        case "set_jumping_edges_visible":
        case "toggle_data_table":
        case "inspect":
            return { ...EMPTY_ASSISTANT_POST_EFFECTS };
        default:
            return { ...EMPTY_ASSISTANT_POST_EFFECTS };
    }
}

/** Merge post-effects for a plan (or partial plan from startIndex). */
export function computeAssistantPlanPostEffects(steps = []) {
    return (steps || []).reduce(
        (merged, step) => {
            const effects = assistantActionPostEffects(step.action, step.options || {});
            return {
                graphLoading: merged.graphLoading || effects.graphLoading,
                normalizeSession: merged.normalizeSession || effects.normalizeSession,
                clearHiddenSelection:
                    merged.clearHiddenSelection || effects.clearHiddenSelection,
                remindAfterMutation:
                    merged.remindAfterMutation || effects.remindAfterMutation,
                forceContextualRefetch:
                    merged.forceContextualRefetch || effects.forceContextualRefetch,
            };
        },
        { ...EMPTY_ASSISTANT_POST_EFFECTS }
    );
}
