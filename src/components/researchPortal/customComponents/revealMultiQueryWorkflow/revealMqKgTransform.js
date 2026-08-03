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

function geneIsSearchAnchor(factorGeneEntry, globalGeneEntry) {
    if (factorGeneEntry && factorGeneEntry.includedFromRequest === true) return true;
    if (globalGeneEntry && globalGeneEntry.includedFromRequest === true) return true;
    return false;
}

/**
 * Compact phenotype / gene / gene-set JSON for hypothesis LLM prompts.
 * Same top-level shape as the richer summary, but gene entries only carry search/context role
 * (no Combined / GWAS / gene-set numeric scores).
 */
function serializeFactorDataForHypothesisPrompt(factorData) {
    const summary = {};
    Object.keys(factorData || {}).forEach((phenotype) => {
        const p = factorData[phenotype];
        if (!p) return;
        const geneSets = new Set();
        (p.factors || []).forEach((f) => {
            if (typeof f.top_gene_sets !== "string" || !f.top_gene_sets) return;
            f.top_gene_sets.split(";").forEach((s) => {
                const t = s.trim();
                if (t) geneSets.add(t);
            });
        });
        const genes = {};
        Object.keys(p.genes || {}).forEach((geneName) => {
            const g = p.genes[geneName] || {};
            const isSearch = g.includedFromRequest === true;
            genes[geneName] = {
                included_from_request: isSearch,
                role: isSearch ? "search" : "context",
            };
        });
        // Also include factor-only genes missing from the phenotype map (edge case).
        (p.factors || []).forEach((f) => {
            Object.keys(f.genes || {}).forEach((geneName) => {
                if (genes[geneName]) {
                    if (f.genes[geneName] && f.genes[geneName].includedFromRequest === true) {
                        genes[geneName].included_from_request = true;
                        genes[geneName].role = "search";
                    }
                    return;
                }
                const isSearch = !!(f.genes[geneName] && f.genes[geneName].includedFromRequest);
                genes[geneName] = {
                    included_from_request: isSearch,
                    role: isSearch ? "search" : "context",
                };
            });
        });
        summary[phenotype] = {
            gene_count: Object.keys(genes).length,
            search_gene_count: Object.keys(genes).filter((g) => genes[g].role === "search").length,
            context_gene_count: Object.keys(genes).filter((g) => genes[g].role === "context").length,
            merged_gene_sets: [...geneSets].sort(),
            genes,
        };
    });
    return JSON.stringify(summary, null, 2);
}

/**
 * @param {Object} mergedData - factorData: { [phenotype]: { genes: {}, factors: [] } }
 * @param {string} factorsKey - e.g. "factors"
 * @param {{ forHypothesisPrompt?: boolean }} [options]
 *   When forHypothesisPrompt is true: omit numeric score columns; label novelty from
 *   search vs context co-occurrence (includedFromRequest) instead of GWAS vs gene-set scores.
 * @returns {Array<{ subject, predicate, object, context }>}
 */
function transformMergedDataToKG(mergedData, factorsKey, options = {}) {
    const forHypothesisPrompt = !!(options && options.forHypothesisPrompt);
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
                    includedFromRequest: geneIsSearchAnchor(factorGenes[gName], (pData.genes || {})[gName]),
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
                let newCtx;
                if (forHypothesisPrompt) {
                    // Search genes = query anchors; co-occurring context genes = novel in this search.
                    newCtx = {
                        type: "PhenotypeToGene",
                        category: gene.includedFromRequest
                            ? "Search gene (query anchor)"
                            : "Functional (Novel)",
                        included_from_request: gene.includedFromRequest === true,
                    };
                } else {
                    const gwasSupport = globalGeneStats.gwasSupport;
                    const geneSetSupport = globalGeneStats.geneSetSupport;
                    const category = (gwasSupport != null && geneSetSupport != null && gwasSupport > geneSetSupport)
                        ? "Genetic (Established)"
                        : "Functional (Novel)";
                    newCtx = {
                        type: "PhenotypeToGene",
                        factor_relevance: gene.relevance,
                        combined_score: globalGeneStats.combined,
                        gwas_support: gwasSupport,
                        functional_support: geneSetSupport,
                        category,
                        included_from_request: gene.includedFromRequest === true,
                    };
                }
                const gKey = `${phenotypeName}\u0000${gene.name}`;
                const existing = phenoGeneTriple.get(gKey);
                if (forHypothesisPrompt) {
                    const preferNew =
                        !existing ||
                        (newCtx.included_from_request && !existing.context.included_from_request);
                    if (!existing) {
                        const t = {
                            subject: phenotypeName,
                            predicate: "contains_gene",
                            object: gene.name,
                            context: newCtx,
                        };
                        phenoGeneTriple.set(gKey, t);
                        triples.push(t);
                    } else if (preferNew) {
                        existing.context = newCtx;
                    }
                } else {
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

/**
 * Flattens KG triples into tabular rows (id, subject, predicate, object, context_*).
 * @param {Array} data - Array of { subject, predicate, object, context? } triples.
 * @returns {Array<Object>}
 */
function flattenKGData(data) {
    return (data || []).map((entry, index) => {
        const flattened = {
            id: index,
            subject: entry.subject ?? "",
            predicate: entry.predicate ?? "",
            object: entry.object ?? "",
        };
        if (entry.context && typeof entry.context === "object") {
            Object.keys(entry.context).forEach((key) => {
                const v = entry.context[key];
                flattened[`context_${key}`] =
                    v != null && typeof v === "object" ? JSON.stringify(v) : v != null ? String(v) : "";
            });
        }
        return flattened;
    });
}

/**
 * Converts flattened KG rows to a CSV string (header + rows, quoted as needed).
 * @param {Array<Object>} flattened
 * @returns {string}
 */
function flattenedKGToCSV(flattened) {
    if (!flattened || flattened.length === 0) return "";
    const escape = (val) => {
        const s = val == null ? "" : String(val);
        if (/[",\r\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
        return s;
    };
    const keys = Object.keys(flattened[0]);
    const header = keys.map(escape).join(",");
    const rows = flattened.map((row) => keys.map((k) => escape(row[k])).join(","));
    return [header, ...rows].join("\n");
}

/** Shared KG + phenotype/gene/gene-set summary block for mechanism hypothesis LLM prompts. */
function buildMechanismLlmContextBlock(kgBlock, phenoGeneSetSummary, researchContext) {
    return `**Knowledge graph (CSV):**\n\`\`\`\n${kgBlock}\n\`\`\`\n\n**Phenotype / genes / gene sets (from hybrid; clusters are not separate graph nodes):**\n\`\`\`json\n${phenoGeneSetSummary}\n\`\`\`\n\n**Research context:** ${researchContext}`;
}

export {
    buildMechanismLlmContextBlock,
    flattenKGData,
    flattenedKGToCSV,
    serializeFactorDataForHypothesisPrompt,
    transformMergedDataToKG,
};
