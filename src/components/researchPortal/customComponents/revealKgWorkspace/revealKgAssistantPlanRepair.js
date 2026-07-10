/** Repair common planner JSON mistakes using the user query and session context. */

import { parseExplicitIntentNodeTypes } from "./revealKgIntentAddNodes.js";
import { shouldUsePhenotypeGeneSetAdd } from "./revealKgPhenotypeGeneSetAdd.js";
import {
    mentionsExpandTraitToGeneSets,
    resolveTraitGeneSetExpandIntent,
    traitGeneSetExpandClarifyJson,
    wantsTraitGeneSetExpandWithoutIntent,
} from "./revealKgTraitGeneSetExpand.js";
import { shouldUseGeneSetCrossingAdd } from "./revealKgGeneSetCrossingAdd.js";
import {
    mentionsSelectConnectedInQuery,
    parseConnectedSeedLabelFromQuery,
} from "./revealKgSelectConnectedNodes.js";
import {
    isGeneSetProgramToken,
    isResolvablePhenotypeToken,
} from "./revealKgPhenotypeQueryTranslate.js";
import { mentionsMapGenesInQuery } from "./revealKgMapGenesUtils.js";
import { mentionsOpenProvenanceExplorerInQuery } from "./revealKgGeneSetProvenance.js";
import {
    CANVAS_ASSISTANT_PER_STEP_MAX,
    parseExpandCountFromUserQuery,
    preparePlanWithBulkHandling,
} from "./revealKgBulkWorkflowGuidance.js";
import {
    assistantCatalogHelpClarifyJson,
    isAssistantCatalogHelpQuery,
    plannerJsonLooksLikeCatalogHelpMisroute,
} from "./revealKgAssistantCatalogHelp.js";

const QUERY_STOP_WORDS = new Set([
    "SELECT",
    "EXPAND",
    "GRAPH",
    "FROM",
    "THE",
    "NODE",
    "NODES",
    "GENE",
    "GENES",
    "SHOW",
    "HIDE",
    "OPEN",
    "CLOSE",
    "FILTER",
    "EXPLAIN",
    "FIND",
    "BUILD",
    "TOP",
    "AND",
    "ALL",
    "VISIBLE",
    "SELECTED",
    "MARK",
    "INSPECT",
]);

function normalizeLabel(value) {
    return String(value || "").trim().toLowerCase();
}

function escapeRegExp(value) {
    return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function graphNodesFromContext(sessionContext) {
    return sessionContext?.sample_nodes || [];
}

function graphLabelEntries(sessionContext) {
    return graphNodesFromContext(sessionContext)
        .map((node) => {
            const label = String(node.label || "").trim();
            const nodeId = String(node.node_id || "");
            return {
                label,
                normalized: normalizeLabel(label),
                nodeIdSuffix: normalizeLabel(nodeId.split(":").pop()),
            };
        })
        .filter((entry) => entry.label.length >= 2);
}

function labelMentionPatterns(label) {
    const escaped = escapeRegExp(label);
    if (/\s|-/.test(label)) {
        return [new RegExp(escaped, "i")];
    }
    return [new RegExp(`\\b${escaped}\\b`, "i")];
}

function queryRangesForLabel(query, label) {
    const ranges = [];
    if (/\s|-/.test(label)) {
        const lowerQuery = query.toLowerCase();
        const lowerLabel = label.toLowerCase();
        let start = 0;
        while (start < query.length) {
            const index = lowerQuery.indexOf(lowerLabel, start);
            if (index < 0) {
                break;
            }
            ranges.push([index, index + label.length]);
            start = index + Math.max(1, label.length);
        }
        return ranges;
    }
    const pattern = new RegExp(`\\b${escapeRegExp(label)}\\b`, "gi");
    for (const match of query.matchAll(pattern)) {
        ranges.push([match.index, match.index + match[0].length]);
    }
    return ranges;
}

function rangesOverlap(left, right) {
    return left[0] < right[1] && right[0] < left[1];
}

function tokenIsPartOfGraphLabel(token, sessionContext) {
    const patterns = labelMentionPatterns(token);
    return graphLabelEntries(sessionContext).some((entry) =>
        patterns.some((pattern) => pattern.test(entry.label))
    );
}

function queryRangesCoveredByGraphLabels(userQuery, sessionContext) {
    const query = String(userQuery || "");
    const labels = graphLabelEntries(sessionContext)
        .map((entry) => entry.label)
        .sort((left, right) => right.length - left.length);
    const ranges = [];
    for (const label of labels) {
        ranges.push(...queryRangesForLabel(query, label));
    }
    return ranges;
}

function preferLongestLabels(labels) {
    const unique = [...new Set(labels)];
    return unique.filter(
        (label) =>
            !unique.some(
                (other) =>
                    other.length > label.length &&
                    normalizeLabel(other).includes(normalizeLabel(label))
            )
    );
}

function graphEdgesFromContext(sessionContext) {
    return sessionContext?.sample_edges || [];
}

function parseTopCountFromQuery(userQuery) {
    const match = String(userQuery || "").match(/\btop\s+(\d{1,3})\b/i);
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value)
        ? Math.min(CANVAS_ASSISTANT_PER_STEP_MAX, Math.max(1, value))
        : null;
}

function parseAddCountFromQuery(userQuery) {
    const query = String(userQuery || "");
    const cap = CANVAS_ASSISTANT_PER_STEP_MAX;
    const bestMatch = query.match(/\badd\s+(\d{1,3})\s+(?:best\s+matching|matching)\b/i);
    if (bestMatch) {
        return Math.min(cap, Math.max(1, Number(bestMatch[1])));
    }
    const addNodes = query.match(
        /\badd\s+(\d{1,3})\s+(?:the\s+)?(?:top\s+)?(?:nodes?|gene[\s-]?sets?|traits?|mechanisms?|factors?)\b/i
    );
    if (addNodes) {
        return Math.min(cap, Math.max(1, Number(addNodes[1])));
    }
    return parseTopCountFromQuery(query);
}

function parseCatalogSearchPhrase(userQuery) {
    const query = String(userQuery || "").trim();
    const quoted =
        query.match(/(?:phrase|matching|match|for)\s+["“]([^"”]+)["”]/i) ||
        query.match(/["“]([^"”]+)["”]/);
    if (quoted?.[1]) {
        return quoted[1].trim();
    }
    const phrase = query.match(
        /\bmatch(?:es|ing)?\s+(?:the\s+)?phrase\s+([a-z0-9][a-z0-9\s-]{1,120})/i
    );
    if (phrase?.[1]) {
        return phrase[1].trim();
    }
    const thatMatch = query.match(
        /\bthat\s+match(?:es)?\s+(?:the\s+)?(?:phrase\s+)?([a-z0-9][a-z0-9\s-]{1,120}?)(?:\s+and\b|\s*$)/i
    );
    return thatMatch?.[1] ? thatMatch[1].trim() : "";
}

function wantsEntireGraphScope(userQuery) {
    return /\b(all|entire|whole)\s+(visible\s+)?(graph|canvas)\b/i.test(String(userQuery || ""));
}

function wantsSelectedScope(userQuery) {
    return /\b(selected|marked|blue)\s+(nodes?|genes?|traits?)\b/i.test(String(userQuery || ""));
}

function queryMentionsJumpingEdges(userQuery) {
    return /\bjumping\s+edges?\b/i.test(String(userQuery || ""));
}

function queryMentionsContextualEdges(userQuery) {
    return /\bcontextual\s+edges?\b/i.test(String(userQuery || ""));
}

const NOVELTY_FILTER_ACTIONS = new Set(["expand_graph", "filter_graph", "build_hypotheses"]);

/** Map "novel" / "known" language in the user query to novelty filter options. */
export function parseNoveltyOptionsFromQuery(userQuery) {
    const query = String(userQuery || "");
    if (/\b(?:known\s+and\s+novel|novel\s+and\s+known)\b/i.test(query)) {
        return null;
    }
    if (
        /\b(?:filter\s+out|filter\s+away|exclude|hide|remove|drop|without)\b[\s\S]{0,48}\bknown\b/i.test(
            query
        )
    ) {
        return { filter_type: "novelty", novelty_novel: true, novelty_known: false };
    }
    if (
        /\b(?:filter\s+out|filter\s+away|exclude|hide|remove|drop|without)\b[\s\S]{0,48}\bnovel\b/i.test(
            query
        )
    ) {
        return { filter_type: "novelty", novelty_known: true, novelty_novel: false };
    }
    if (/\bonly\s+novel\b/i.test(query)) {
        return { filter_type: "novelty", novelty_novel: true, novelty_known: false };
    }
    if (/\bnovel(?:ty)?\s+only\b/i.test(query)) {
        return { filter_type: "novelty", novelty_novel: true, novelty_known: false };
    }
    if (/\bknown\s+only\b/i.test(query)) {
        return { filter_type: "novelty", novelty_known: true, novelty_novel: false };
    }
    const stripped = query.replace(/\bwell[\s-]known\b/gi, "");
    const hasNovel = /\bnovel(?:ty)?\b/i.test(stripped);
    const hasKnown = /\bknown\b/i.test(stripped);
    if (hasNovel && !hasKnown) {
        return { filter_type: "novelty", novelty_novel: true, novelty_known: false };
    }
    if (hasKnown && !hasNovel) {
        return { filter_type: "novelty", novelty_known: true, novelty_novel: false };
    }
    if (hasNovel && hasKnown) {
        return { filter_type: "novelty", novelty_novel: true, novelty_known: false };
    }
    return null;
}

function applyNoveltyOptionsFromQuery(action, options, userQuery) {
    if (!NOVELTY_FILTER_ACTIONS.has(action)) {
        return;
    }
    const novelty = parseNoveltyOptionsFromQuery(userQuery);
    if (!novelty) {
        return;
    }
    if (options.novelty_known === undefined) {
        options.novelty_known = novelty.novelty_known;
    }
    if (options.novelty_novel === undefined) {
        options.novelty_novel = novelty.novelty_novel;
    }
    if (
        action === "filter_graph" ||
        !options.filter_type ||
        options.filter_type === "none"
    ) {
        options.filter_type = novelty.filter_type;
    }
}

function queryWantsHide(userQuery) {
    return /\b(hide|turn off|disable)\b/i.test(String(userQuery || ""));
}

function queryWantsShow(userQuery) {
    return /\b(show|turn on|enable|display)\b/i.test(String(userQuery || ""));
}

function quotedIntentFromQuery(userQuery) {
    const match = String(userQuery || "").match(/"([^"]{2,120})"|'([^']{2,120})'/);
    return String(match?.[1] || match?.[2] || "").trim();
}

function repairEdgeTarget(step, userQuery, sessionContext) {
    if (step?.target?.scope === "edge" && step.target.edge) {
        return step;
    }
    const query = String(userQuery || "");
    if (!/\bedge\b/i.test(query) && !/\bbetween\b/i.test(query)) {
        return step;
    }
    const labels = graphLabelsMentionedInQuery(userQuery, sessionContext);
    if (labels.length < 2) {
        return step;
    }
    const edgeMatch = graphEdgesFromContext(sessionContext).find((edge) => {
        const source = normalizeLabel(edge.source_label);
        const target = normalizeLabel(edge.target_label);
        const mentioned = labels.map((label) => normalizeLabel(label));
        return mentioned.includes(source) && mentioned.includes(target);
    });
    return {
        ...step,
        target: {
            scope: "edge",
            edge: {
                source_label: edgeMatch?.source_label || labels[0],
                target_label: edgeMatch?.target_label || labels[1],
            },
        },
        options: { ...(step.options || {}), subject: "edge" },
    };
}

function isClearSelectionStep(step) {
    return step?.action === "select_nodes" && Boolean(step?.options?.clear);
}

function isNamedRemoveStep(step) {
    if (step?.action !== "remove_node") {
        return false;
    }
    const target = step?.target || {};
    if (target.scope === "selected_nodes") {
        return false;
    }
    if (target.scope === "node" || target.scope === "nodes") {
        return true;
    }
    return Boolean(target.node_labels?.length || target.node_ids?.length);
}

function stripRedundantClearBeforeRemove(steps = []) {
    if (!Array.isArray(steps) || steps.length < 2) {
        return steps;
    }
    const filtered = [];
    for (let index = 0; index < steps.length; index += 1) {
        const step = steps[index];
        const next = steps[index + 1];
        if (isClearSelectionStep(step) && isNamedRemoveStep(next)) {
            continue;
        }
        filtered.push(step);
    }
    return filtered;
}

function repairRemoveNodeTarget(step, labelsOnGraph, userQuery) {
    if (step?.action !== "remove_node") {
        return step;
    }
    const target = { ...(step.target || {}) };
    if (
        target.scope === "selected_nodes" ||
        target.node_labels?.length ||
        target.node_ids?.length
    ) {
        return step;
    }
    if (!/\bremove\b/i.test(String(userQuery || "")) || !labelsOnGraph.length) {
        return step;
    }
    if (labelsOnGraph.length === 1) {
        return {
            ...step,
            target: { ...target, scope: "node", node_labels: [labelsOnGraph[0]] },
        };
    }
    return {
        ...step,
        target: { ...target, scope: "nodes", node_labels: labelsOnGraph },
    };
}

function parseAddNodeSearchLabel(userQuery) {
    const query = String(userQuery || "").trim();
    const typed = query.match(
        /\badd(?:\s+the)?\s+([A-Za-z0-9-]+)\s+(?:gene|trait|mechanism|factor|gene[\s-]?set)\b/i
    );
    if (typed?.[1]) {
        return typed[1].toUpperCase();
    }
    const simple = query.match(/\badd(?:\s+the)?\s+([A-Za-z0-9-]+)\b/i);
    if (simple?.[1] && !QUERY_STOP_WORDS.has(simple[1].toUpperCase())) {
        return simple[1].toUpperCase();
    }
    return "";
}

function inferAddNodeTypeFromQuery(userQuery) {
    const query = String(userQuery || "");
    if (/\bgene[\s-]?sets?\b/i.test(query)) {
        return "gene_set";
    }
    if (/\btraits?\b/i.test(query)) {
        return "trait";
    }
    if (/\b(mechanisms?|factors?)\b/i.test(query)) {
        return "factor";
    }
    if (/\bgene\b/i.test(query)) {
        return "gene";
    }
    return "gene";
}

function looksLikeIntentAddQuery(userQuery) {
    const query = String(userQuery || "").trim();
    if (!query) {
        return false;
    }
    if (parseAddNodeSearchLabel(query)) {
        return false;
    }
    if (/\badd\b\s+(?:the\s+)?[A-Za-z0-9-]+\b/i.test(query) && query.length < 48) {
        return false;
    }
    return (
        /\bfind\b/i.test(query) ||
        /\badd\b[\s\S]*\b(gene[\s-]?sets?|mechanisms?|factors?|traits?)\b/i.test(query) ||
        /\b(search|discover|identify)\b[\s\S]*\b(mechanism|pathway|trait|gene[\s-]?set)/i.test(
            query
        ) ||
        (query.length > 36 &&
            /\b(that could|related to|involving|alter|affect|handling|coagulation)\b/i.test(
                query
            ))
    );
}

function repairIntentAddStep(step, userQuery) {
    if (step?.action !== "add_nodes_by_intent") {
        return step;
    }
    const options = { ...(step.options || {}) };
    const explicitTypes = parseExplicitIntentNodeTypes(userQuery);
    if (explicitTypes?.length) {
        options.node_types = explicitTypes;
        options.research_intent = String(userQuery || "").trim();
    } else if (!options.research_intent) {
        options.research_intent = String(userQuery || "").trim();
    }
    return { ...step, options };
}

function repairProvenanceExplorerSteps(steps, userQuery) {
    if (!mentionsOpenProvenanceExplorerInQuery(userQuery)) {
        return steps;
    }
    if ((steps || []).some((step) => step?.action === "open_provenance_explorer")) {
        return steps;
    }
    const convertible =
        !steps?.length ||
        (steps.length === 1 &&
            ["explain_graph", "find_datasets", "build_hypotheses", "filter_graph", "map_genes"].includes(
                steps[0]?.action
            ));
    if (!convertible) {
        return steps;
    }
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "open_provenance_explorer",
            label: "Open provenance explorer for selected gene sets",
            target: {
                scope: "selected_nodes",
                node_types: ["gene_set"],
            },
            options: {},
        },
    ];
}

function repairMapGenesSteps(steps, userQuery) {
    if (mentionsOpenProvenanceExplorerInQuery(userQuery)) {
        return steps;
    }
    if (!mentionsMapGenesInQuery(userQuery)) {
        return steps;
    }
    if ((steps || []).some((step) => step?.action === "map_genes")) {
        return steps;
    }
    const convertible =
        !steps?.length ||
        (steps.length === 1 &&
            ["explain_graph", "find_datasets", "build_hypotheses", "filter_graph"].includes(
                steps[0]?.action
            ));
    if (!convertible) {
        return steps;
    }
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "map_genes",
            label: "Map genes across selected gene sets",
            target: {
                scope: "selected_nodes",
                node_types: ["gene_set"],
            },
            options: {},
        },
    ];
}

function repairPhenotypeGeneSetStep(step, userQuery) {
    if (step?.action !== "add_phenotype_gene_sets") {
        return step;
    }
    const options = { ...(step.options || {}) };
    if (!options.search_query) {
        options.search_query = String(userQuery || "").trim();
    }
    if (options.limit === undefined && options.count === undefined) {
        const count = parseAddCountFromQuery(userQuery);
        if (count) {
            options.limit = count;
        }
    }
    return { ...step, options };
}

function repairSelectConnectedStep(step, userQuery) {
    if (step?.action !== "select_connected_nodes") {
        return step;
    }
    const options = { ...(step.options || {}) };
    if (options.replace === undefined) {
        options.replace = false;
    }
    const target = { ...(step.target || {}) };
    if (
        (!target.node_labels?.length && !target.node_ids?.length) ||
        target.scope === "all" ||
        !target.scope
    ) {
        const seedLabel =
            parseConnectedSeedLabelFromQuery(userQuery) ||
            String(step.options?.connected_to_label || "").trim();
        if (seedLabel) {
            target.scope = "node";
            target.node_labels = [seedLabel];
        }
    }
    return { ...step, target, options };
}

function repairSelectConnectedSteps(steps, userQuery) {
    const query = String(userQuery || "").trim();
    if (!mentionsSelectConnectedInQuery(query)) {
        return steps;
    }
    if (/\btop\s+\d+\b/i.test(query)) {
        return steps;
    }
    const seedLabel = parseConnectedSeedLabelFromQuery(query);
    if ((steps || []).some((step) => step?.action === "select_connected_nodes")) {
        return (steps || []).map((step) => repairSelectConnectedStep(step, userQuery));
    }
    if (!steps?.length && seedLabel) {
        return [
            {
                id: "step-1",
                action: "select_connected_nodes",
                label: `Select nodes connected to ${seedLabel}`,
                target: { scope: "node", node_labels: [seedLabel] },
                options: { replace: false },
            },
        ];
    }
    const rewritten = (steps || []).map((step) => {
        if (step?.action !== "select_nodes") {
            return step;
        }
        const label =
            seedLabel ||
            String(step.options?.connected_to_label || "").trim() ||
            (step.target?.node_labels?.length === 1 ? step.target.node_labels[0] : "");
        if (!label) {
            return step;
        }
        return {
            ...step,
            action: "select_connected_nodes",
            target: { scope: "node", node_labels: [label] },
            options: {
                replace: step.options?.replace === true,
            },
        };
    });
    if (rewritten.some((step, index) => step !== steps[index])) {
        return rewritten;
    }
    return steps;
}

function repairGeneSetCrossingStep(step, userQuery) {
    if (step?.action !== "add_gene_set_crossing") {
        return step;
    }
    const options = { ...(step.options || {}) };
    if (!options.search_query) {
        options.search_query = String(userQuery || "").trim();
    }
    if (options.limit === undefined && options.count === undefined) {
        const count = parseAddCountFromQuery(userQuery);
        if (count) {
            options.limit = count;
        }
    }
    return { ...step, options };
}

function repairGeneSetCrossingSteps(steps, userQuery) {
    if (!shouldUseGeneSetCrossingAdd(userQuery)) {
        return steps;
    }
    if ((steps || []).some((step) => step?.action === "add_gene_set_crossing")) {
        return (steps || []).map((step) => repairGeneSetCrossingStep(step, userQuery));
    }
    const query = String(userQuery || "").trim();
    const convertible =
        !steps?.length ||
        (steps.length === 1 &&
            ["add_node", "add_nodes_by_intent", "expand_graph", "filter_graph"].includes(
                steps[0]?.action
            ));
    if (!convertible) {
        return steps;
    }
    const count = parseAddCountFromQuery(query);
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "add_gene_set_crossing",
            label: "Add crossing gene sets",
            target: {},
            options: {
                search_query: query,
                ...(count ? { limit: count } : {}),
            },
        },
    ];
}

function repairTraitGeneSetExpandStep(step, userQuery, sessionContext) {
    if (step?.action !== "expand_graph" || !mentionsExpandTraitToGeneSets(userQuery)) {
        return step;
    }
    const query = String(userQuery || "").trim();
    const options = { ...(step.options || {}) };
    options.target_type = "gene_set";
    const intent = resolveTraitGeneSetExpandIntent(options, step.label, query);
    if (intent) {
        options.filter_type = options.filter_type || "intent";
        options.intent = intent;
    } else if (options.filter_type === "intent") {
        delete options.filter_type;
        delete options.intent;
    }
    const count = parseExpandCountFromUserQuery(query);
    if (count && options.count === undefined) {
        options.count = count;
    }
    let target = { ...(step.target || {}) };
    const labelsOnGraph = graphLabelsMentionedInQuery(query, sessionContext);
    if (labelsOnGraph.length) {
        if (labelsOnGraph.length === 1) {
            target.scope = "node";
            target.node_labels = [labelsOnGraph[0]];
        } else if (!target.node_labels?.length) {
            target.scope = "nodes";
            target.node_labels = labelsOnGraph;
        }
    } else if (wantsSelectedScope(query) && (!target.scope || target.scope === "all")) {
        target = {
            scope: "selected_nodes",
            node_types: ["trait"],
        };
    }
    return {
        ...step,
        target,
        options,
        label: step.label || "Expand gene sets from trait",
    };
}

function repairTraitGeneSetExpandSteps(steps, userQuery, sessionContext) {
    if (!mentionsExpandTraitToGeneSets(userQuery)) {
        return steps;
    }
    const query = String(userQuery || "").trim();
    if ((steps || []).some((step) => step?.action === "expand_graph")) {
        return (steps || []).map((step) =>
            repairTraitGeneSetExpandStep(step, userQuery, sessionContext)
        );
    }
    const count = parseExpandCountFromUserQuery(query);
    const intent = resolveTraitGeneSetExpandIntent({}, "", query);
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "expand_graph",
            label: "Expand gene sets from trait",
            target: {
                scope: wantsSelectedScope(query) ? "selected_nodes" : "selected_nodes",
                node_types: ["trait"],
            },
            options: {
                target_type: "gene_set",
                ...(intent ? { filter_type: "intent", intent } : {}),
                ...(count ? { count } : {}),
            },
        },
    ];
}

const DESTRUCTIVE_TYPE_LABELS = {
    gene: "gene",
    gene_set: "gene set",
    factor: "mechanism",
    trait: "trait",
};

/**
 * Backstop for ambiguous destructive removals. A single remove_node step that targets a
 * whole node type (no specific node named) with more than one such node on the graph is
 * almost never what the user meant by a singular "remove the trait" — and deleting them
 * all would destroy the very nodes a follow-up alternative might target. Convert it to a
 * clarify listing each candidate as a one-click option (plus an explicit "remove all").
 * Returns clarify JSON, or null when the removal is unambiguous / intentional.
 */
export function ambiguousDestructiveRemovalClarify(steps, userQuery, sessionContext) {
    if (!Array.isArray(steps) || steps.length !== 1) {
        return null;
    }
    const step = steps[0];
    if (step?.action !== "remove_node") {
        return null;
    }
    const target = step.target || {};
    if (target.node_labels?.length || target.node_ids?.length) {
        return null; // specific node(s) named — unambiguous
    }
    if (/\b(all|every|each|both|hidden|invisible|entire)\b/i.test(String(userQuery || ""))) {
        return null; // user explicitly asked for a bulk removal
    }
    const types = (target.node_types || []).filter(Boolean);
    if (!types.length) {
        return null;
    }
    const candidates = (sessionContext?.sample_nodes || []).filter((node) =>
        types.includes(node.type)
    );
    if (candidates.length <= 1) {
        return null; // nothing to disambiguate
    }
    const typeLabel = types.map((type) => DESTRUCTIVE_TYPE_LABELS[type] || type).join("/");
    const options = candidates.slice(0, 3).map((node) => ({
        label: `Remove ${node.label}`,
        query: `remove ${node.label}`,
    }));
    options.push({
        label: `Remove all ${typeLabel} nodes`,
        query: `remove all ${typeLabel} nodes`,
    });
    return {
        response_type: "clarify",
        message: `Which ${typeLabel} should I remove? There are several on the graph.`,
        issues: [],
        suggestions: [],
        options,
    };
}

/**
 * Veto an LLM-chosen add_phenotype_gene_sets step when the deterministic heuristic
 * disagrees (e.g. the user named a single explicit node type like "gene set nodes").
 * Converts it to add_nodes_by_intent, which uses normal catalog search instead of the
 * phenotype embedding endpoint. Prevents the phenotype misroute at plan time.
 */
export function vetoPhenotypeGeneSetMisroute(steps, userQuery) {
    if (!Array.isArray(steps) || !steps.length) {
        return steps;
    }
    if (mentionsExpandTraitToGeneSets(userQuery)) {
        return steps;
    }
    if (shouldUsePhenotypeGeneSetAdd(userQuery)) {
        return steps;
    }
    const query = String(userQuery || "").trim();
    const explicitTypes = parseExplicitIntentNodeTypes(query);
    return steps.map((step) => {
        if (step?.action !== "add_phenotype_gene_sets") {
            return step;
        }
        return {
            ...step,
            action: "add_nodes_by_intent",
            label: "Add nodes from research intention",
            target: {},
            options: {
                research_intent:
                    String(step.options?.search_query || query).trim() || query,
                ...(explicitTypes ? { node_types: explicitTypes } : {}),
            },
        };
    });
}

function repairPhenotypeGeneSetSteps(steps, userQuery) {
    if (mentionsExpandTraitToGeneSets(userQuery)) {
        return steps;
    }
    if (
        shouldUseGeneSetCrossingAdd(userQuery) ||
        !shouldUsePhenotypeGeneSetAdd(userQuery)
    ) {
        return steps;
    }
    if ((steps || []).some((step) => step?.action === "add_phenotype_gene_sets")) {
        return (steps || []).map((step) => repairPhenotypeGeneSetStep(step, userQuery));
    }
    const query = String(userQuery || "").trim();
    const convertible =
        !steps?.length ||
        (steps.length === 1 &&
            ["add_node", "add_nodes_by_intent", "expand_graph", "filter_graph"].includes(
                steps[0]?.action
            ));
    if (!convertible) {
        return steps;
    }
    const count = parseAddCountFromQuery(query);
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "add_phenotype_gene_sets",
            label: "Add trait and gene set associations",
            target: {},
            options: {
                search_query: query,
                ...(count ? { limit: count } : {}),
            },
        },
    ];
}

function repairIntentAddSteps(steps, userQuery) {
    if (
        mentionsMapGenesInQuery(userQuery) ||
        mentionsOpenProvenanceExplorerInQuery(userQuery) ||
        shouldUseGeneSetCrossingAdd(userQuery) ||
        shouldUsePhenotypeGeneSetAdd(userQuery)
    ) {
        return steps;
    }
    if (!looksLikeIntentAddQuery(userQuery)) {
        return steps;
    }
    if ((steps || []).some((step) => step?.action === "add_nodes_by_intent")) {
        return steps;
    }
    const query = String(userQuery || "").trim();
    const convertible =
        !steps?.length ||
        (steps.length === 1 &&
            ["add_node", "expand_graph", "filter_graph"].includes(steps[0]?.action));
    if (!convertible) {
        return steps;
    }
    return [
        {
            id: steps?.[0]?.id || "step-1",
            action: "add_nodes_by_intent",
            label: "Add nodes from research intention",
            target: {},
            options: {
                research_intent: query,
                ...(parseExplicitIntentNodeTypes(query)
                    ? { node_types: parseExplicitIntentNodeTypes(query) }
                    : {}),
            },
        },
    ];
}

function repairAddNodeStep(step, userQuery) {
    if (step?.action !== "add_node") {
        return step;
    }
    const options = { ...(step.options || {}) };
    if (!options.search_label) {
        const phrase = parseCatalogSearchPhrase(userQuery);
        if (phrase) {
            options.search_label = phrase;
        } else {
            const label = parseAddNodeSearchLabel(userQuery);
            if (label) {
                options.search_label = label;
            }
        }
    }
    if (!options.node_type) {
        options.node_type = inferAddNodeTypeFromQuery(userQuery);
    }
    if (options.limit === undefined && options.count === undefined) {
        const count = parseAddCountFromQuery(userQuery);
        if (count) {
            options.limit = count;
        }
    }
    return { ...step, options };
}

function queryWantsUnselectAll(userQuery) {
    return /\b(unselect|deselect|clear)\s+(?:all\s+)?(?:selected\s+)?nodes?\b/i.test(
        String(userQuery || "")
    );
}

function queryWantsVisibleUnselect(userQuery) {
    return /\b(unselect|deselect)\b[\s\S]*\bvisible\b/i.test(String(userQuery || ""));
}

function repairUnselectStep(step, userQuery) {
    if (step?.action !== "unselect_nodes") {
        return step;
    }
    const options = { ...(step.options || {}) };
    const target = { ...(step.target || {}) };
    const query = String(userQuery || "");
    if (queryWantsUnselectAll(query)) {
        options.clear = true;
    }
    if (queryWantsVisibleUnselect(query)) {
        options.visible = true;
        if (!target.node_types?.length) {
            if (/\bgene[\s-]?sets?\b/i.test(query)) {
                target.node_types = ["gene_set"];
            } else if (/\btraits?\b/i.test(query)) {
                target.node_types = ["trait"];
            } else if (/\b(mechanisms?|factors?)\b/i.test(query)) {
                target.node_types = ["factor"];
            } else if (/\bgenes?\b/i.test(query)) {
                target.node_types = ["gene"];
            }
        }
    }
    return { ...step, target, options };
}

function repairStepOptions(step, userQuery, sessionContext) {
    const action = step?.action;
    const options = { ...(step.options || {}) };
    const query = String(userQuery || "");

    if (action === "select_nodes" && options.limit === undefined) {
        const topN = parseTopCountFromQuery(query);
        if (topN) {
            options.limit = topN;
            if (options.replace === undefined && /\breplace\b/i.test(query)) {
                options.replace = true;
            }
        }
    }

    if (action === "expand_graph") {
        if (mentionsExpandTraitToGeneSets(query)) {
            options.target_type = options.target_type || "gene_set";
            const intent = resolveTraitGeneSetExpandIntent(options, step.label, query);
            if (intent) {
                options.filter_type = options.filter_type || "intent";
                options.intent = intent;
            } else if (options.filter_type === "intent") {
                delete options.filter_type;
                delete options.intent;
            }
        }
        if (options.count === undefined) {
            const neighborCount = parseExpandCountFromUserQuery(query);
            if (neighborCount) {
                options.count = neighborCount;
            }
        }
        if (wantsSelectedScope(query) && (!step.target || step.target.scope === "all")) {
            step = {
                ...step,
                target: {
                    scope: "selected_nodes",
                    node_types: step.target?.node_types || [],
                },
            };
        }
    }

    if (action === "explain_graph" && options.scope === undefined && wantsEntireGraphScope(query)) {
        options.scope = "entire_graph";
    }

    if (action === "focus_graph_view") {
        if (options.scope === undefined) {
            options.scope = wantsEntireGraphScope(query) ? "entire_graph" : "target";
        }
        if (options.fit === undefined) {
            options.fit = true;
        }
    }

    if (action === "filter_graph" && options.mode !== "enable" && options.mode !== "disable") {
        const intent = quotedIntentFromQuery(query);
        if (intent && !options.intent) {
            options.intent = intent;
            options.filter_type = options.filter_type || "intent";
        }
    }

    if (
        action === "find_datasets" &&
        (!step.target?.scope || step.target.scope === "all")
    ) {
        step = {
            ...step,
            target: {
                scope: "selected_nodes",
                node_types: ["gene"],
            },
        };
    }

    if (
        action === "map_genes" &&
        (!step.target?.scope || step.target.scope === "all")
    ) {
        step = {
            ...step,
            target: {
                scope: "selected_nodes",
                node_types: ["gene_set"],
            },
        };
    }

    if (
        action === "open_provenance_explorer" &&
        (!step.target?.scope || step.target.scope === "all")
    ) {
        step = {
            ...step,
            target: {
                scope: "selected_nodes",
                node_types: ["gene_set"],
            },
        };
    }

    if (action === "set_jumping_edges_visible" && options.visible === undefined) {
        if (queryMentionsJumpingEdges(query)) {
            options.visible = queryWantsHide(query) ? false : queryWantsShow(query) || true;
        }
    }

    if (action === "set_contextual_edges_visible" && options.visible === undefined) {
        if (queryMentionsContextualEdges(query)) {
            options.visible = queryWantsHide(query) ? false : queryWantsShow(query) || true;
        }
    }

    if (action === "toggle_data_table" && options.open === undefined) {
        if (/\b(open|show)\b.*\b(data\s+table|table)\b/i.test(query)) {
            options.open = true;
        } else if (/\b(close|hide)\b.*\b(data\s+table|table)\b/i.test(query)) {
            options.open = false;
        }
    }

    applyNoveltyOptionsFromQuery(action, options, query);

    if (action === "open_expand_panel" && wantsSelectedScope(query)) {
        step = {
            ...step,
            target: {
                scope: "selected_nodes",
                ...(step.target || {}),
            },
        };
    }

    return repairEdgeTarget({ ...step, options }, userQuery, sessionContext);
}

/** Labels from sample_nodes that appear in the user query (longest phrases first). */
export function graphLabelsMentionedInQuery(userQuery, sessionContext) {
    const query = String(userQuery || "");
    const labels = graphLabelEntries(sessionContext)
        .map((entry) => entry.label)
        .sort((left, right) => right.length - left.length);
    const mentioned = [];
    for (const label of labels) {
        if (labelMentionPatterns(label).some((pattern) => pattern.test(query))) {
            mentioned.push(label);
        }
    }
    return preferLongestLabels(mentioned);
}

/** Catalog-add requests name traits/phenotypes and sources — not existing graph nodes. */
export function shouldSkipGraphLabelMissingCheck(userQuery) {
    const query = String(userQuery || "").trim();
    if (!query) {
        return false;
    }
    if (shouldUseGeneSetCrossingAdd(query)) {
        return true;
    }
    if (shouldUsePhenotypeGeneSetAdd(query)) {
        return true;
    }
    if (mentionsExpandTraitToGeneSets(query)) {
        return true;
    }
    if (
        /\badd\b\s+\d+\s+[\s\S]*\b(gene[\s-]?sets?\s+and\s+traits?|traits?\s+and\s+gene[\s-]?sets?)\b/i.test(
            query
        )
    ) {
        return true;
    }
    return false;
}

/** Gene-like tokens in the query that are not on the graph. */
export function graphLabelsMissingFromQuery(userQuery, sessionContext) {
    const query = String(userQuery || "");
    if (shouldSkipGraphLabelMissingCheck(query)) {
        return [];
    }
    const tokens = query.match(/\b[A-Z][A-Z0-9-]{1,}\b/g) || [];
    const exactOnGraph = new Set(
        graphLabelEntries(sessionContext).flatMap((entry) => {
            const keys = [entry.normalized];
            if (entry.nodeIdSuffix) {
                keys.push(entry.nodeIdSuffix);
            }
            return keys;
        })
    );
    const coveredRanges = queryRangesCoveredByGraphLabels(userQuery, sessionContext);
    const missing = [];
    for (const token of tokens) {
        if (QUERY_STOP_WORDS.has(token)) {
            continue;
        }
        if (exactOnGraph.has(normalizeLabel(token))) {
            continue;
        }
        if (tokenIsPartOfGraphLabel(token, sessionContext)) {
            continue;
        }
        if (isResolvablePhenotypeToken(token) || isGeneSetProgramToken(token)) {
            continue;
        }
        const tokenRange = queryRangesForLabel(query, token)[0];
        if (tokenRange && coveredRanges.some((range) => rangesOverlap(tokenRange, range))) {
            continue;
        }
        missing.push(token);
    }
    return [...new Set(missing)];
}

function stepNeedsNodeLabels(step) {
    const scope = step?.target?.scope;
    if (scope !== "node" && scope !== "nodes") {
        return false;
    }
    const target = step.target || {};
    return !target.node_ids?.length && !target.node_labels?.length;
}

function repairStepTarget(step, labelsOnGraph) {
    if (!stepNeedsNodeLabels(step) || !labelsOnGraph.length) {
        return step;
    }
    const target = { ...(step.target || {}) };
    if (labelsOnGraph.length === 1) {
        target.scope = "node";
        target.node_labels = [labelsOnGraph[0]];
    } else {
        target.scope = "nodes";
        target.node_labels = labelsOnGraph;
    }
    return { ...step, target };
}

function isClarifyJson(json) {
    const type = String(json?.response_type || json?.type || "").trim().toLowerCase();
    return type === "clarify" || type === "improve_request";
}

/**
 * Before strict validation: fix missing node_labels from query, or return clarify JSON.
 * @returns {{ type: 'plan', json } | { type: 'clarify', json }}
 */
/**
 * Run the full deterministic repair pipeline over a list of planner steps.
 * Applies the phenotype-misroute veto first, then plan-level and per-step repairs.
 * Shared by the primary plan and each fallback plan.
 *
 * @param {object} [opts]
 * @param {boolean} [opts.preserveActions] When true, skip the plan-level transforms that
 *   swap one action for another (intent-add, phenotype, gene-set crossing). Used for
 *   fallback plans so a deliberately-different alternative isn't converted back into the
 *   same action as the primary (which would make it fail identically). The always-safe
 *   phenotype→intent veto and per-step target/option repairs still run.
 */
export function repairPlanSteps(
    steps,
    userQuery,
    sessionContext,
    labelsOnGraph,
    { preserveActions = false } = {}
) {
    const graphLabels =
        labelsOnGraph || graphLabelsMentionedInQuery(userQuery, sessionContext);
    const vetoed = vetoPhenotypeGeneSetMisroute(steps, userQuery);
    const actionAdjusted = preserveActions
        ? vetoed
        : repairPhenotypeGeneSetSteps(
              repairIntentAddSteps(vetoed, userQuery),
              userQuery
          );
    return stripRedundantClearBeforeRemove(
        repairProvenanceExplorerSteps(
            repairMapGenesSteps(
                (preserveActions
                    ? actionAdjusted
                    : repairGeneSetCrossingSteps(
                          repairTraitGeneSetExpandSteps(
                              repairSelectConnectedSteps(actionAdjusted, userQuery),
                              userQuery,
                              sessionContext
                          ),
                          userQuery
                      )
                ),
                userQuery
            ),
            userQuery
        ).map((step) =>
            repairGeneSetCrossingStep(
                repairTraitGeneSetExpandStep(
                    repairPhenotypeGeneSetStep(
                        repairIntentAddStep(
                            repairSelectConnectedStep(
                                repairUnselectStep(
                                    repairAddNodeStep(
                                        repairRemoveNodeTarget(
                                            repairStepOptions(
                                                repairStepTarget(step, graphLabels),
                                                userQuery,
                                                sessionContext
                                            ),
                                            graphLabels,
                                            userQuery
                                        ),
                                        userQuery
                                    ),
                                    userQuery
                                ),
                                userQuery
                            ),
                            userQuery
                        ),
                        userQuery
                    ),
                    userQuery,
                    sessionContext
                ),
                userQuery
            )
        )
    );
}

export function prepareAssistantPlannerJson(json, userQuery, sessionContext) {
    if (!json || typeof json !== "object") {
        return {
            type: "clarify",
            json: {
                response_type: "clarify",
                message: "Could not read the planner response.",
                issues: [],
                suggestions: ["Try rephrasing your request."],
            },
        };
    }

    if (isClarifyJson(json)) {
        return { type: "clarify", json };
    }

    if (
        isAssistantCatalogHelpQuery(userQuery) ||
        plannerJsonLooksLikeCatalogHelpMisroute(json, userQuery)
    ) {
        return { type: "clarify", json: assistantCatalogHelpClarifyJson() };
    }

    const missingOnGraph = graphLabelsMissingFromQuery(userQuery, sessionContext);
    if (missingOnGraph.length) {
        const names = missingOnGraph.join(", ");
        return {
            type: "clarify",
            json: {
                response_type: "clarify",
                message: `${names} ${missingOnGraph.length === 1 ? "is" : "are"} not on this graph. Add ${missingOnGraph.length === 1 ? "it" : "them"} first or pick a node from the canvas.`,
                issues: [`Named node(s) not in sample_nodes: ${names}`],
                suggestions: [
                    "Use Search / expand to add the node to the graph first.",
                    "Or name a node that is already visible on the canvas.",
                ],
            },
        };
    }

    const labelsOnGraph = graphLabelsMentionedInQuery(userQuery, sessionContext);
    const steps = Array.isArray(json.steps) ? json.steps : [];
    const vagueNodeRef = /\b(the node|that node|this node|from the node)\b/i.test(
        String(userQuery || "")
    );

    if (vagueNodeRef && !labelsOnGraph.length) {
        return {
            type: "clarify",
            json: {
                response_type: "clarify",
                message:
                    'Which node should be used? Name it explicitly (e.g. "Select TP53 and expand from TP53").',
                issues: ['Request says "the node" but no node label was given.'],
                suggestions: [
                    "Use the exact label as shown on the graph.",
                    "Or mark nodes on the canvas and say \"expand from selected nodes\".",
                ],
            },
        };
    }

    const repairedSteps = repairPlanSteps(steps, userQuery, sessionContext, labelsOnGraph);
    if (wantsTraitGeneSetExpandWithoutIntent(userQuery, repairedSteps)) {
        return {
            type: "clarify",
            json: traitGeneSetExpandClarifyJson(userQuery),
        };
    }
    const stillBroken = repairedSteps.some((step) => stepNeedsNodeLabels(step));
    if (stillBroken) {
        return {
            type: "clarify",
            json: {
                response_type: "clarify",
                message:
                    "Which node should this action use? Name it in your request using the label on the graph.",
                issues: ["Plan used target scope \"node\" without node_ids or node_labels."],
                suggestions: [
                    'Example: "Select ZEB1 and expand from ZEB1" (only if ZEB1 is on the graph).',
                    "Or: \"Expand from selected nodes\" after marking nodes on the canvas.",
                ],
            },
        };
    }

    const destructiveClarify = ambiguousDestructiveRemovalClarify(
        repairedSteps,
        userQuery,
        sessionContext
    );
    if (destructiveClarify) {
        return { type: "clarify", json: destructiveClarify };
    }

    const repairedFallbackPlans = repairFallbackPlans(
        json.fallback_plans,
        userQuery,
        sessionContext,
        labelsOnGraph
    );
    const repairedAlternatives =
        json.confidence === "medium"
            ? repairFallbackPlans(
                  json.alternatives,
                  userQuery,
                  sessionContext,
                  labelsOnGraph
              )
            : [];
    const { fallback_plans, alternatives, ...restJson } = json;
    const jsonWithExtras = {
        ...restJson,
        ...(repairedFallbackPlans.length
            ? { fallback_plans: repairedFallbackPlans }
            : {}),
        ...(repairedAlternatives.length
            ? { alternatives: repairedAlternatives }
            : {}),
    };

    return {
        type: "plan",
        json: preparePlanWithBulkHandling(jsonWithExtras, userQuery, repairedSteps),
    };
}

/**
 * Repair each fallback plan's steps with the same pipeline as the primary plan.
 * Fallbacks are best-effort: any plan that ends up empty or still needs node labels
 * is dropped rather than clarified, so a bad fallback never blocks a good primary.
 */
function repairFallbackPlans(fallbackPlans, userQuery, sessionContext, labelsOnGraph) {
    if (!Array.isArray(fallbackPlans)) {
        return [];
    }
    const repaired = [];
    for (const plan of fallbackPlans) {
        const rawSteps = Array.isArray(plan) ? plan : plan?.steps;
        if (!Array.isArray(rawSteps) || !rawSteps.length) {
            continue;
        }
        const steps = repairPlanSteps(rawSteps, userQuery, sessionContext, labelsOnGraph, {
            preserveActions: true,
        });
        if (!steps.length || steps.some((step) => stepNeedsNodeLabels(step))) {
            continue;
        }
        repaired.push({
            summary: String(plan?.summary || "").trim(),
            steps,
        });
    }
    return repaired;
}

export function validationErrorToClarifyJson(error, userQuery) {
    const message = String(error?.message || error || "Could not validate the plan.");
    if (message.includes('target scope "node"') || message.includes('target scope "nodes"')) {
        return {
            response_type: "clarify",
            message:
                "Which node should this action use? Name it explicitly using the label on the graph.",
            issues: [message],
            suggestions: [
                `Edit your request (currently: "${String(userQuery || "").trim()}") and include the node name.`,
                "Or mark nodes on the canvas and refer to \"selected nodes\".",
            ],
        };
    }
    return {
        response_type: "clarify",
        message,
        issues: [message],
        suggestions: ["Edit your request and try planning again."],
    };
}
