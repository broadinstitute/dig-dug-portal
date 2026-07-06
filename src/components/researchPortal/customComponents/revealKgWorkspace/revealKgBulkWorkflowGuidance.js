/** Suggest REVEAL Workflow when canvas add/expand limits are exceeded. */

export const REVEAL_WORKFLOW_URL = "/research.html?pageid=multi_queries_reveal";
export const REVEAL_WORKFLOW_TITLE = "REVEAL Workflow";

/**
 * Unified per-step cap for canvas assistant add/expand/select actions (Playground expand parity).
 * Gene sets, genes, traits, and expand neighbors all use the same threshold.
 */
export const CANVAS_ASSISTANT_PER_STEP_MAX = 20;

/** @deprecated Use CANVAS_ASSISTANT_PER_STEP_MAX — kept for expand panel UI. */
export const CANVAS_EXPAND_MAX_NEIGHBORS = CANVAS_ASSISTANT_PER_STEP_MAX;

/** Catalog API may rank more candidates; assistant execution still caps at per-step max. */
export const CANVAS_CATALOG_ADD_MAX = CANVAS_ASSISTANT_PER_STEP_MAX;

/** Intent-based add uses the same per-step total as other assistant add actions. */
export const CANVAS_INTENT_ADD_MAX_NODES = CANVAS_ASSISTANT_PER_STEP_MAX;

export function revealWorkflowLink() {
    return {
        href: REVEAL_WORKFLOW_URL,
        label: REVEAL_WORKFLOW_TITLE,
    };
}

function finiteCount(value) {
    const n = Number(value);
    return Number.isFinite(n) && n > 0 ? Math.floor(n) : null;
}

function effectiveKindFromMatch(kind, matchText) {
    const text = String(matchText || "");
    if (/\bgene[\s-]?sets?\b/i.test(text)) {
        return kind === "add" ? "add" : kind;
    }
    if (/\bgenes?\b/i.test(text) && kind !== "select") {
        return "genes";
    }
    return kind;
}

function assistantPerStepCap() {
    return CANVAS_ASSISTANT_PER_STEP_MAX;
}

/**
 * @typedef {{ kind: 'expand'|'add'|'select'|'intent_add'|'genes'|'bulk', requested: number|null, cap: number }} BulkCanvasOverflow
 */

/**
 * Detect when plain-language requests exceed the unified canvas per-step limit.
 * @returns {BulkCanvasOverflow|null}
 */
export function detectBulkCanvasOverflow(userQuery) {
    const query = String(userQuery || "").trim();
    if (!query) {
        return null;
    }

    const cap = assistantPerStepCap();

    if (
        /\b(?:many|lots of|hundreds?|dozens?|bulk)\s+(?:of\s+)?(?:gene[\s-]?sets?|genes?|traits?|mechanisms?|factors?|nodes?)\b/i.test(
            query
        ) ||
        /\b(?:gene[\s-]?sets?|genes?|traits?|mechanisms?)\s+in\s+bulk\b/i.test(query)
    ) {
        return {
            kind: "bulk",
            requested: null,
            cap,
        };
    }

    const patterns = [
        {
            kind: "expand",
            regex: /\b(?:expand|fetch|get)\s+(?:\w+\s+){0,3}(\d{1,3})\s+(?:gene[\s-]?sets?|gene\s+)?(?:nodes?|neighbors?|neighbours?|genes?)\b/i,
        },
        {
            kind: "expand",
            regex: /\b(?:expand|add)\s+(?:with\s+)?(\d{1,3})\s+(?:gene[\s-]?sets?|gene\s+)?(?:nodes?|neighbors?|neighbours?)\b/i,
        },
        {
            kind: "add",
            regex: /\badd\s+(\d{1,3})\s+(?:best\s+matching\s+)?(?:the\s+)?(?:top\s+)?(?:gene[\s-]?sets?|genes|traits?|mechanisms?|factors?|nodes?)\b/i,
        },
        {
            kind: "select",
            regex: /\btop\s+(\d{1,3})\s+(?:gene[\s-]?sets?|genes|traits?|mechanisms?|factors?|nodes?)\b/i,
        },
        {
            kind: "genes",
            regex: /\b(\d{1,3})\s+genes\b/i,
        },
        {
            kind: "add",
            regex: /\b(\d{1,3})\s+gene[\s-]?sets?\b/i,
        },
    ];

    for (const { kind, regex } of patterns) {
        const match = query.match(regex);
        if (!match) {
            continue;
        }
        const requested = finiteCount(match[1]);
        if (!requested) {
            continue;
        }
        const effectiveKind =
            kind === "expand" ? "expand" : effectiveKindFromMatch(kind, match[0]);
        if (requested > cap) {
            return { kind: effectiveKind, requested, cap };
        }
    }

    if (
        /\badd\s+nodes?\s+by\s+intent\b/i.test(query) &&
        /\b(\d{1,3})\s+(?:nodes?|gene[\s-]?sets?|traits?|mechanisms?)\b/i.test(query)
    ) {
        const match = query.match(
            /\b(\d{1,3})\s+(?:nodes?|gene[\s-]?sets?|traits?|mechanisms?)\b/i
        );
        const requested = finiteCount(match?.[1]);
        if (requested && requested > cap) {
            return {
                kind: "intent_add",
                requested,
                cap,
            };
        }
    }

    return null;
}

/**
 * Catch planner-inflated limits when the user query did not trip detectBulkCanvasOverflow.
 * @returns {BulkCanvasOverflow|null}
 */
export function detectBulkCanvasOverflowFromPlan(steps = []) {
    const cap = assistantPerStepCap();
    for (const step of steps || []) {
        const action = step?.action;
        const options = step?.options || {};
        if (action === "expand_graph") {
            const requested = finiteCount(options.count);
            if (requested && requested > cap) {
                return { kind: "expand", requested, cap };
            }
        }
        if (action === "add_node") {
            const requested = finiteCount(options.limit ?? options.count);
            if (requested && requested > cap) {
                return { kind: "add", requested, cap };
            }
        }
        if (action === "add_demo_gene_sets") {
            const requested = finiteCount(options.limit ?? options.count);
            if (requested && requested > cap) {
                return { kind: "add", requested, cap };
            }
        }
        if (action === "add_phenotype_gene_sets") {
            const requested = finiteCount(options.limit ?? options.count);
            if (requested && requested > cap) {
                return { kind: "add", requested, cap };
            }
        }
        if (action === "add_gene_set_crossing") {
            const requested = finiteCount(options.limit ?? options.count);
            if (requested && requested > cap) {
                return { kind: "add", requested, cap };
            }
        }
        if (action === "select_nodes" || action === "select_visible_nodes") {
            const requested = finiteCount(options.limit);
            if (requested && requested > cap) {
                return { kind: "select", requested, cap };
            }
        }
    }
    return null;
}

const EXPAND_COUNT_QUERY_PATTERNS = [
    /\b(?:expand|fetch|get)\s+(?:\w+\s+){0,3}(\d{1,3})\s+(?:gene[\s-]?sets?|gene\s+)?(?:nodes?|neighbors?|neighbours?|genes?)\b/i,
    /\b(?:expand|add)\s+(?:with\s+)?(\d{1,3})\s+(?:gene[\s-]?sets?|gene\s+)?(?:nodes?|neighbors?|neighbours?)\b/i,
    /\b(?:add|fetch|get|expand(?:\s+with)?)\s+(\d{1,3})\s+(?:neighbor|neighbours|nodes?)\b/i,
];

/**
 * Parse expand/add neighbor count from plain language (uncapped).
 * Plan repair and overflow detection share the same patterns.
 * @returns {number|null}
 */
export function parseExpandCountFromUserQuery(userQuery) {
    const query = String(userQuery || "").trim();
    if (!query) {
        return null;
    }
    for (const regex of EXPAND_COUNT_QUERY_PATTERNS) {
        const match = query.match(regex);
        if (!match) {
            continue;
        }
        const requested = finiteCount(match[1]);
        if (requested) {
            return requested;
        }
    }
    return null;
}

export function bulkWorkflowShortMessage(overflow) {
    if (!overflow) {
        return "";
    }
    const requestedText = overflow.requested
        ? `${overflow.requested} nodes`
        : "many nodes at once";
    return `You asked for ${requestedText}, but this canvas adds up to ${overflow.cap} per step (genes, gene sets, traits, or expand neighbors). Use ${REVEAL_WORKFLOW_TITLE} to discover matches in bulk from your research intention.`;
}

export function bulkWorkflowClarifyMessage(overflow) {
    if (!overflow) {
        return "";
    }
    const requestedLine = overflow.requested
        ? `You asked for about ${overflow.requested} nodes in one step.`
        : "You asked to add or expand many nodes at once.";
    return `${requestedLine} The KG Canvas adds at most ${overflow.cap} nodes per step — whether genes, gene sets, traits, mechanisms, or expand neighbors — so neighborhoods stay reviewable. For larger bulk discovery from a research intention, use ${REVEAL_WORKFLOW_TITLE}.`;
}

export function buildBulkWorkflowClarifyJson(userQuery, overflow = detectBulkCanvasOverflow(userQuery)) {
    if (!overflow) {
        return null;
    }
    return {
        response_type: "clarify",
        message: bulkWorkflowClarifyMessage(overflow),
        issues: [
            overflow.requested
                ? `Requested count (${overflow.requested}) exceeds the unified canvas per-step limit (${overflow.cap}).`
                : `Bulk discovery exceeds what the canvas is designed for per step (limit ${overflow.cap}).`,
        ],
        suggestions: [
            `Open ${REVEAL_WORKFLOW_TITLE} to find relevant genes, gene sets, and traits in bulk for your research question.`,
            overflow.requested
                ? `Or rephrase with ${overflow.cap} or fewer nodes per step on this canvas (for example, repeat expand or add in smaller batches).`
                : `Or add or expand in smaller steps on this canvas.`,
        ],
        workflow_link: revealWorkflowLink(),
    };
}

export function bulkWorkflowStepNote(overflow) {
    if (!overflow) {
        return "";
    }
    return bulkWorkflowShortMessage(overflow);
}

export function geneDiscoveryWorkflowGuidance() {
    return `For more than ${CANVAS_ASSISTANT_PER_STEP_MAX} genes, gene sets, or traits at once, use ${REVEAL_WORKFLOW_TITLE}. On this canvas, add or expand in steps of up to ${CANVAS_ASSISTANT_PER_STEP_MAX} nodes.`;
}

export const PANEL_SHORTCUT_ACTIONS = new Set([
    "expand_graph",
    "add_node",
    "add_nodes_by_intent",
    "add_gene_set_crossing",
    "add_phenotype_gene_sets",
    "add_demo_gene_sets",
    "filter_graph",
]);

export function planQualifiesForPanelShortcuts(steps = []) {
    return (steps || []).some((step) => PANEL_SHORTCUT_ACTIONS.has(step?.action));
}

export function resolvePanelTargetFromSteps(steps = []) {
    const actions = (steps || []).map((step) => step?.action);
    if (actions.includes("filter_graph")) {
        return "filter";
    }
    if (actions.includes("add_nodes_by_intent") || actions.includes("add_gene_set_crossing") || actions.includes("add_phenotype_gene_sets") || actions.includes("add_node") || actions.includes("add_demo_gene_sets")) {
        return "add";
    }
    return "expand";
}

export function panelLabelForTarget(target) {
    switch (target) {
        case "filter":
            return "Open visibility filter";
        case "add":
            return "Open Add nodes";
        default:
            return "Open Expand KG";
    }
}

export function workflowGuidanceNote() {
    return "Search many genes, gene sets, or traits across multiple queries, compare results, then add what you need to a canvas.";
}

export function panelGuidanceNoteForTarget(target) {
    switch (target) {
        case "filter":
            return "Show or hide nodes on the current graph by type, evidence, and other visibility rules.";
        case "add":
            return "Search by label, use intent-based discovery, and choose how many nodes to add per type.";
        default:
            return "Pick seed nodes, neighbor types, and counts with full control over expansion.";
    }
}

export function expandPanelTabForTarget(target) {
    return target === "add" ? "manual" : "discover";
}

function capCountOption(raw, cap) {
    const value = finiteCount(raw);
    if (value) {
        return Math.min(cap, value);
    }
    return cap;
}

/** Apply the per-step cap to planner steps when the user asked above the limit. */
export function capPlanStepsForBulkOverflow(steps = [], cap = CANVAS_ASSISTANT_PER_STEP_MAX) {
    return (steps || []).map((step) => {
        const options = { ...(step.options || {}) };
        if (step.action === "expand_graph") {
            options.count = capCountOption(options.count, cap);
        }
        if (step.action === "add_node") {
            options.limit = capCountOption(options.limit ?? options.count, cap);
        }
        if (step.action === "add_demo_gene_sets") {
            options.limit = capCountOption(options.limit ?? options.count, cap);
        }
        if (step.action === "add_phenotype_gene_sets") {
            options.limit = capCountOption(options.limit ?? options.count, cap);
        }
        if (step.action === "add_gene_set_crossing") {
            options.limit = capCountOption(options.limit ?? options.count, cap);
        }
        if (step.action === "select_nodes" || step.action === "select_visible_nodes") {
            if (options.limit !== undefined) {
                options.limit = capCountOption(options.limit, cap);
            }
        }
        return { ...step, options };
    });
}

export function bulkWorkflowOverflowSummaryNote(overflow) {
    if (!overflow?.requested || overflow.requested <= overflow.cap) {
        return "";
    }
    return `(Requested about ${overflow.requested}; this plan runs up to ${overflow.cap} per step.)`;
}

/**
 * Three-way assistant choices for add / expand / filter plans.
 * @returns {object|null}
 */
export function buildPlanPanelShortcuts({ steps = [], overflow = null } = {}) {
    if (!planQualifiesForPanelShortcuts(steps)) {
        return null;
    }
    const cap = overflow?.cap ?? CANVAS_ASSISTANT_PER_STEP_MAX;
    const panelTarget = resolvePanelTargetFromSteps(steps);
    const workflowLink = revealWorkflowLink();
    const hasOverflow =
        overflow &&
        (overflow.requested === null || Number(overflow.requested) > cap);

    return {
        cap,
        requested: overflow?.requested ?? null,
        hasOverflow: Boolean(hasOverflow),
        executeLabel: hasOverflow
            ? `Execute with cap (up to ${cap})`
            : "Execute all",
        overflowNote: hasOverflow
            ? overflow.requested
                ? `You asked for about ${overflow.requested} nodes. This plan adds up to ${cap} per step on the canvas.`
                : "You asked for many nodes at once. This plan uses the canvas per-step cap."
            : "",
        panelTarget,
        panelLabel: panelLabelForTarget(panelTarget),
        expandPanelTab: expandPanelTabForTarget(panelTarget),
        workflowNote: hasOverflow ? workflowGuidanceNote() : "",
        panelNote: panelGuidanceNoteForTarget(panelTarget),
        workflowLink: hasOverflow ? workflowLink : null,
    };
}

export function resolveBulkOverflowForPlan(userQuery, steps = []) {
    return (
        detectBulkCanvasOverflow(userQuery) || detectBulkCanvasOverflowFromPlan(steps)
    );
}

export function preparePlanWithBulkHandling(json, userQuery, repairedSteps) {
    const overflow = resolveBulkOverflowForPlan(userQuery, repairedSteps);
    const finalSteps = overflow
        ? capPlanStepsForBulkOverflow(repairedSteps, overflow.cap)
        : repairedSteps;
    const panelShortcuts = buildPlanPanelShortcuts({
        steps: finalSteps,
        overflow,
    });
    const summaryNote = bulkWorkflowOverflowSummaryNote(overflow);
    const summary = summaryNote
        ? `${String(json.summary || "").trim()} ${summaryNote}`.trim()
        : String(json.summary || "").trim();

    return {
        ...json,
        summary,
        steps: finalSteps,
        ...(panelShortcuts ? { panel_shortcuts: panelShortcuts } : {}),
    };
}
