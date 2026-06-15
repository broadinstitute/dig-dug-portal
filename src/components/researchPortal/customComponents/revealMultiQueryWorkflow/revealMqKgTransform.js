/**
 * Transform merged factorData into flattened KG triples for mechanism LLM prompts.
 */

function ensureGeneSetMembers(factorObj, gsName, geneName) {
    if (!factorObj.geneSets) {
        factorObj.geneSets = {};
    }
    if (!factorObj.geneSets[gsName]) {
        factorObj.geneSets[gsName] = { genes: [] };
    }
    const gens = Array.isArray(factorObj.geneSets[gsName].genes)
        ? [...factorObj.geneSets[gsName].genes]
        : [];
    if (!gens.includes(geneName)) {
        gens.push(geneName);
        factorObj.geneSets[gsName].genes = gens;
    }
}

/**
 * @param {Object} mergedData - factorData: { [phenotype]: { genes: {}, factors: [] } }
 * @param {string} factorsKey - e.g. "factors"
 * @returns {Array<{ subject, predicate, object, context }>}
 */
function transformMergedDataToKG(mergedData, factorsKey) {
    const triples = [];
    const seenPhenoGs = new Set();
    const phenoGeneTriple = new Map();
    const seenGeneGs = new Set();

    Object.keys(mergedData || {}).forEach((phenotypeName) => {
        const pData = mergedData[phenotypeName];
        if (!pData || !Array.isArray(pData[factorsKey])) return;

        pData[factorsKey].forEach((factorObj) => {
            const geneSets = (typeof factorObj.top_gene_sets === "string" && factorObj.top_gene_sets)
                ? factorObj.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                : [];

            geneSets.forEach((gsName) => {
                const pgKey = `${phenotypeName}\u0000${gsName}`;
                if (seenPhenoGs.has(pgKey)) return;
                seenPhenoGs.add(pgKey);
                triples.push({
                    subject: phenotypeName,
                    predicate: "associated_with",
                    object: gsName,
                    context: { type: "PhenotypeToGeneSet" },
                });
            });

            const factorGenes = factorObj.genes || {};
            const genesInFactor = Object.keys(factorGenes)
                .map((gName) => ({
                    name: gName,
                    relevance: factorGenes[gName] && factorGenes[gName].factorRelevance != null
                        ? factorGenes[gName].factorRelevance
                        : 0,
                    includedFromRequest: !!(factorGenes[gName] && factorGenes[gName].includedFromRequest),
                }))
                .sort((a, b) => {
                    if (b.includedFromRequest !== a.includedFromRequest) {
                        return (b.includedFromRequest ? 1 : 0) - (a.includedFromRequest ? 1 : 0);
                    }
                    return Math.abs(b.relevance) - Math.abs(a.relevance);
                });

            const globalGenes = pData.genes || {};

            genesInFactor.forEach((gene) => {
                const globalGeneStats = globalGenes[gene.name] || {};
                const gwasSupport = globalGeneStats.gwasSupport;
                const geneSetSupport = globalGeneStats.geneSetSupport;
                const category = (gwasSupport != null && geneSetSupport != null && gwasSupport > geneSetSupport)
                    ? "Genetic (Established)"
                    : "Functional (Novel)";

                const newCtx = {
                    type: "PhenotypeToGene",
                    factor_relevance: gene.relevance,
                    combined_score: globalGeneStats.combined,
                    gwas_support: gwasSupport,
                    functional_support: geneSetSupport,
                    category,
                    included_from_request: gene.includedFromRequest === true,
                };
                const gKey = `${phenotypeName}\u0000${gene.name}`;
                const existing = phenoGeneTriple.get(gKey);
                const scoreNew = newCtx.combined_score != null && !isNaN(Number(newCtx.combined_score))
                    ? Number(newCtx.combined_score)
                    : -Infinity;
                const scoreOld = existing && existing.context.combined_score != null
                    ? Number(existing.context.combined_score)
                    : -Infinity;
                if (!existing) {
                    const t = {
                        subject: phenotypeName,
                        predicate: "contains_gene",
                        object: gene.name,
                        context: newCtx,
                    };
                    phenoGeneTriple.set(gKey, t);
                    triples.push(t);
                } else if (scoreNew > scoreOld) {
                    existing.context = newCtx;
                }

                const factorGeneSets = factorObj.geneSets || {};
                let geneLinkedToSomePathway = false;
                geneSets.forEach((gsName) => {
                    const members = factorGeneSets[gsName] && Array.isArray(factorGeneSets[gsName].genes)
                        ? factorGeneSets[gsName].genes
                        : [];
                    if (!members.includes(gene.name)) return;
                    geneLinkedToSomePathway = true;
                    const ggKey = `${gene.name}\u0000${gsName}`;
                    if (seenGeneGs.has(ggKey)) return;
                    seenGeneGs.add(ggKey);
                    triples.push({
                        subject: gene.name,
                        predicate: "contributes_to_pathway",
                        object: gsName,
                        context: {
                            type: "GeneToPathway",
                            context_phenotype: phenotypeName,
                        },
                    });
                });
                if (!geneLinkedToSomePathway && geneSets.length > 0) {
                    const fallbackGs = geneSets[0];
                    ensureGeneSetMembers(factorObj, fallbackGs, gene.name);
                    const ggKey = `${gene.name}\u0000${fallbackGs}`;
                    if (!seenGeneGs.has(ggKey)) {
                        seenGeneGs.add(ggKey);
                        triples.push({
                            subject: gene.name,
                            predicate: "contributes_to_pathway",
                            object: fallbackGs,
                            context: {
                                type: "GeneToPathway",
                                context_phenotype: phenotypeName,
                                linkage_fallback: true,
                            },
                        });
                    }
                }
            });
        });
    });

    return triples;
}

export { transformMergedDataToKG };
