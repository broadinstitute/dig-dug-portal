/** Resolve My library graph records for assistant steps. */

function normalizeLabel(value) {
    return String(value || "").trim().toLowerCase();
}

export function resolveAssistantLibraryGraph(records = [], { graphId, graphLabel } = {}) {
    const list = Array.isArray(records) ? records : [];
    const id = String(graphId || "").trim();
    if (id) {
        const match = list.find((record) => record.id === id);
        if (!match) {
            throw new Error(`No saved graph with id "${id}" was found in My library.`);
        }
        return match;
    }
    const label = String(graphLabel || "").trim();
    if (!label) {
        throw new Error("open_library_graph requires graph_label or graph_id.");
    }
    const normalized = normalizeLabel(label);
    const matches = list.filter(
        (record) => normalizeLabel(record.label) === normalized
    );
    if (matches.length === 1) {
        return matches[0];
    }
    if (matches.length > 1) {
        throw new Error(
            `Multiple saved graphs named "${label}". Open My library and use a unique name.`
        );
    }
    const partial = list.filter((record) =>
        normalizeLabel(record.label).includes(normalized)
    );
    if (partial.length === 1) {
        return partial[0];
    }
    throw new Error(`No saved graph named "${label}" was found in My library.`);
}
