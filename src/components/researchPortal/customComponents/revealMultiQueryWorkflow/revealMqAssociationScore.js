/**
 * Phenotype-association Combined-score tiers (same thresholds as FactorBaseRevealHeatmap2.getColorByScore).
 * Used for legend checkbox filters → heatmap/table gene visibility → hypothesis LLM gene feed.
 */

const ASSOCIATION_TIER_IDS = [
    "veryStrong",
    "stronglySuggestive",
    "nominallySignificant",
    "notSignificant",
];

const DEFAULT_ASSOCIATION_FILTERS = {
    veryStrong: true,
    stronglySuggestive: true,
    nominallySignificant: true,
    notSignificant: true,
};

/**
 * @param {number|null|undefined} combined
 * @returns {"veryStrong"|"stronglySuggestive"|"nominallySignificant"|"notSignificant"}
 */
function classifyAssociationTier(combined) {
    if (combined == null || combined === "" || isNaN(Number(combined))) return "notSignificant";
    const score = Number(combined);
    if (score > 3) return "veryStrong";
    if (score >= 2 && score <= 3) return "stronglySuggestive";
    if (score >= 1 && score < 2) return "nominallySignificant";
    return "notSignificant";
}

function associationTierPasses(combined, filters) {
    const tier = classifyAssociationTier(combined);
    const f = filters && typeof filters === "object" ? filters : DEFAULT_ASSOCIATION_FILTERS;
    return f[tier] !== false;
}

function geneCombinedForFilter(phenoGenes, factorGeneEntry, geneName) {
    const phenoScore = phenoGenes && phenoGenes[geneName];
    if (phenoScore && phenoScore.combined != null && !isNaN(Number(phenoScore.combined))) {
        return Number(phenoScore.combined);
    }
    if (!factorGeneEntry) return null;
    const raw = factorGeneEntry.factor_value ?? factorGeneEntry.factorRelevance;
    if (raw != null && raw !== "" && !isNaN(Number(raw))) return Number(raw);
    return null;
}

/**
 * Drop phenotype/factor genes whose Combined score fails the association legend filters.
 * Factors left with no genes are removed; phenotypes left with no factors are removed.
 */
function filterFactorDataByAssociationFilters(factorData, filters) {
    const f = filters && typeof filters === "object" ? filters : DEFAULT_ASSOCIATION_FILTERS;
    const out = {};
    Object.keys(factorData || {}).forEach((phenotypeId) => {
        const bucket = factorData[phenotypeId];
        if (!bucket) return;
        const phenoGenes = bucket.genes || {};

        const factors = (Array.isArray(bucket.factors) ? bucket.factors : [])
            .map((factor) => {
                const genes = {};
                Object.keys(factor.genes || {}).forEach((gene) => {
                    const combined = geneCombinedForFilter(phenoGenes, factor.genes[gene], gene);
                    if (!associationTierPasses(combined, f)) return;
                    genes[gene] = factor.genes[gene];
                });
                if (!Object.keys(genes).length) return null;

                const allow = new Set(Object.keys(genes));
                const geneSets = {};
                Object.keys(factor.geneSets || {}).forEach((gsName) => {
                    const src = factor.geneSets[gsName] || {};
                    const members = Array.isArray(src.genes)
                        ? src.genes.filter((g) => allow.has(g))
                        : [];
                    geneSets[gsName] = { ...src, genes: members };
                });
                return { ...factor, genes, geneSets };
            })
            .filter(Boolean);

        if (!factors.length) return;

        const genes = {};
        factors.forEach((factor) => {
            Object.keys(factor.genes || {}).forEach((gene) => {
                if (genes[gene]) return;
                if (phenoGenes[gene]) {
                    genes[gene] = phenoGenes[gene];
                    return;
                }
                const v = factor.genes[gene].factorRelevance ?? factor.genes[gene].factor_value;
                genes[gene] = {
                    combined: v != null && !isNaN(Number(v)) ? Number(v) : null,
                    gwasSupport: null,
                    geneSetSupport: null,
                };
            });
        });

        out[phenotypeId] = {
            genes,
            factors,
            allFactors: factors,
        };
    });
    return out;
}

export {
    ASSOCIATION_TIER_IDS,
    DEFAULT_ASSOCIATION_FILTERS,
    associationTierPasses,
    classifyAssociationTier,
    filterFactorDataByAssociationFilters,
};
