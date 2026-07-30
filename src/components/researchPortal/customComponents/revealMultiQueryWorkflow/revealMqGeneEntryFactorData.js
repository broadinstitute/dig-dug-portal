/**
 * Builds canonical factorData from genes-first per-phenotype pigean fetches:
 *   phenotype → genes → factors   (pigean-gene-phenotype)
 *   phenotype → gene sets → factors (pigean-gene-set-phenotype)
 *   phenotype + gene set → genes  (pigean-joined-gene-set)
 *
 * Output shape matches the text-query path so FactorBaseRevealHeatmap2 / KG / network
 * consume it unchanged: factorData[phenotype] = { genes, factors, allFactors }.
 *
 * Heatmap axes (normal component): rows = factors, columns = gene sets then genes.
 */

const DEFAULT_MAX_GENE_SETS = 30;
const DEFAULT_MAX_GENES = 50;
const DEFAULT_MAX_FACTORS = 5;
/** Gene sets with beta at or below this threshold are treated as non-significant. */
const DEFAULT_MIN_GENE_SET_BETA = 0.01;

/** True when gene-set beta is present and strictly greater than the significance floor. */
function isSignificantGeneSetBeta(beta, minBeta = DEFAULT_MIN_GENE_SET_BETA) {
    if (beta == null || isNaN(Number(beta))) return false;
    return Number(beta) > Number(minBeta);
}

/**
 * Keep only gene-set rows whose beta exceeds the significance floor.
 * Missing/non-numeric beta is treated as non-significant.
 */
function filterSignificantGeneSetRows(geneSetRows, { minBeta = DEFAULT_MIN_GENE_SET_BETA } = {}) {
    return (Array.isArray(geneSetRows) ? geneSetRows : []).filter(
        (row) => row && row.geneSet && isSignificantGeneSetBeta(row.beta, minBeta)
    );
}

/**
 * When pigean gene / gene-set rows omit `factor` (common for some gcat traits), use the
 * phenotype/trait id as the factor so we still get one phenotype×genes/gene-sets row.
 */
function fillMissingFactorWithTrait(geneRows, geneSetRows, phenotypeId) {
    const traitFactor = String(phenotypeId || "").trim();
    if (!traitFactor) {
        return {
            geneRows: Array.isArray(geneRows) ? geneRows : [],
            geneSetRows: Array.isArray(geneSetRows) ? geneSetRows : [],
        };
    }
    const filledGeneRows = (Array.isArray(geneRows) ? geneRows : []).map((row) => {
        if (!row || row.factor) return row;
        return {
            ...row,
            factor: traitFactor,
            label: row.label || traitFactor,
        };
    });
    const filledGeneSetRows = (Array.isArray(geneSetRows) ? geneSetRows : []).map((row) => {
        if (!row || row.factor) return row;
        return {
            ...row,
            factor: traitFactor,
            label: row.label || traitFactor,
        };
    });
    return { geneRows: filledGeneRows, geneSetRows: filledGeneSetRows };
}

/**
 * Top N factor ids for a phenotype. Prefers factors that contain search genes (ranked by
 * max combined among those genes); falls back to max gene-set rs_score on the factor.
 */
function selectTopFactorIds(geneRows, geneSetRows, inputGenes = [], { limit = DEFAULT_MAX_FACTORS } = {}) {
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    const byFactor = new Map(); // factorId -> { geneScore, geneSetScore, hasSearchGene }

    const ensure = (factorId) => {
        if (!byFactor.has(factorId)) {
            byFactor.set(factorId, { geneScore: -Infinity, geneSetScore: -Infinity, hasSearchGene: false });
        }
        return byFactor.get(factorId);
    };

    (Array.isArray(geneRows) ? geneRows : []).forEach((row) => {
        if (!row || !row.factor || !row.gene) return;
        const f = ensure(String(row.factor));
        const isSearch = !inputGeneSet.size || inputGeneSet.has(String(row.gene).toUpperCase());
        if (!isSearch) return;
        f.hasSearchGene = inputGeneSet.size ? true : f.hasSearchGene;
        const v = row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : -Infinity;
        if (v > f.geneScore) f.geneScore = v;
    });

    (Array.isArray(geneSetRows) ? geneSetRows : []).forEach((row) => {
        if (!row || !row.factor || !row.geneSet) return;
        const f = ensure(String(row.factor));
        const v = row.rsScore != null && !isNaN(Number(row.rsScore)) ? Number(row.rsScore) : -Infinity;
        if (v > f.geneSetScore) f.geneSetScore = v;
    });

    const ranked = Array.from(byFactor.entries()).map(([factorId, s]) => ({
        factorId,
        hasSearchGene: !!s.hasSearchGene,
        // Primary sort key: search-gene combined when present, else gene-set rs_score.
        score: s.geneScore > -Infinity ? s.geneScore : s.geneSetScore,
    }));

    ranked.sort((a, b) => {
        if (a.hasSearchGene !== b.hasSearchGene) return a.hasSearchGene ? -1 : 1;
        return b.score - a.score;
    });
    return ranked.slice(0, limit).map((r) => r.factorId);
}

/**
 * Top N gene-set names by rs_score from pigean-gene-set-phenotype rows.
 * Only considers factor-assigned rows with significant beta (default: beta > 0.01).
 * Optional `factorIds` restricts to those factors.
 */
function selectTopGeneSetsFromRows(
    geneSetRows,
    {
        limit = DEFAULT_MAX_GENE_SETS,
        factorIds = null,
        minBeta = DEFAULT_MIN_GENE_SET_BETA,
    } = {}
) {
    const factorAllow = factorIds == null
        ? null
        : new Set((Array.isArray(factorIds) ? factorIds : []).map((id) => String(id)));
    const best = new Map();
    filterSignificantGeneSetRows(geneSetRows, { minBeta }).forEach((row) => {
        if (!row || !row.geneSet || !row.factor) return;
        if (factorAllow && !factorAllow.has(String(row.factor))) return;
        const score = row.rsScore != null && !isNaN(Number(row.rsScore)) ? Number(row.rsScore) : -Infinity;
        const prev = best.get(row.geneSet);
        if (!prev || score > prev.score) {
            best.set(row.geneSet, { geneSet: row.geneSet, score });
        }
    });
    return Array.from(best.values())
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((r) => r.geneSet);
}

/**
 * Restrict gene rows to the user's search genes only. If no search genes are provided,
 * falls back to a top-N-by-combined cap so the matrix stays renderable.
 */
function scopeGeneRows(geneRows, inputGenes, maxGenes = DEFAULT_MAX_GENES) {
    const rows = (Array.isArray(geneRows) ? geneRows : []).filter((r) => r && r.gene);
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    if (inputGeneSet.size) {
        return rows.filter((r) => inputGeneSet.has(String(r.gene).toUpperCase()));
    }
    const bestByGene = new Map();
    rows.forEach((r) => {
        const v = r.combined != null && !isNaN(Number(r.combined)) ? Number(r.combined) : -Infinity;
        if (!bestByGene.has(r.gene) || v > bestByGene.get(r.gene)) bestByGene.set(r.gene, v);
    });
    if (bestByGene.size <= maxGenes) return rows;
    const top = new Set(
        Array.from(bestByGene.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, maxGenes)
            .map(([gene]) => gene)
    );
    return rows.filter((r) => top.has(r.gene));
}

/**
 * Post-merge filter: keep only search/input genes in phenotype.genes and factor.genes.
 * Gene-set membership lists stay intact so a later step can discover context genes
 * that cross survived gene sets.
 */
function filterFactorDataToSearchGenes(factorData, inputGenes = []) {
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    if (!inputGeneSet.size) return factorData || {};

    const out = {};
    Object.keys(factorData || {}).forEach((phenotypeId) => {
        const bucket = factorData[phenotypeId];
        if (!bucket) return;

        const genes = {};
        Object.keys(bucket.genes || {}).forEach((gene) => {
            if (inputGeneSet.has(String(gene).toUpperCase())) genes[gene] = bucket.genes[gene];
        });

        const factors = (Array.isArray(bucket.factors) ? bucket.factors : []).map((factor) => {
            const factorGenes = {};
            Object.keys(factor.genes || {}).forEach((gene) => {
                if (!inputGeneSet.has(String(gene).toUpperCase())) return;
                const entry = { ...factor.genes[gene] };
                entry.includedFromRequest = true;
                factorGenes[gene] = entry;
            });
            // Preserve full membership lists (needed for context-gene crossing).
            const geneSets = {};
            Object.keys(factor.geneSets || {}).forEach((gsName) => {
                const src = factor.geneSets[gsName] || {};
                geneSets[gsName] = {
                    genes: Array.isArray(src.genes) ? src.genes.slice() : [],
                    memberCombined:
                        src.memberCombined && typeof src.memberCombined === "object"
                            ? { ...src.memberCombined }
                            : {},
                };
            });
            return { ...factor, genes: factorGenes, geneSets };
        });

        out[phenotypeId] = {
            genes,
            factors,
            allFactors: factors,
            // Keep full gene-phenotype score lookup until context-gene attach.
            _genePhenotypeScores: bucket._genePhenotypeScores || null,
        };
    });
    return out;
}

/**
 * Index already-fetched pigean-gene-phenotype rows so context-gene attach can fill
 * Combined / GWAS / Gene-set support without another HTTP call.
 * @returns {{ byGene: Object<string, {combined, gwasSupport, geneSetSupport}>, byGeneFactor: Object<string, {combined, gwasSupport, geneSetSupport}> }}
 */
function buildGenePhenotypeScoreLookup(geneRows) {
    const byGene = {};
    const byGeneFactor = {};
    const mergeMax = (prev, next) => {
        const base = prev || { combined: null, gwasSupport: null, geneSetSupport: null };
        const pick = (a, b) => {
            if (a == null) return b;
            if (b == null) return a;
            return Math.max(a, b);
        };
        return {
            combined: pick(base.combined, next.combined),
            gwasSupport: pick(base.gwasSupport, next.gwasSupport),
            geneSetSupport: pick(base.geneSetSupport, next.geneSetSupport),
        };
    };
    (Array.isArray(geneRows) ? geneRows : []).forEach((row) => {
        if (!row || !row.gene) return;
        const scores = {
            combined: row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : null,
            gwasSupport: row.gwasSupport != null && !isNaN(Number(row.gwasSupport)) ? Number(row.gwasSupport) : null,
            geneSetSupport: row.geneSetSupport != null && !isNaN(Number(row.geneSetSupport)) ? Number(row.geneSetSupport) : null,
        };
        if (scores.combined == null && scores.gwasSupport == null && scores.geneSetSupport == null) return;
        byGene[row.gene] = mergeMax(byGene[row.gene], scores);
        if (row.factor) {
            const key = `${row.gene}\t${String(row.factor)}`;
            byGeneFactor[key] = mergeMax(byGeneFactor[key], scores);
        }
    });
    return { byGene, byGeneFactor };
}

/**
 * After search-gene filtering + prune: among survived gene sets, find genes that appear
 * in ≥2 gene sets (crossing / context genes) and attach them to factors that contain
 * those gene sets. Search genes are left unchanged (`includedFromRequest: true`).
 * Phenotype-level Combined / GWAS / Gene-set support are filled from saved
 * pigean-gene-phenotype rows when present (`_genePhenotypeScores`).
 */
function attachCrossingContextGenes(factorData, inputGenes = [], { minGeneSetCrossings = 2 } = {}) {
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    const out = {};

    Object.keys(factorData || {}).forEach((phenotypeId) => {
        const bucket = factorData[phenotypeId];
        if (!bucket) return;

        const scoreLookup = bucket._genePhenotypeScores || { byGene: {}, byGeneFactor: {} };
        const byGene = scoreLookup.byGene || {};
        const byGeneFactor = scoreLookup.byGeneFactor || {};

        // Union membership across survived factors: geneSet -> Set(genes), gene -> combined.
        const membersByGeneSet = new Map();
        const membershipCombinedByGene = new Map();
        (Array.isArray(bucket.factors) ? bucket.factors : []).forEach((factor) => {
            Object.keys(factor.geneSets || {}).forEach((gsName) => {
                const src = factor.geneSets[gsName] || {};
                const members = Array.isArray(src.genes) ? src.genes : [];
                if (!membersByGeneSet.has(gsName)) membersByGeneSet.set(gsName, new Set());
                const set = membersByGeneSet.get(gsName);
                members.forEach((gene) => {
                    if (!gene) return;
                    set.add(gene);
                    const score =
                        src.memberCombined && src.memberCombined[gene] != null && !isNaN(Number(src.memberCombined[gene]))
                            ? Number(src.memberCombined[gene])
                            : null;
                    if (score == null) return;
                    const prev = membershipCombinedByGene.get(gene);
                    membershipCombinedByGene.set(gene, prev == null ? score : Math.max(prev, score));
                });
            });
        });

        const geneSetCountByGene = new Map();
        membersByGeneSet.forEach((members) => {
            members.forEach((gene) => {
                geneSetCountByGene.set(gene, (geneSetCountByGene.get(gene) || 0) + 1);
            });
        });

        const contextGenes = new Set();
        geneSetCountByGene.forEach((count, gene) => {
            if (count < minGeneSetCrossings) return;
            if (inputGeneSet.has(String(gene).toUpperCase())) return;
            contextGenes.add(gene);
        });

        const factors = (Array.isArray(bucket.factors) ? bucket.factors : []).map((factor) => {
            const factorGenes = { ...(factor.genes || {}) };
            const factorId = factor.factor != null ? String(factor.factor) : "";
            contextGenes.forEach((gene) => {
                const memberOf = [];
                Object.keys(factor.geneSets || {}).forEach((gsName) => {
                    const members = (factor.geneSets[gsName] && factor.geneSets[gsName].genes) || [];
                    if (members.includes(gene)) memberOf.push(gsName);
                });
                if (!memberOf.length) return;
                if (factorGenes[gene] && factorGenes[gene].includedFromRequest) return;
                const factorScores = factorId ? byGeneFactor[`${gene}\t${factorId}`] : null;
                const phenoScores = byGene[gene];
                const membershipCombined = membershipCombinedByGene.has(gene)
                    ? membershipCombinedByGene.get(gene)
                    : null;
                const combined =
                    (factorScores && factorScores.combined != null)
                        ? factorScores.combined
                        : (phenoScores && phenoScores.combined != null)
                            ? phenoScores.combined
                            : membershipCombined;
                factorGenes[gene] = {
                    factorRelevance: combined,
                    factor_value: combined,
                    includedFromRequest: false,
                    geneSetIds: memberOf,
                };
            });
            return { ...factor, genes: factorGenes };
        });

        const genes = { ...(bucket.genes || {}) };
        contextGenes.forEach((gene) => {
            const phenoScores = byGene[gene] || {};
            const membershipCombined = membershipCombinedByGene.has(gene)
                ? membershipCombinedByGene.get(gene)
                : null;
            const fromSaved = {
                combined: phenoScores.combined != null ? phenoScores.combined : membershipCombined,
                gwasSupport: phenoScores.gwasSupport != null ? phenoScores.gwasSupport : null,
                geneSetSupport: phenoScores.geneSetSupport != null ? phenoScores.geneSetSupport : null,
            };
            if (genes[gene] != null) {
                // Prefer saved gene-phenotype scores when the stub lacked them.
                genes[gene] = {
                    combined: genes[gene].combined != null ? genes[gene].combined : fromSaved.combined,
                    gwasSupport: genes[gene].gwasSupport != null ? genes[gene].gwasSupport : fromSaved.gwasSupport,
                    geneSetSupport: genes[gene].geneSetSupport != null ? genes[gene].geneSetSupport : fromSaved.geneSetSupport,
                };
                return;
            }
            genes[gene] = fromSaved;
        });
        // Drop phenotype-level genes that no longer appear on any factor after attach.
        const genesOnFactors = new Set();
        factors.forEach((f) => Object.keys(f.genes || {}).forEach((g) => genesOnFactors.add(g)));
        Object.keys(genes).forEach((gene) => {
            if (!genesOnFactors.has(gene)) delete genes[gene];
        });

        out[phenotypeId] = {
            genes,
            factors,
            allFactors: factors,
        };
    });

    return out;
}

/**
 * After search-gene filtering:
 * 1. Drop factors that have no remaining search genes (no gene crossing).
 * 2. Drop gene sets that are not on any remaining factor (orphan columns).
 * 3. Drop phenotypes left with no factors.
 */
function pruneFactorsWithoutSearchGeneCrossings(factorData) {
    const out = {};
    Object.keys(factorData || {}).forEach((phenotypeId) => {
        const bucket = factorData[phenotypeId];
        if (!bucket) return;

        const keptFactors = (Array.isArray(bucket.factors) ? bucket.factors : [])
            .filter((factor) => factor && Object.keys(factor.genes || {}).length > 0)
            .map((factor) => {
                // top_gene_sets / geneSets on this factor are already its own; keep as-is.
                // Orphans across the phenotype are handled by only emitting kept factors.
                const topIds = (typeof factor.top_gene_sets === "string" && factor.top_gene_sets)
                    ? factor.top_gene_sets.split(";").map((s) => s.trim()).filter(Boolean)
                    : Object.keys(factor.geneSets || {});
                const geneSets = {};
                topIds.forEach((gsName) => {
                    geneSets[gsName] = (factor.geneSets && factor.geneSets[gsName])
                        ? factor.geneSets[gsName]
                        : { genes: [] };
                });
                // Also keep any geneSets keys not listed in top_gene_sets (defensive).
                Object.keys(factor.geneSets || {}).forEach((gsName) => {
                    if (!geneSets[gsName]) geneSets[gsName] = factor.geneSets[gsName];
                });
                return {
                    ...factor,
                    top_gene_sets: Object.keys(geneSets).join(";"),
                    geneSets,
                };
            });

        if (!keptFactors.length) return;

        const genesOnKeptFactors = new Set();
        keptFactors.forEach((f) => {
            Object.keys(f.genes || {}).forEach((g) => genesOnKeptFactors.add(g));
        });
        const genes = {};
        Object.keys(bucket.genes || {}).forEach((gene) => {
            if (genesOnKeptFactors.has(gene)) genes[gene] = bucket.genes[gene];
        });

        out[phenotypeId] = {
            genes,
            factors: keptFactors,
            allFactors: keptFactors,
            _genePhenotypeScores: bucket._genePhenotypeScores || null,
        };
    });
    return out;
}

/**
 * @param {Array<{
 *   phenotypeId: string,
 *   geneRows: Array<{gene, factor, label, combined}>,
 *   geneSetRows: Array<{geneSet, factor, label, rsScore, beta?, description?, program?}>,
 *   membershipByGeneSet?: Object<string, Array<{gene, combined}>>,
 *   selectedFactorIds?: string[]
 * }>} phenotypeBundles
 * @param {string[]} inputGenes
 * @param {{ maxGeneSets?: number, maxGenes?: number, maxFactors?: number, minGeneSetBeta?: number }} [options]
 * @returns {Object} factorData
 */
function buildFactorDataFromPhenotypePigean(
    phenotypeBundles,
    inputGenes = [],
    {
        maxGeneSets = DEFAULT_MAX_GENE_SETS,
        maxGenes = DEFAULT_MAX_GENES,
        maxFactors = DEFAULT_MAX_FACTORS,
        minGeneSetBeta = DEFAULT_MIN_GENE_SET_BETA,
    } = {}
) {
    const inputGeneSet = new Set((Array.isArray(inputGenes) ? inputGenes : []).map((g) => String(g).toUpperCase()));
    const out = {};

    (Array.isArray(phenotypeBundles) ? phenotypeBundles : []).forEach((bundle) => {
        if (!bundle || !bundle.phenotypeId) return;
        const phenotypeId = String(bundle.phenotypeId);
        const filled = fillMissingFactorWithTrait(bundle.geneRows, bundle.geneSetRows, phenotypeId);
        const geneRows = filled.geneRows;
        // Drop non-significant gene sets (beta ≤ floor). If none remain, drop the trait.
        const geneSetRows = filterSignificantGeneSetRows(filled.geneSetRows, { minBeta: minGeneSetBeta });
        if (!geneSetRows.length) return;
        const scopedGeneRows = scopeGeneRows(geneRows, inputGenes, maxGenes);
        const topFactorIds = Array.isArray(bundle.selectedFactorIds) && bundle.selectedFactorIds.length
            ? bundle.selectedFactorIds.map(String)
            : selectTopFactorIds(geneRows, geneSetRows, inputGenes, { limit: maxFactors });
        const topFactorAllow = new Set(topFactorIds);
        const selectedGeneSetNames = new Set(
            selectTopGeneSetsFromRows(geneSetRows, {
                limit: maxGeneSets,
                factorIds: topFactorIds,
                minBeta: minGeneSetBeta,
            })
        );
        // Defensive: trait must still have at least one selected significant gene set.
        if (!selectedGeneSetNames.size) return;
        const scopedGeneSetRows = (Array.isArray(geneSetRows) ? geneSetRows : []).filter(
            (r) => r && r.geneSet && selectedGeneSetNames.has(r.geneSet) && topFactorAllow.has(String(r.factor))
        );
        const geneRowsOnTopFactors = scopedGeneRows.filter(
            (r) => r.factor && topFactorAllow.has(String(r.factor))
        );
        if (!geneRowsOnTopFactors.length && !scopedGeneSetRows.length) return;

        const membershipByGeneSet = bundle.membershipByGeneSet && typeof bundle.membershipByGeneSet === "object"
            ? bundle.membershipByGeneSet
            : {};

        const factorsById = new Map();
        const ensureFactor = (factorId) => {
            if (!topFactorAllow.has(factorId)) return null;
            if (!factorsById.has(factorId)) {
                factorsById.set(factorId, {
                    factor: factorId,
                    label: factorId,
                    labelFromApi: null,
                    topGeneSetIds: [],
                    geneSetMeta: {},
                    genes: {},
                    geneSets: {},
                });
            }
            return factorsById.get(factorId);
        };

        geneRowsOnTopFactors.forEach((row) => {
            const factorId = row.factor ? String(row.factor) : "";
            if (!factorId) return;
            const f = ensureFactor(factorId);
            if (!f) return;
            if (row.label) {
                f.label = String(row.label);
                f.labelFromApi = String(row.label);
            }
            const combined = row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : null;
            f.genes[row.gene] = {
                factorRelevance: combined,
                factor_value: combined,
                includedFromRequest: inputGeneSet.has(String(row.gene).toUpperCase()),
                geneSetIds: [],
            };
        });

        scopedGeneSetRows.forEach((row) => {
            const factorId = row.factor ? String(row.factor) : "";
            if (!factorId) return;
            const f = ensureFactor(factorId);
            if (!f) return;
            if (row.label && (f.label === f.factor || !f.labelFromApi)) {
                f.label = String(row.label);
                f.labelFromApi = String(row.label);
            }
            if (!f.topGeneSetIds.includes(row.geneSet)) f.topGeneSetIds.push(row.geneSet);
            f.geneSetMeta[row.geneSet] = {
                description: row.description || "",
                program: row.program || "",
            };
            if (!f.geneSets[row.geneSet]) f.geneSets[row.geneSet] = { genes: [] };
        });

        // Attach membership from pigean-joined-gene-set.
        // Keep FULL membership on geneSets (for later context-gene discovery);
        // only search/input genes are added to factor.genes here.
        factorsById.forEach((f) => {
            f.topGeneSetIds.forEach((gsName) => {
                const members = Array.isArray(membershipByGeneSet[gsName]) ? membershipByGeneSet[gsName] : [];
                if (!f.geneSets[gsName]) f.geneSets[gsName] = { genes: [], memberCombined: {} };
                if (!f.geneSets[gsName].memberCombined) f.geneSets[gsName].memberCombined = {};
                const geneList = f.geneSets[gsName].genes;
                const memberCombined = f.geneSets[gsName].memberCombined;
                members.forEach((m) => {
                    if (!m || !m.gene) return;
                    if (!geneList.includes(m.gene)) geneList.push(m.gene);
                    if (m.combined != null && !isNaN(Number(m.combined))) {
                        memberCombined[m.gene] = Number(m.combined);
                    }
                    // Search genes only on the factor gene map for now.
                    if (!inputGeneSet.has(String(m.gene).toUpperCase())) return;
                    if (f.genes[m.gene]) {
                        const ids = f.genes[m.gene].geneSetIds;
                        if (!ids.includes(gsName)) ids.push(gsName);
                    } else {
                        const combined = m.combined != null && !isNaN(Number(m.combined)) ? Number(m.combined) : null;
                        f.genes[m.gene] = {
                            factorRelevance: combined,
                            factor_value: combined,
                            includedFromRequest: true,
                            geneSetIds: [gsName],
                        };
                    }
                });
            });
        });

        if (!factorsById.size) return;

        const phenotypeGenes = {};
        geneRowsOnTopFactors.forEach((row) => {
            const combined = row.combined != null && !isNaN(Number(row.combined)) ? Number(row.combined) : null;
            const gwasSupport = row.gwasSupport != null && !isNaN(Number(row.gwasSupport)) ? Number(row.gwasSupport) : null;
            const geneSetSupport = row.geneSetSupport != null && !isNaN(Number(row.geneSetSupport)) ? Number(row.geneSetSupport) : null;
            if (combined == null && gwasSupport == null && geneSetSupport == null) return;
            const prev = phenotypeGenes[row.gene];
            if (!prev) {
                phenotypeGenes[row.gene] = { combined, gwasSupport, geneSetSupport };
                return;
            }
            // Keep the best of each score independently when a gene appears on multiple factors.
            phenotypeGenes[row.gene] = {
                combined: prev.combined == null ? combined : (combined == null ? prev.combined : Math.max(prev.combined, combined)),
                gwasSupport: prev.gwasSupport == null ? gwasSupport : (gwasSupport == null ? prev.gwasSupport : Math.max(prev.gwasSupport, gwasSupport)),
                geneSetSupport: prev.geneSetSupport == null ? geneSetSupport : (geneSetSupport == null ? prev.geneSetSupport : Math.max(prev.geneSetSupport, geneSetSupport)),
            };
        });
        // Also surface input genes attached only via membership.
        factorsById.forEach((f) => {
            Object.keys(f.genes).forEach((gene) => {
                if (phenotypeGenes[gene] != null) return;
                const v = f.genes[gene].factorRelevance;
                phenotypeGenes[gene] = {
                    combined: v != null ? v : null,
                    gwasSupport: null,
                    geneSetSupport: null,
                };
            });
        });

        const factors = Array.from(factorsById.values()).map((f) => {
            const descriptions = f.topGeneSetIds
                .map((gs) => (f.geneSetMeta[gs] && f.geneSetMeta[gs].description) || "")
                .filter(Boolean);
            const programs = f.topGeneSetIds
                .map((gs) => (f.geneSetMeta[gs] && f.geneSetMeta[gs].program) || "")
                .filter(Boolean);
            return {
                factor: f.factor,
                label: f.label || f.factor,
                labelFromApi: f.labelFromApi,
                top_gene_sets: f.topGeneSetIds.join(";"),
                gene_set_description: descriptions[0] || "",
                gene_set_program: programs[0] || "",
                genes: f.genes,
                geneSets: f.geneSets,
            };
        });

        out[phenotypeId] = {
            genes: phenotypeGenes,
            factors,
            allFactors: factors,
            // Full pigean-gene-phenotype scores (all genes) for context-gene header fill.
            _genePhenotypeScores: buildGenePhenotypeScoreLookup(geneRows),
        };
    });

    // Final pass: search-gene filter → prune empty factors → attach crossing context genes.
    return attachCrossingContextGenes(
        pruneFactorsWithoutSearchGeneCrossings(filterFactorDataToSearchGenes(out, inputGenes)),
        inputGenes
    );
}

export {
    DEFAULT_MAX_GENE_SETS,
    DEFAULT_MAX_GENES,
    DEFAULT_MAX_FACTORS,
    DEFAULT_MIN_GENE_SET_BETA,
    attachCrossingContextGenes,
    buildFactorDataFromPhenotypePigean,
    buildGenePhenotypeScoreLookup,
    fillMissingFactorWithTrait,
    filterFactorDataToSearchGenes,
    filterSignificantGeneSetRows,
    isSignificantGeneSetBeta,
    pruneFactorsWithoutSearchGeneCrossings,
    scopeGeneRows,
    selectTopFactorIds,
    selectTopGeneSetsFromRows,
};
