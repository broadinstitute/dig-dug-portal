/** Sanitize API / server errors for canvas assistant UI. */

function stripHtml(text) {
    return String(text || "")
        .replace(/<[^>]*>/g, " ")
        .replace(/&nbsp;|&lt;|&gt;|&amp;|&#\d+;/gi, " ")
        .replace(/\s+/g, " ")
        .trim();
}

function firstMeaningfulLine(text) {
    const lines = String(text || "")
        .split(/[\n\r]+/)
        .map((line) => line.trim())
        .filter(Boolean);
    if (!lines.length) {
        return "";
    }
    for (const line of lines) {
        if (!/^\s*at\s+/i.test(line) && !line.includes("node_modules")) {
            return line;
        }
    }
    return lines[0];
}

export function sanitizeAssistantError(error) {
    let message = stripHtml(error?.message || error || "Canvas assistant step failed.");
    if (!message) {
        message = "Canvas assistant step failed.";
    }
    if (/PayloadTooLargeError|request entity too large/i.test(message)) {
        return "The request was too large. Try explaining or expanding with fewer nodes.";
    }
    if (message.includes("node_modules") || message.length > 280) {
        message = firstMeaningfulLine(message) || message.slice(0, 277);
    }
    if (message.length > 280) {
        message = `${message.slice(0, 277)}…`;
    }
    return message;
}

function neighborTypeLabel(targetType) {
    const value = String(targetType || "all").trim().toLowerCase();
    if (value === "factor" || value === "mechanism" || value === "pathway") {
        return "pathways or mechanisms";
    }
    if (value === "gene") {
        return "genes";
    }
    if (value === "geneset" || value === "gene_set") {
        return "gene sets";
    }
    if (value === "trait") {
        return "traits";
    }
    return "neighbors";
}

function resolutionForAssistantStepError(message, step = {}) {
    const action = String(step?.action || "").trim();
    const options = step?.options || {};
    const targetType = options.target_type || options.targetType || "all";

    if (/No new connections matched/i.test(message)) {
        const neighborLabel = neighborTypeLabel(targetType);
        return `No novel ${neighborLabel} matched the current seeds and filters. Try including known nodes too (“show known and novel nodes”), change the target type, or pick different seed nodes. Then click Run to retry.`;
    }
    if (/Mark at least one selected node/i.test(message)) {
        return "Mark one or more seed nodes on the graph, then click Run on this step again.";
    }
    if (/No valid target types/i.test(message)) {
        return "Try a different target type or expansion scope, or add seed nodes that support that neighbor type.";
    }
    if (/Add expression, novelty, or intent criteria/i.test(message)) {
        return 'Say what should stay visible — for example “show novel nodes only”, “show known nodes only”, or describe an intent such as “genes related to insulin signaling”. Then plan again.';
    }
    if (/No nodes matched the removal target|No nodes matched the unselect criteria/i.test(message)) {
        return "Adjust the step target or graph selection so matching nodes exist, then click Run to retry.";
    }
    if (/No hidden nodes to remove/i.test(message)) {
        return "Build a visibility filter first so some nodes are hidden, or skip this cleanup step.";
    }
    if (/Those nodes cannot be removed/i.test(message)) {
        return "Unmark selected nodes first, then run the removal step again.";
    }
    if (/request was too large/i.test(message)) {
        return "Reduce the number of selected nodes or narrow the request, then run the step again.";
    }
    if (action === "expand_graph") {
        return "Review the expansion seeds and filters in the plan, adjust if needed, then click Run on this step to retry.";
    }
    return "Review the step settings and graph state, then click Run on this step to retry or edit your request and plan again.";
}

export function formatAssistantStepError(error, step = {}) {
    const message = sanitizeAssistantError(error);
    const stepLabel = String(step?.label || "Assistant step").trim();
    return {
        message,
        resolution: resolutionForAssistantStepError(message, step),
        stepLabel,
    };
}
