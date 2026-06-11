/** Repair common planner JSON mistakes using the user query and session context. */

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
    const match = String(userQuery || "").match(/\btop\s+(\d{1,2})\b/i);
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.min(50, Math.max(1, value)) : null;
}

function parseNeighborCountFromQuery(userQuery) {
    const match = String(userQuery || "").match(
        /\b(?:add|fetch|get|expand(?:\s+with)?)\s+(\d{1,2})\s+(?:neighbor|neighbours|nodes?)\b/i
    );
    if (!match) {
        return null;
    }
    const value = Number(match[1]);
    return Number.isFinite(value) ? Math.min(20, Math.max(1, value)) : null;
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
    if (/\bgene[\s-]?set\b/i.test(query)) {
        return "gene_set";
    }
    if (/\btrait\b/i.test(query)) {
        return "trait";
    }
    if (/\bmechanism\b/i.test(query) || /\bfactor\b/i.test(query)) {
        return "factor";
    }
    if (/\bgene\b/i.test(query)) {
        return "gene";
    }
    return "gene";
}

function repairAddNodeStep(step, userQuery) {
    if (step?.action !== "add_node") {
        return step;
    }
    const options = { ...(step.options || {}) };
    if (!options.search_label) {
        const label = parseAddNodeSearchLabel(userQuery);
        if (label) {
            options.search_label = label;
        }
    }
    if (!options.node_type) {
        options.node_type = inferAddNodeTypeFromQuery(userQuery);
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
        if (options.count === undefined) {
            const neighborCount = parseNeighborCountFromQuery(query);
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

/** Gene-like tokens in the query that are not on the graph. */
export function graphLabelsMissingFromQuery(userQuery, sessionContext) {
    const query = String(userQuery || "");
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

    const repairedSteps = stripRedundantClearBeforeRemove(
        steps.map((step) =>
            repairUnselectStep(
                repairAddNodeStep(
                    repairRemoveNodeTarget(
                        repairStepOptions(
                            repairStepTarget(step, labelsOnGraph),
                            userQuery,
                            sessionContext
                        ),
                        labelsOnGraph,
                        userQuery
                    ),
                    userQuery
                ),
                userQuery
            )
        )
    );
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

    return {
        type: "plan",
        json: {
            ...json,
            steps: repairedSteps,
        },
    };
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
