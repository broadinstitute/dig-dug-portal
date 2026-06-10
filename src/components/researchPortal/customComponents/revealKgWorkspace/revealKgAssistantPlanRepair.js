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

/** Labels from sample_nodes that appear in the user query (word match). */
export function graphLabelsMentionedInQuery(userQuery, sessionContext) {
    const query = String(userQuery || "");
    const labels = [];
    for (const node of graphNodesFromContext(sessionContext)) {
        const label = String(node.label || "").trim();
        if (!label || label.length < 2) {
            continue;
        }
        const pattern = new RegExp(`\\b${escapeRegExp(label)}\\b`, "i");
        if (pattern.test(query)) {
            labels.push(label);
        }
    }
    return [...new Set(labels)];
}

/** Gene-like tokens in the query that are not on the graph. */
export function graphLabelsMissingFromQuery(userQuery, sessionContext) {
    const query = String(userQuery || "");
    const tokens = query.match(/\b[A-Z][A-Z0-9-]{1,}\b/g) || [];
    const onGraph = new Set(
        graphNodesFromContext(sessionContext).flatMap((node) => {
            const labels = [];
            const label = String(node.label || "").trim();
            if (label) {
                labels.push(normalizeLabel(label));
            }
            const nodeId = String(node.node_id || "");
            const suffix = nodeId.split(":").pop();
            if (suffix) {
                labels.push(normalizeLabel(suffix));
            }
            return labels;
        })
    );
    const missing = [];
    for (const token of tokens) {
        if (QUERY_STOP_WORDS.has(token)) {
            continue;
        }
        if (!onGraph.has(normalizeLabel(token))) {
            missing.push(token);
        }
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

    const repairedSteps = steps.map((step) => repairStepTarget(step, labelsOnGraph));
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
