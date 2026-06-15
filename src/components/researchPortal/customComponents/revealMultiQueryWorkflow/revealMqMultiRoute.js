/**
 * Multi-route hybrid retrieval: factor merge, evidence bundles, route term resolution.
 */

import { normalizeLlmTermList } from "./revealMqExtraction.js";

function sanitizeEmbeddingText(text) {
    if (!text) return "";
    const patterns = [
        { regex: /\b(gtex|lincs|cmdkp|hubmap|motrpac|dcc)\b/gi, replacement: "" },
        { regex: /\b(data\s+portal|database|repository|portal)\b/gi, replacement: "" },
    ];
    let cleaned = String(text);
    patterns.forEach((p) => {
        cleaned = cleaned.replace(p.regex, p.replacement);
    });
    return cleaned.replace(/\s+/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
}

function isConstraintValidationError(err) {
    const msg = err && err.message ? String(err.message) : "";
    return /(^|\s)422(\s|$)|constraint_scope\.associations|constraint_mode|Value error/i.test(msg);
}

function resolveHybridPhenotypeFilterTerms(phenotypeTerms, mechanismTerms, researchContext, userQuery = "") {
    const NONE = "(none extracted)";
    const trimmedP = (phenotypeTerms || [])
        .map((t) => String(t || "").trim())
        .filter((t) => t && t !== NONE);
    if (trimmedP.length) return trimmedP;
    const m = Array.isArray(mechanismTerms) ? mechanismTerms : [];
    if (m.length) return [...m];
    let ctx = researchContext != null ? String(researchContext).trim() : "";
    if (ctx === NONE) ctx = "";
    if (ctx.length) {
        const first = ctx.split(/[.;\n]/)[0].trim();
        if (first) return [first.slice(0, 256)];
    }
    const q = String(userQuery || "").trim();
    if (q) return [q.slice(0, 256)];
    return [];
}

function resolveMultiRouteHybridPhenotypeFilterTerms(route, topLevelPhenotypeTerms = []) {
    const terms =
        route && route.extracted_terms && typeof route.extracted_terms === "object" ? route.extracted_terms : {};
    const routePhenos = normalizeLlmTermList(terms.phenotype_terms);
    if (routePhenos.length) return routePhenos;
    const topP = normalizeLlmTermList(topLevelPhenotypeTerms);
    if (topP.length) return topP;
    return [];
}

function routeGenesOfInterestForFetch(route, lastExplicitUserGenes = []) {
    const terms = route && route.extracted_terms ? route.extracted_terms : {};
    const routeGenes = normalizeLlmTermList(terms.genes_of_interest);
    const explicit = normalizeLlmTermList(lastExplicitUserGenes);
    const merged = [...routeGenes];
    explicit.forEach((gene) => {
        if (!merged.some((g) => String(g).toUpperCase() === String(gene).toUpperCase())) {
            merged.push(gene);
        }
    });
    return merged;
}

function routeResearchContextForFetch(route, sharedResearchContext = "") {
    const routeText =
        route && (route.sanitized_query || route.biological_query_variation)
            ? String(route.sanitized_query || route.biological_query_variation).trim()
            : "";
    const shared = sharedResearchContext != null ? String(sharedResearchContext).trim() : "";
    const NONE = "(none extracted)";
    const sharedClean = shared === NONE ? "" : shared;
    const parts = [routeText, sharedClean].filter(Boolean);
    return sanitizeEmbeddingText(parts.join("\n"));
}

function routeFactorSupportScore(factor = {}, phenotypeData = {}) {
    const genes = factor && factor.genes && typeof factor.genes === "object" ? factor.genes : {};
    const globalGenes =
        phenotypeData && phenotypeData.genes && typeof phenotypeData.genes === "object" ? phenotypeData.genes : {};
    let best = null;
    Object.keys(genes).forEach((gene) => {
        const local = genes[gene] || {};
        const global = globalGenes[gene] || {};
        const raw =
            global.combined != null
                ? global.combined
                : local.factorRelevance != null
                  ? local.factorRelevance
                  : local.factor_value;
        const score = Number(raw);
        if (!Number.isFinite(score)) return;
        if (best == null || score > best) best = score;
    });
    return best;
}

function factorMatchesEvidenceHit(factor = {}, hit = {}) {
    const factorId = factor.factor != null ? String(factor.factor).trim() : "";
    const factorLabel = factor.label != null ? String(factor.label).trim() : "";
    const hitFactorId = hit.factor_id != null ? String(hit.factor_id).trim() : "";
    const hitFactor = hit.factor != null ? String(hit.factor).trim() : "";
    return (
        (hitFactorId && hitFactorId === factorId) ||
        (hitFactor && (hitFactor === factorLabel || hitFactor === factorId))
    );
}

function filterRouteFactorDataToEvidenceHits(routeResult = {}) {
    const factorData = routeResult.factorData || {};
    const hits =
        routeResult.evidenceBundle && Array.isArray(routeResult.evidenceBundle.top_hits)
            ? routeResult.evidenceBundle.top_hits
            : [];
    if (!hits.length) return factorData;

    const filtered = {};
    Object.keys(factorData).forEach((phenotype) => {
        const pData = factorData[phenotype] || {};
        const phenotypeHits = hits.filter((hit) => String(hit.phenotype || "") === String(phenotype));
        if (!phenotypeHits.length) return;
        const factors = (pData.factors || []).filter((factor) =>
            phenotypeHits.some((hit) => factorMatchesEvidenceHit(factor, hit))
        );
        if (!factors.length) return;
        filtered[phenotype] = {
            ...pData,
            factors,
            allFactors: factors,
        };
    });
    return filtered;
}

function annotateFactorDataWithFetchedDirection(factorData = {}, route = {}) {
    const fetchedDirection = route && route.category != null ? String(route.category).trim() : "";
    const fetchedDirectionId = route && route.route_id != null ? String(route.route_id).trim() : "";
    const fetchedQuery =
        route && (route.sanitized_query || route.biological_query_variation)
            ? String(route.sanitized_query || route.biological_query_variation).trim()
            : "";
    const annotated = {};
    Object.keys(factorData || {}).forEach((phenotype) => {
        const src = factorData[phenotype] || {};
        const annotateFactor = (factor) => ({
            ...factor,
            fetched_direction: fetchedDirection,
            fetched_direction_id: fetchedDirectionId,
            fetched_query: fetchedQuery,
            route_category: fetchedDirection,
            route_query: fetchedQuery,
            route_categories: fetchedDirection ? [fetchedDirection] : [],
            route_queries: fetchedQuery ? [fetchedQuery] : [],
        });
        annotated[phenotype] = {
            ...src,
            factors: (src.factors || []).map(annotateFactor),
            allFactors: (src.allFactors || src.factors || []).map(annotateFactor),
        };
    });
    return annotated;
}

function mergeRouteFactorData(routeResults) {
    const merged = {};
    (routeResults || []).forEach((result) => {
        const route = result.route || {};
        const data = result.factorData || {};
        Object.keys(data).forEach((phenotype) => {
            const src = data[phenotype] || {};
            if (!merged[phenotype]) {
                merged[phenotype] = {
                    genes: {},
                    factors: [],
                    allFactors: [],
                    filterRationale: "",
                };
            }
            merged[phenotype].genes = {
                ...(merged[phenotype].genes || {}),
                ...(src.genes || {}),
            };
            const factorMergeKey = (factor) => {
                const direction = factor.fetched_direction || factor.route_category || "";
                return `${String(factor.factor)}||${String(factor.label || "")}||${String(direction)}`;
            };
            const seenFactors = new Set((merged[phenotype].factors || []).map(factorMergeKey));
            (src.factors || []).forEach((factor) => {
                const key = factorMergeKey(factor);
                const routeCategory = factor.fetched_direction || route.category || "";
                const routeId = factor.fetched_direction_id || route.route_id || "";
                const routeQuery =
                    factor.fetched_query || route.sanitized_query || route.biological_query_variation || "";
                const routeScore = routeFactorSupportScore(factor, src);
                if (seenFactors.has(key)) {
                    const existing = (merged[phenotype].factors || []).find((f) => factorMergeKey(f) === key);
                    if (existing) {
                        const categories = Array.isArray(existing.route_categories)
                            ? existing.route_categories.slice()
                            : [];
                        if (routeCategory && !categories.includes(routeCategory)) categories.push(routeCategory);
                        existing.route_categories = categories;
                        const queries = Array.isArray(existing.route_queries) ? existing.route_queries.slice() : [];
                        if (routeQuery && !queries.includes(routeQuery)) queries.push(routeQuery);
                        existing.route_queries = queries;
                        const existingScore =
                            existing.route_support_score != null && Number.isFinite(Number(existing.route_support_score))
                                ? Number(existing.route_support_score)
                                : null;
                        if (routeScore != null && (existingScore == null || routeScore > existingScore)) {
                            Object.assign(existing, {
                                ...factor,
                                fetched_direction: routeCategory,
                                fetched_direction_id: routeId,
                                fetched_query: routeQuery,
                                route_category: routeCategory,
                                route_query: routeQuery,
                                route_categories: categories,
                                route_queries: queries,
                                route_support_score: routeScore,
                            });
                        }
                    }
                    return;
                }
                seenFactors.add(key);
                merged[phenotype].factors.push({
                    ...factor,
                    fetched_direction: routeCategory,
                    fetched_direction_id: routeId,
                    fetched_query: routeQuery,
                    route_category: routeCategory,
                    route_categories: routeCategory ? [routeCategory] : [],
                    route_query: routeQuery,
                    route_queries: routeQuery ? [routeQuery] : [],
                    route_support_score: routeScore,
                });
            });
            merged[phenotype].allFactors = merged[phenotype].factors;
        });
    });
    return merged;
}

function buildCompactRouteEvidence({
    route,
    factorData,
    hybridJson,
    evidenceLimits = {},
    lastExplicitUserGenes = [],
} = {}) {
    const limits = evidenceLimits || {};
    const maxPairs = Math.max(1, Number(limits.maxPairsPerRoute) || 5);
    const maxGenes = Math.max(1, Number(limits.maxGenesPerFactor) || 5);
    const maxGenesOfInterest = Math.max(0, Number(limits.maxGenesOfInterestPerFactor ?? 5) || 0);
    const maxGeneSets = Math.max(1, Number(limits.maxGeneSetsPerFactor) || 3);
    const routeGenesOfInterest = normalizeLlmTermList(
        route && route.extracted_terms ? route.extracted_terms.genes_of_interest : []
    );
    const genesOfInterestSet = new Set(
        normalizeLlmTermList([...routeGenesOfInterest, ...lastExplicitUserGenes]).map((g) => String(g).toUpperCase())
    );
    const explicitUserGeneSet = new Set(lastExplicitUserGenes.map((g) => String(g).toUpperCase()));
    const hits = [];
    Object.keys(factorData || {}).forEach((phenotype) => {
        const pData = factorData[phenotype] || {};
        (pData.factors || []).forEach((factor) => {
            const allGeneRows = Object.keys(factor.genes || {})
                .map((gene) => {
                    const local = factor.genes[gene] || {};
                    const global = (pData.genes && pData.genes[gene]) || {};
                    const geneKey = String(gene).toUpperCase();
                    const score = Number(
                        global.combined != null
                            ? global.combined
                            : local.factor_value != null
                              ? local.factor_value
                              : local.factorRelevance
                    );
                    return {
                        gene,
                        score: Number.isFinite(score) ? score : null,
                        gwas_support: global.gwasSupport != null ? global.gwasSupport : null,
                        functional_support: global.geneSetSupport != null ? global.geneSetSupport : null,
                        included_because: "top_score",
                        explicit_user_gene: explicitUserGeneSet.has(geneKey),
                        gene_of_interest: genesOfInterestSet.has(geneKey),
                    };
                })
                .sort((a, b) => (Number(b.score) || 0) - (Number(a.score) || 0));
            const topGeneRows = allGeneRows.slice(0, maxGenes);
            const topGeneKeys = new Set(topGeneRows.map((g) => String(g.gene).toUpperCase()));
            const pinnedGeneRows = allGeneRows
                .filter((g) => genesOfInterestSet.has(String(g.gene).toUpperCase()))
                .filter((g) => !topGeneKeys.has(String(g.gene).toUpperCase()))
                .slice(0, maxGenesOfInterest)
                .map((g) => ({
                    ...g,
                    included_because: g.explicit_user_gene ? "explicit_user_gene" : "gene_of_interest",
                }));
            const geneRows = [...topGeneRows, ...pinnedGeneRows];
            const geneSets =
                typeof factor.top_gene_sets === "string"
                    ? factor.top_gene_sets
                          .split(";")
                          .map((s) => s.trim())
                          .filter(Boolean)
                          .slice(0, maxGeneSets)
                    : [];
            hits.push({
                phenotype,
                factor: factor.label || factor.factor,
                factor_id: factor.factor,
                top_gene_sets: geneSets,
                gene_set_programs:
                    typeof factor.gene_set_program === "string"
                        ? factor.gene_set_program
                              .split("|")
                              .map((s) => s.trim())
                              .filter(Boolean)
                        : [],
                genes: geneRows,
            });
        });
    });
    return {
        route_id: route && route.route_id,
        category: route && route.category,
        biological_query_variation: route && route.biological_query_variation,
        sanitized_query: route && route.sanitized_query,
        extracted_terms: route && route.extracted_terms,
        constraint_mode: route && route.constraint_spec ? route.constraint_spec.constraint_mode : null,
        top_hits: hits.slice(0, maxPairs),
        meta: hybridJson && hybridJson.meta ? hybridJson.meta : {},
    };
}

function setMultiQueryRouteStatus(vm, routeId, status, patch = {}) {
    const idx = (vm.multiQueryRoutes || []).findIndex((r) => r && r.route_id === routeId);
    if (idx === -1) return;
    vm.$set(vm.multiQueryRoutes, idx, {
        ...vm.multiQueryRoutes[idx],
        ...patch,
        status,
    });
}

export {
    annotateFactorDataWithFetchedDirection,
    buildCompactRouteEvidence,
    factorMatchesEvidenceHit,
    filterRouteFactorDataToEvidenceHits,
    isConstraintValidationError,
    mergeRouteFactorData,
    resolveHybridPhenotypeFilterTerms,
    resolveMultiRouteHybridPhenotypeFilterTerms,
    routeFactorSupportScore,
    routeGenesOfInterestForFetch,
    routeResearchContextForFetch,
    sanitizeEmbeddingText,
    setMultiQueryRouteStatus,
};
