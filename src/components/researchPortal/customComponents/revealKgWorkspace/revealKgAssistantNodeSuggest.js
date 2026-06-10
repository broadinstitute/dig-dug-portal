/** Node label autocomplete for the canvas assistant request input. */

const NODE_TYPE_LABELS = {
    gene: "Gene",
    gene_set: "Gene set",
    factor: "Mechanism",
    trait: "Trait",
};

export function assistantNodeTypeLabel(nodeType) {
    const key = String(nodeType || "").trim();
    return NODE_TYPE_LABELS[key] || key || "Node";
}

export function normalizeAssistantSuggestNodes(nodes = []) {
    return (nodes || [])
        .map((node) => {
            const nodeId = String(node?.node_id || node?.id || "").trim();
            const label = String(node?.label || nodeId).trim();
            const type = String(node?.type || node?.node_type || "").trim();
            if (!nodeId || !label) {
                return null;
            }
            return {
                node_id: nodeId,
                label,
                type,
                typeLabel: assistantNodeTypeLabel(type),
            };
        })
        .filter(Boolean);
}

/** Word being typed at the caret (gene labels may include hyphens). */
export function getActiveToken(text, caretIndex) {
    const value = String(text || "");
    const caret = Math.max(0, Math.min(Number(caretIndex) || 0, value.length));
    let start = caret;
    while (start > 0 && /[\w.-]/.test(value[start - 1])) {
        start -= 1;
    }
    let end = caret;
    while (end < value.length && /[\w.-]/.test(value[end])) {
        end += 1;
    }
    return {
        token: value.slice(start, end),
        start,
        end,
    };
}

function nodeSearchKeys(node) {
    const keys = new Set();
    const label = String(node.label || "").trim().toLowerCase();
    if (label) {
        keys.add(label);
    }
    const nodeId = String(node.node_id || "");
    const suffix = nodeId.split(":").slice(1).join(":").trim().toLowerCase();
    if (suffix) {
        keys.add(suffix);
    }
    return keys;
}

function matchScore(node, queryLower) {
    const label = String(node.label || "").trim();
    const labelLower = label.toLowerCase();
    if (labelLower === queryLower) {
        return 0;
    }
    if (labelLower.startsWith(queryLower)) {
        return 1;
    }
    for (const key of nodeSearchKeys(node)) {
        if (key.startsWith(queryLower)) {
            return 2;
        }
    }
    if (labelLower.includes(queryLower)) {
        return 3;
    }
    for (const key of nodeSearchKeys(node)) {
        if (key.includes(queryLower)) {
            return 4;
        }
    }
    return -1;
}

export function matchAssistantSuggestNodes(token, nodes = [], { limit = 8, minLength = 2 } = {}) {
    const query = String(token || "").trim();
    if (query.length < minLength) {
        return [];
    }
    const queryLower = query.toLowerCase();
    return normalizeAssistantSuggestNodes(nodes)
        .map((node) => ({ node, score: matchScore(node, queryLower) }))
        .filter((entry) => entry.score >= 0)
        .sort((left, right) => {
            if (left.score !== right.score) {
                return left.score - right.score;
            }
            return String(left.node.label).localeCompare(String(right.node.label), undefined, {
                sensitivity: "base",
            });
        })
        .slice(0, limit)
        .map((entry) => entry.node);
}

export function replaceActiveToken(text, start, end, replacement) {
    const value = String(text || "");
    const insert = String(replacement || "");
    const safeStart = Math.max(0, Math.min(start, value.length));
    const safeEnd = Math.max(safeStart, Math.min(end, value.length));
    return {
        text: value.slice(0, safeStart) + insert + value.slice(safeEnd),
        caret: safeStart + insert.length,
    };
}
