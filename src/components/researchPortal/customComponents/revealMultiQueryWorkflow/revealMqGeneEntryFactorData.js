/**
 * Bridges genes-first entry point data into the existing `factorData[phenotype] = {genes, factors,
 * allFactors}` shape consumed by revealMqKgTransform.js / revealMqNetworkBuild.js /
 * FactorBaseRevealHeatmap2.vue. Gene<->gene-set membership is left empty (geneSets: {}) throughout
 * since it isn't reliably available from any of these APIs right now -- the existing KG/network
 * builders already fall back gracefully (dashed/linkage_fallback edges) when membership is
 * unknown, the same way they do today for hybrid-search factors lacking gene-set assignment.
 *
 * Two builders:
 * - buildFactorDataFromGeneEntry: single-bucket, from the whole-gene-list bayes_gene/pigean call
 *   alone (fallback source when hybrid-search is unavailable).
 * - mergePigeanFactorRowsIntoFactorData: the primary path -- takes factorData already normalized
 *   from a hybrid-search response (real phenotype names + real per-gene combined/gwas/functional
 *   scores) and replaces each phenotype's coarse single hybrid-search "factor" with the real
 *   gene-set-cluster breakdown from the per-phenotype pigean-factor endpoint, when available.
 */

const DEFAULT_BUCKET_LABEL = "Your gene list";

/**
 * Reshapes a bayes_gene/pigean response into a single-bucket factorData object.
 * @param {Object} pigeanResponse - raw response from fetchGenePigeanFactors.
 * @param {string[]} inputGenes - the original gene list, to flag which genes were user-supplied.
 * @param {{ bucketLabel?: string }} [options]
 * @returns {Object} factorData, e.g. { "Your gene list": { genes, factors, allFactors } }
 */
function buildFactorDataFromGeneEntry(pigeanResponse, inputGenes = [], { bucketLabel = DEFAULT_BUCKET_LABEL } = {}) {
    if (!pigeanResponse) return {};

    const factorRows = Array.isArray(pigeanResponse["pigean-factor"] && pigeanResponse["pigean-factor"].data)
        ? pigeanResponse["pigean-factor"].data
        : [];
    const geneFactorMap = pigeanResponse["gene-factor"] && typeof pigeanResponse["gene-factor"] === "object"
        ? pigeanResponse["gene-factor"]
        : {};
    const geneSetFactorMap = pigeanResponse["gene-set-factor"] && typeof pigeanResponse["gene-set-factor"] === "object"
        ? pigeanResponse["gene-set-factor"]
        : {};
    const geneScores = pigeanResponse.gene_scores && typeof pigeanResponse.gene_scores === "object"
        ? pigeanResponse.gene_scores
        : {};
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));

    const factors = factorRows.map((row) => {
        const factorId = row && (row.factor != null ? row.factor : row.cluster) != null
            ? String(row.factor != null ? row.factor : row.cluster)
            : "";
        const geneRows = Array.isArray(geneFactorMap[factorId]) ? geneFactorMap[factorId] : [];
        const geneSetRows = Array.isArray(geneSetFactorMap[factorId]) ? geneSetFactorMap[factorId] : [];

        const genes = {};
        geneRows.forEach((g) => {
            const gene = g && g.gene != null ? String(g.gene) : "";
            if (!gene) return;
            genes[gene] = {
                factorRelevance: g.factor_value != null ? Number(g.factor_value) : null,
                factor_value: g.factor_value != null ? Number(g.factor_value) : null,
                includedFromRequest: inputGeneSet.has(gene.toUpperCase()),
                geneSetIds: [], // unknown membership -- KG/network builders fall back gracefully
            };
        });

        const topGeneSets = geneSetRows.length
            ? geneSetRows.map((gs) => String(gs.gene_set || "")).filter(Boolean).join(";")
            : (row && row.top_gene_sets != null ? String(row.top_gene_sets) : "");

        return {
            factor: factorId,
            label: row && row.label != null ? String(row.label) : factorId,
            labelFromApi: row && row.label != null ? String(row.label) : null,
            top_gene_sets: topGeneSets,
            gene_set_description: "",
            gene_set_program: "",
            genes,
            geneSets: {}, // no known gene<->gene-set pairs; see module comment
        };
    });

    const phenotypeGenes = {};
    Object.keys(geneScores).forEach((gene) => {
        phenotypeGenes[gene] = {
            combined: Number(geneScores[gene]),
            gwasSupport: null,
            geneSetSupport: null,
        };
    });

    return {
        [bucketLabel]: {
            genes: phenotypeGenes,
            factors,
            allFactors: factors,
        },
    };
}

/**
 * Replaces each phenotype bucket's factors/allFactors -- which, coming straight out of
 * normalizeHybridFactorsToFactorData, is hybrid-search's own coarse single-factor-per-phenotype
 * shape in semantic-fallback mode -- with the real gene-set-cluster rows from the per-phenotype
 * pigean-factor endpoint (revealMqGeneEntryApi.js's fetchPigeanFactorsForTraits), when available.
 * Per-gene evidence (combined/gwas/functional support) comes from the phenotype-level `genes` map
 * hybrid-search already gave us; per-factor gene<->gene-set membership is still unknown (this
 * pairing has no API for that), so every factor of a phenotype gets the same phenotype-level gene
 * list attached. Falls back to keeping hybrid-search's own factor entry for any phenotype whose
 * per-phenotype fetch returned nothing (id-vocabulary mismatch is expected for some phenotypes).
 * @param {Object} factorData - output of normalizeHybridFactorsToFactorData.
 * @param {Object} perPhenotypeFactorRows - { [phenotype]: { ok, factors: [{factor, label, topGeneSets}] } }
 * @param {string[]} inputGenes - the original gene list, to flag which genes were user-supplied.
 */
function mergePigeanFactorRowsIntoFactorData(factorData, perPhenotypeFactorRows, inputGenes = []) {
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    const out = {};
    Object.keys(factorData || {}).forEach((phenotype) => {
        const bucket = factorData[phenotype];
        const rec = perPhenotypeFactorRows && perPhenotypeFactorRows[phenotype];
        if (!rec || !rec.ok || !Array.isArray(rec.factors) || !rec.factors.length) {
            out[phenotype] = bucket; // fallback: keep hybrid-search's own coarse factor(s)
            return;
        }
        const phenotypeGenes = bucket.genes || {};
        const factors = rec.factors.map((row) => {
            const genes = {};
            Object.keys(phenotypeGenes).forEach((gene) => {
                genes[gene] = {
                    factorRelevance: phenotypeGenes[gene].combined,
                    factor_value: phenotypeGenes[gene].combined,
                    includedFromRequest: inputGeneSet.has(gene.toUpperCase()),
                    geneSetIds: [],
                };
            });
            return {
                factor: row.factor,
                label: row.label || row.factor,
                labelFromApi: row.label || null,
                top_gene_sets: row.topGeneSets || "",
                gene_set_description: "",
                gene_set_program: "",
                genes,
                geneSets: {},
            };
        });
        out[phenotype] = { genes: phenotypeGenes, factors, allFactors: factors };
    });
    return out;
}

export { buildFactorDataFromGeneEntry, DEFAULT_BUCKET_LABEL, mergePigeanFactorRowsIntoFactorData };
