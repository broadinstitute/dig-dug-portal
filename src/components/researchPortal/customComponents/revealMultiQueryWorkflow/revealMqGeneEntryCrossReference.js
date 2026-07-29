/**
 * Pure top-N selection and cross-referencing logic for the genes-first entry point. Operates on
 * raw responses from revealMqGeneEntryApi.js -- no vm dependency.
 */

function parseGeneSetString(str) {
    return String(str || "")
        .split(";")
        .map((s) => s.trim())
        .filter(Boolean);
}

/** Top N traits from a bayes_gene/phenotypes response, sorted ascending by p_value (most significant first). */
function selectTopTraits(phenotypesResponse, { limit = 15 } = {}) {
    const rows = Array.isArray(phenotypesResponse && phenotypesResponse.phenotypes)
        ? phenotypesResponse.phenotypes
        : [];
    return rows
        .filter((r) => r && r.phenotype != null)
        .map((r) => ({ trait: String(r.phenotype), pValue: Number(r.p_value) }))
        .sort((a, b) => a.pValue - b.pValue)
        .slice(0, limit)
        .map((r, idx) => ({ ...r, rank: idx + 1 }));
}

/**
 * Top N gene sets, merging the flat bayes_gene/gene_scores response's `gene_set_scores` map with
 * pigean's embedded `gene_set_scores` map (and p-values from pigean's `gene_sets` array when
 * present). Sorted descending by score (higher = more significant per the API's own convention:
 * >0.01 significant, >0.1 strongly significant, >1.0 among the strongest).
 */
function selectTopGeneSets(geneScoresFlatResponse, pigeanResponse, { limit = 50 } = {}) {
    const flatMap = (geneScoresFlatResponse && geneScoresFlatResponse.gene_set_scores) || {};
    const pigeanMap = (pigeanResponse && pigeanResponse.gene_set_scores) || {};
    const pigeanPValueByGeneSet = {};
    (Array.isArray(pigeanResponse && pigeanResponse.gene_sets) ? pigeanResponse.gene_sets : []).forEach((row) => {
        if (row && row.gene_set != null) pigeanPValueByGeneSet[String(row.gene_set)] = Number(row.p_value);
    });

    const byGeneSet = {};
    Object.keys(flatMap).forEach((geneSet) => {
        byGeneSet[geneSet] = { geneSet, score: Number(flatMap[geneSet]), source: "gene_scores_endpoint" };
    });
    Object.keys(pigeanMap).forEach((geneSet) => {
        const score = Number(pigeanMap[geneSet]);
        if (byGeneSet[geneSet]) {
            byGeneSet[geneSet].source = "both";
        } else {
            byGeneSet[geneSet] = { geneSet, score, source: "pigean" };
        }
    });
    Object.keys(pigeanPValueByGeneSet).forEach((geneSet) => {
        if (byGeneSet[geneSet]) byGeneSet[geneSet].pValue = pigeanPValueByGeneSet[geneSet];
    });

    return Object.values(byGeneSet)
        .filter((row) => !Number.isNaN(row.score))
        .sort((a, b) => b.score - a.score)
        .slice(0, limit)
        .map((row, idx) => ({ pValue: null, ...row, rank: idx + 1 }));
}

/**
 * Reshapes a bayes_gene/pigean response into a factor summary: one entry per factor, with its
 * member gene sets and genes. Prefers the explicit gene-factor/gene-set-factor membership maps
 * (unbounded) over the top_genes/top_gene_sets strings on the summary row (which are capped to a
 * handful of "top" entries), falling back to the strings only when a factor is absent from the
 * membership maps. Order is NOT guaranteed sorted by any score -- callers should sort as needed.
 */
function buildGeneDerivedFactorSummary(pigeanResponse) {
    if (!pigeanResponse) return [];
    const factorRows = Array.isArray(pigeanResponse["pigean-factor"] && pigeanResponse["pigean-factor"].data)
        ? pigeanResponse["pigean-factor"].data
        : [];
    const geneFactorMap = pigeanResponse["gene-factor"] && typeof pigeanResponse["gene-factor"] === "object"
        ? pigeanResponse["gene-factor"]
        : {};
    const geneSetFactorMap = pigeanResponse["gene-set-factor"] && typeof pigeanResponse["gene-set-factor"] === "object"
        ? pigeanResponse["gene-set-factor"]
        : {};

    return factorRows.map((row) => {
        const factorId = row && (row.factor != null ? row.factor : row.cluster) != null
            ? String(row.factor != null ? row.factor : row.cluster)
            : "";
        const geneSetRows = Array.isArray(geneSetFactorMap[factorId]) ? geneSetFactorMap[factorId] : null;
        const geneRows = Array.isArray(geneFactorMap[factorId]) ? geneFactorMap[factorId] : null;
        const geneSetMembers = geneSetRows
            ? geneSetRows.map((r) => String(r.gene_set)).filter(Boolean)
            : parseGeneSetString(row && row.top_gene_sets);
        const geneMembers = geneRows
            ? geneRows.map((r) => String(r.gene)).filter(Boolean)
            : parseGeneSetString(row && row.top_genes);
        return {
            factorId,
            label: row && row.label != null ? String(row.label) : "",
            factorValue: row && row.gene_set_score != null ? Number(row.gene_set_score) : null,
            geneSetMembers,
            geneMembers,
        };
    });
}

/**
 * Groups per-trait factors that share overlapping member gene sets, across different traits.
 * Per-trait factor ids/labels are NOT comparable across traits (each per-phenotype API call
 * numbers its own factors independently) -- gene-set-name overlap is the only shared vocabulary,
 * so that's the join key. Greedy single-pass clustering (a factor joins the first cluster it
 * overlaps with a shared gene set, order-dependent for edge cases involving 3+ overlapping
 * clusters) -- a reasonable first-pass heuristic for an exploratory cross-check, not exact.
 * Only returns clusters spanning 2+ distinct traits (i.e. genuinely "recurring").
 */
function crossReferenceRecurringTraitFactors(perTraitFactors) {
    const entries = [];
    Object.keys(perTraitFactors || {}).forEach((traitId) => {
        const rec = perTraitFactors[traitId];
        if (!rec || !rec.ok) return;
        (rec.factors || []).forEach((f) => {
            const geneSets = parseGeneSetString(f.topGeneSets);
            if (!geneSets.length) return;
            entries.push({ traitId, factor: f.factor, label: f.label, geneSets: new Set(geneSets) });
        });
    });

    const clusters = [];
    entries.forEach((entry) => {
        const matched = clusters.find((cluster) => {
            for (const gs of entry.geneSets) {
                if (cluster.geneSets.has(gs)) return true;
            }
            return false;
        });
        if (matched) {
            matched.traits.push({ traitId: entry.traitId, factor: entry.factor, label: entry.label });
            entry.geneSets.forEach((gs) => matched.geneSets.add(gs));
        } else {
            clusters.push({ geneSets: new Set(entry.geneSets), traits: [{ traitId: entry.traitId, factor: entry.factor, label: entry.label }] });
        }
    });

    return clusters
        .map((c) => ({
            matchKey: [...c.geneSets].sort().join(";"),
            traits: c.traits,
            traitCount: new Set(c.traits.map((t) => t.traitId)).size,
        }))
        .filter((c) => c.traitCount >= 2)
        .sort((a, b) => b.traitCount - a.traitCount);
}

/**
 * For each of the top-N gene sets, finds which gene-derived factors (from the whole-gene-list
 * pigean call) and which per-trait factors include it as a member.
 */
function crossReferenceGeneSetToFactors(topGeneSets, geneDerivedFactorSummary, perTraitFactors) {
    const factorSummary = Array.isArray(geneDerivedFactorSummary) ? geneDerivedFactorSummary : [];
    const traitEntries = Object.keys(perTraitFactors || {}).flatMap((traitId) => {
        const rec = perTraitFactors[traitId];
        if (!rec || !rec.ok) return [];
        return (rec.factors || []).map((f) => ({
            traitId,
            factor: f.factor,
            label: f.label,
            geneSets: parseGeneSetString(f.topGeneSets),
        }));
    });

    return (Array.isArray(topGeneSets) ? topGeneSets : []).map((row) => {
        const geneSet = row.geneSet;
        const geneDerivedFactors = factorSummary
            .filter((f) => Array.isArray(f.geneSetMembers) && f.geneSetMembers.includes(geneSet))
            .map((f) => f.label || f.factorId);
        const traitFactors = traitEntries
            .filter((e) => e.geneSets.includes(geneSet))
            .map((e) => ({ traitId: e.traitId, factor: e.factor, label: e.label }));
        return { geneSet, score: row.score, geneDerivedFactors, traitFactors };
    });
}

export {
    buildGeneDerivedFactorSummary,
    crossReferenceGeneSetToFactors,
    crossReferenceRecurringTraitFactors,
    selectTopGeneSets,
    selectTopTraits,
};
