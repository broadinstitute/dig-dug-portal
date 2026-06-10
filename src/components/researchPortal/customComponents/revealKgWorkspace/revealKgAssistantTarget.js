/** Targeting schema for canvas assistant plans (v2). */

export const ASSISTANT_TARGET_SCOPES = [
    "all",
    "selected_nodes",
    "node_types",
    "nodes",
    "node",
    "edge",
    "last_filter_pass",
    "last_filter_fail",
];

export const DEFAULT_ASSISTANT_TARGET = { scope: "all" };

export function normalizeAssistantTarget(rawTarget = {}) {
    const target = rawTarget && typeof rawTarget === "object" ? { ...rawTarget } : {};
    const scope = ASSISTANT_TARGET_SCOPES.includes(target.scope)
        ? target.scope
        : DEFAULT_ASSISTANT_TARGET.scope;
    const normalized = { scope };
    if (Array.isArray(target.node_ids)) {
        normalized.node_ids = target.node_ids.filter(Boolean).map(String);
    }
    if (Array.isArray(target.node_labels)) {
        normalized.node_labels = target.node_labels
            .filter(Boolean)
            .map((label) => String(label).trim())
            .filter(Boolean);
    }
    if (Array.isArray(target.node_types)) {
        normalized.node_types = target.node_types.filter(Boolean).map(String);
    }
    if (target.edge && typeof target.edge === "object") {
        normalized.edge = {
            source_label: String(target.edge.source_label || "").trim(),
            target_label: String(target.edge.target_label || "").trim(),
        };
        if (!normalized.edge.source_label && !normalized.edge.target_label) {
            delete normalized.edge;
        }
    }
    return normalized;
}

export function validateAssistantTarget(rawTarget, { nodeTypes = [] } = {}) {
    const target = normalizeAssistantTarget(rawTarget);
    if (target.scope === "node_types" || target.scope === "nodes") {
        if (target.node_types?.length) {
            const invalid = target.node_types.filter((type) => !nodeTypes.includes(type));
            if (invalid.length) {
                throw new Error(`target.node_types has invalid values: ${invalid.join(", ")}`);
            }
        }
    }
    if (target.scope === "node" && !target.node_ids?.length && !target.node_labels?.length) {
        throw new Error('target scope "node" requires node_ids or node_labels.');
    }
    if (target.scope === "nodes" && !target.node_ids?.length && !target.node_labels?.length) {
        throw new Error('target scope "nodes" requires node_ids or node_labels.');
    }
    if (target.scope === "edge" && !target.edge) {
        throw new Error('target scope "edge" requires edge.source_label and/or edge.target_label.');
    }
    return target;
}
