/**
 * Slim Raw-data export for the gene-set entry path.
 * Converts nested UI `factorData` into a compact factorization JSON
 * (flat factors, indexed gene-set membership) for download only.
 */

const RAW_EXPORT_SCHEMA_VERSION = 1;

function roundScore(value, digits = 6) {
    if (value == null || value === "" || Number.isNaN(Number(value))) return null;
    const f = 10 ** digits;
    return Math.round(Number(value) * f) / f;
}

function geneRelevance(entry) {
    if (!entry || typeof entry !== "object") return null;
    if (entry.factor_value != null && !Number.isNaN(Number(entry.factor_value))) {
        return Number(entry.factor_value);
    }
    if (entry.factorRelevance != null && !Number.isNaN(Number(entry.factorRelevance))) {
        return Number(entry.factorRelevance);
    }
    return null;
}

function sortGeneSymbols(symbols, geneMap, inputSet) {
    return [...symbols].sort((a, b) => {
        const aIn = inputSet.has(String(a).toUpperCase()) ? 1 : 0;
        const bIn = inputSet.has(String(b).toUpperCase()) ? 1 : 0;
        if (bIn !== aIn) return bIn - aIn;
        const aRel = Math.abs(Number(geneRelevance(geneMap[a]) || 0));
        const bRel = Math.abs(Number(geneRelevance(geneMap[b]) || 0));
        if (bRel !== aRel) return bRel - aRel;
        return String(a).localeCompare(String(b));
    });
}

/**
 * Build one slim factor record from a factorData phenotype/factor bucket.
 * @param {string} factorId
 * @param {Object} bucket
 * @param {Set<string>} inputSet uppercase input gene symbols
 */
function slimFactorFromBucket(factorId, bucket, inputSet) {
    const factorObj = (bucket && Array.isArray(bucket.factors) && bucket.factors[0]) || {};
    const geneMap = (factorObj.genes && typeof factorObj.genes === "object" ? factorObj.genes : null) ||
        (bucket && bucket.genes && typeof bucket.genes === "object" ? bucket.genes : {}) ||
        {};
    const geneSetMap =
        (factorObj.geneSets && typeof factorObj.geneSets === "object" ? factorObj.geneSets : {}) || {};

    const geneSymbols = sortGeneSymbols(Object.keys(geneMap), geneMap, inputSet);
    const indexByGene = new Map(geneSymbols.map((g, i) => [g, i]));

    const genes = geneSymbols.map((symbol) => {
        const g = geneMap[symbol] || {};
        const isInput =
            g.includedFromRequest === true || inputSet.has(String(symbol).toUpperCase());
        return {
            symbol,
            is_input: !!isInput,
            factor_relevance: roundScore(geneRelevance(g)),
            gene_score: roundScore(g.gene_score),
        };
    });

    const geneSets = Object.keys(geneSetMap)
        .sort((a, b) => {
            const av = Math.abs(Number((geneSetMap[a] && geneSetMap[a].factor_value) || 0));
            const bv = Math.abs(Number((geneSetMap[b] && geneSetMap[b].factor_value) || 0));
            return bv - av || String(a).localeCompare(String(b));
        })
        .map((name) => {
            const gs = geneSetMap[name] || {};
            const members = Array.isArray(gs.genes) ? gs.genes : [];
            const gene_indices = [
                ...new Set(
                    members
                        .map((m) => indexByGene.get(String(m)))
                        .filter((i) => i != null)
                ),
            ].sort((a, b) => a - b);
            return {
                name,
                factor_value: roundScore(gs.factor_value),
                gene_set_score: roundScore(gs.gene_set_score),
                p_value: gs.p_value != null && !Number.isNaN(Number(gs.p_value)) ? Number(gs.p_value) : null,
                gene_indices,
            };
        });

    const topLabel =
        (factorObj.factorLabel != null && String(factorObj.factorLabel).trim()) ||
        (geneSets[0] && geneSets[0].name) ||
        factorId;
    const overallGene = genes.reduce((m, g) => Math.max(m, Math.abs(Number(g.factor_relevance) || 0)), 0);
    const overallGs = geneSets.reduce((m, g) => Math.max(m, Math.abs(Number(g.factor_value) || 0)), 0);

    return {
        id: String(factorId),
        label: String(topLabel),
        rationale:
            (factorObj.rationale != null && String(factorObj.rationale).trim()) ||
            `Factorization cluster: ${topLabel}`,
        scores: {
            overall_gene_score: roundScore(overallGene),
            overall_gene_set_score: roundScore(overallGs),
        },
        genes,
        gene_sets: geneSets,
    };
}

/**
 * Convert gene-set entry `factorData` into the slim Raw-data export payload.
 * @param {Object} factorData
 * @param {{ inputGenes?: string[], source?: string, searchPath?: string }} [options]
 * @returns {Object|null} slim payload, or null when there is nothing to export
 */
function buildGeneSetEntryRawExport(factorData, options = {}) {
    const data = factorData && typeof factorData === "object" ? factorData : {};
    const factorIds = Object.keys(data);
    if (!factorIds.length) return null;

    const inputGenes = Array.isArray(options.inputGenes)
        ? options.inputGenes.map((g) => String(g)).filter(Boolean)
        : [];
    const inputSet = new Set(inputGenes.map((g) => g.toUpperCase()));

    const factors = factorIds
        .sort((a, b) => String(a).localeCompare(String(b), undefined, { numeric: true }))
        .map((id) => slimFactorFromBucket(id, data[id], inputSet));

    return {
        schema_version: RAW_EXPORT_SCHEMA_VERSION,
        source: options.source || "bayes_gene/pigean",
        search_path: options.searchPath || "genes",
        input_genes: inputGenes,
        factors,
    };
}

export { RAW_EXPORT_SCHEMA_VERSION, buildGeneSetEntryRawExport, roundScore };
