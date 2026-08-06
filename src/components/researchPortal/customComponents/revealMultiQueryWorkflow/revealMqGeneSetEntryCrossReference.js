/**
 * Pure selection helpers for the gene-set entry point.
 */

/**
 * Ranked traits from a bayes_gene/phenotypes response, sorted ascending by p_value.
 * Pass `limit` to cap; omit / null / Infinity to return the full ranked list (used when
 * walking until N traits have cfde gene-phenotype data).
 */
function selectTopTraits(phenotypesResponse, { limit = 15 } = {}) {
    const rows = Array.isArray(phenotypesResponse && phenotypesResponse.phenotypes)
        ? phenotypesResponse.phenotypes
        : [];
    const ranked = rows
        .filter((r) => r && r.phenotype != null)
        .map((r) => ({ trait: String(r.phenotype), pValue: Number(r.p_value) }))
        .sort((a, b) => a.pValue - b.pValue)
        .map((r, idx) => ({ ...r, rank: idx + 1 }));
    if (limit == null || !Number.isFinite(limit) || limit < 0) return ranked;
    return ranked.slice(0, limit);
}

export { selectTopTraits };
