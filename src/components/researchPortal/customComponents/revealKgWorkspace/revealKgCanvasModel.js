/** Canvas interactive data bucket (`model` query param on research / KC URLs). */

export const DEFAULT_CANVAS_INTERACTIVE_MODEL = "cfde";

export function normalizeCanvasInteractiveModel(value, availableModels = null) {
    const text = String(value || "").trim();
    if (!text) {
        return DEFAULT_CANVAS_INTERACTIVE_MODEL;
    }
    const lower = text.toLowerCase();
    if (lower === DEFAULT_CANVAS_INTERACTIVE_MODEL) {
        return DEFAULT_CANVAS_INTERACTIVE_MODEL;
    }
    if (Array.isArray(availableModels) && availableModels.length) {
        const match = availableModels.find(
            (entry) => String(entry || "").toLowerCase() === lower
        );
        return match ? String(match) : DEFAULT_CANVAS_INTERACTIVE_MODEL;
    }
    return text;
}

/**
 * Read `model` from the current page URL.
 * Supports `/research.html?pageid=reveal_canvas&model=cfde-inc` and `/r/reveal_canvas?model=cfde-inc`.
 */
export function parseCanvasInteractiveModelFromLocation(location = null) {
    const resolved =
        location ||
        (typeof window !== "undefined" ? window.location : { search: "" });
    const params = new URLSearchParams(resolved.search || "");
    const fromQuery = params.get("model");
    if (fromQuery) {
        return String(fromQuery).trim();
    }
    return DEFAULT_CANVAS_INTERACTIVE_MODEL;
}

export function canvasInteractiveModelUsesAlternateBucket(model) {
    return (
        normalizeCanvasInteractiveModel(model) !== DEFAULT_CANVAS_INTERACTIVE_MODEL
    );
}

export function canvasModelCapabilities(model = DEFAULT_CANVAS_INTERACTIVE_MODEL) {
    const normalized = normalizeCanvasInteractiveModel(model);
    const incubator = normalized === "cfde-inc";
    return {
        model: normalized,
        geneSetSemanticSearch: !incubator,
        label: incubator ? "CFDE Incubator" : "CFDE",
    };
}

export const GENE_SET_SEMANTIC_SEARCH_UNAVAILABLE_NOTE =
    "Gene-set embedding search is not available for this data bucket. " +
    "Use demo: prefix for demo gene sets, or open Canvas with the default CFDE model.";
