/**
 * Search-criteria gate editing for Multi Query REVEAL: reconciles the step-1 "review terms" gate
 * edits (per-route or legacy single-route) back into the session's union term lists and
 * `searchCriteria` display rows.
 */

import { normalizeLlmTermList } from "./revealMqExtraction.js";

/** Pure union of phenotype/mechanism/gene terms across multi-query routes (dedup, first-seen order). */
function computeUnionTermsFromRoutes(routes) {
    const list = Array.isArray(routes) ? routes : [];
    const phenotypeTerms = [];
    const mechanismTerms = [];
    const genesOfInterest = [];
    list.forEach((route) => {
        const extracted = route && route.extracted_terms ? route.extracted_terms : {};
        normalizeLlmTermList(extracted.phenotype_terms).forEach((t) => {
            if (!phenotypeTerms.includes(t)) phenotypeTerms.push(t);
        });
        normalizeLlmTermList(extracted.mechanism_terms).forEach((t) => {
            if (!mechanismTerms.includes(t)) mechanismTerms.push(t);
        });
        normalizeLlmTermList(extracted.genes_of_interest).forEach((t) => {
            if (!genesOfInterest.includes(t)) genesOfInterest.push(t);
        });
    });
    return {
        phenotypeTerms,
        mechanismTerms,
        genesOfInterest,
        searchTerms: [...phenotypeTerms, ...mechanismTerms],
    };
}

function syncUnionTermsFromMultiQueryRoutes(vm) {
    const routes = Array.isArray(vm.multiQueryRoutes) ? vm.multiQueryRoutes : [];
    const selectedId = vm.selectedRouteId != null ? String(vm.selectedRouteId) : "";
    const scoped =
        selectedId && routes.some((r) => r && String(r.route_id) === selectedId)
            ? routes.filter((r) => r && String(r.route_id) === selectedId)
            : routes;
    const { phenotypeTerms, mechanismTerms, genesOfInterest, searchTerms } =
        computeUnionTermsFromRoutes(scoped);
    vm.lastPhenotypeTerms = phenotypeTerms;
    vm.lastMechanismTerms = mechanismTerms;
    vm.lastGenesOfInterest = genesOfInterest;
    vm.searchTerm = searchTerms.join(", ");
    if (vm.searchCriteria && vm.searchCriteria[0]) {
        vm.$set(
            vm.searchCriteria[0],
            "values",
            searchTerms.length ? searchTerms : ["(none extracted)"]
        );
    }
}

function applySearchCriteriaGateEdits(vm) {
    if (vm.usePerRouteSearchTermsEditor) {
        const researchContext = String(vm.sharedResearchContextTerm || "").trim();
        vm.searchCriteria = [
            {
                search_criteria: "Search Terms",
                values: ["(per direction — see below)"],
                why: "Each retrieval direction uses its own extracted terms.",
                purpose:
                    "Route-specific terms drive hybrid search for tissue expression, perturbations, and genetics.",
            },
            {
                search_criteria: "Research Context",
                values: researchContext || "(none extracted)",
                why: "We inferred this from your search query.",
                purpose:
                    "This context will be used to tailor mechanistic hypotheses to your research.",
            },
        ];
        vm.applyRouteEditRowsToMultiQueryRoutes();
        syncUnionTermsFromMultiQueryRoutes(vm);
        return;
    }
    const rows = Array.isArray(vm.searchCriteriaEditRows) ? vm.searchCriteriaEditRows : [];
    const phenotypeRow = rows.find((r) => r && r.type === "Phenotype terms");
    const mechanismRow = rows.find((r) => r && r.type === "Mechanism terms");
    const goiRow = rows.find((r) => r && r.type === "Genes of interest");
    const contextRow = rows.find((r) => r && r.type === "Research context");
    const phenotypeTerms = String((phenotypeRow && phenotypeRow.term) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const mechanismTerms = String((mechanismRow && mechanismRow.term) || "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    const genesOfInterest = String((goiRow && goiRow.term) || "")
        .split(/[,;\n]/)
        .map((s) => s.trim())
        .filter(Boolean);
    const researchContext = contextRow ? String(contextRow.term || "").trim() : "";

    vm.lastPhenotypeTerms = phenotypeTerms;
    vm.lastMechanismTerms = mechanismTerms;
    vm.lastGenesOfInterest = genesOfInterest;
    const searchTerms = [...phenotypeTerms, ...mechanismTerms];
    vm.searchTerm = searchTerms.join(", ");
    vm.searchCriteria = [
        {
            search_criteria: "Search Terms",
            values: searchTerms.length ? searchTerms : ["(none extracted)"],
            why: "We extracted this from your search query.",
            purpose:
                "These terms will be used to search for related phenotype↔signature associations via semantic search.",
        },
        {
            search_criteria: "Research Context",
            values: researchContext || "(none extracted)",
            why: "We inferred this from your search query.",
            purpose:
                "This context will be used to tailor mechanistic hypotheses to your research.",
        },
    ];
}

export { applySearchCriteriaGateEdits, computeUnionTermsFromRoutes, syncUnionTermsFromMultiQueryRoutes };
