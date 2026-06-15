import { normalizeLlmTermList, parseCommaSeparatedTerms } from "./revealMqExtraction.js";

const ROUTE_ROW_EDIT_FIELDS = [
    { type: "Phenotype terms", key: "phenotype_term" },
    { type: "Mechanism terms", key: "mechanism_term" },
    { type: "Genes", key: "genes_of_interest" },
    { type: "Tissues", key: "tissues" },
    { type: "Cell types", key: "cell_types" },
];

function getRouteEditRow(route, editRows = []) {
    if (!route || route.route_id == null) return null;
    const routeId = String(route.route_id);
    return (editRows || []).find((row) => row && String(row.route_id) === routeId) || null;
}

function buildRouteEditRowsFromRoutes(routes = [], normalizeTermList = normalizeLlmTermList) {
    return (Array.isArray(routes) ? routes : []).map((route) => {
        const extracted =
            route && route.extracted_terms && typeof route.extracted_terms === "object"
                ? route.extracted_terms
                : {};
        return {
            route_id: route.route_id || "",
            category: route.category || "",
            biological_query_variation: route.biological_query_variation || "",
            phenotype_term: normalizeTermList(extracted.phenotype_terms).join(", "),
            mechanism_term: normalizeTermList(extracted.mechanism_terms).join(", "),
            genes_of_interest: normalizeTermList(extracted.genes_of_interest).join(", "),
            tissues: normalizeTermList(extracted.tissues).join(", "),
            cell_types: normalizeTermList(extracted.cell_types).join(", "),
        };
    });
}

function patchRoutesFromEditRows(routes = [], editRows = []) {
    const next = Array.isArray(routes) ? [...routes] : [];
    (Array.isArray(editRows) ? editRows : []).forEach((row, idx) => {
        if (!row) return;
        const routeIdx = next.findIndex((r) => r && r.route_id === row.route_id);
        const i = routeIdx >= 0 ? routeIdx : idx;
        if (!next[i]) return;
        next[i] = {
            ...next[i],
            extracted_terms: {
                phenotype_terms: parseCommaSeparatedTerms(row.phenotype_term),
                mechanism_terms: parseCommaSeparatedTerms(row.mechanism_term),
                genes_of_interest: parseCommaSeparatedTerms(row.genes_of_interest),
                tissues: parseCommaSeparatedTerms(row.tissues),
                cell_types: parseCommaSeparatedTerms(row.cell_types),
            },
        };
    });
    return next;
}

export {
    ROUTE_ROW_EDIT_FIELDS,
    buildRouteEditRowsFromRoutes,
    getRouteEditRow,
    patchRoutesFromEditRows,
};
