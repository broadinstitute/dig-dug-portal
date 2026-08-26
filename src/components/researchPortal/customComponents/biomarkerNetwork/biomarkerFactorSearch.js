/**
 * Semantic factor search for the biomarker network (pgvector API).
 */

const BIOMARKER_FACTOR_SEARCH_URL =
    "https://search.hugeamp.org/api/search/pgvector/biomarker-factors";

/**
 * @param {string} needle
 * @param {{ limit?: number, signal?: AbortSignal }} [opts]
 * @returns {Promise<Array<{ id: number, iri: string, label: string, factor: string, cfdeDisease: string, score: number|null }>>}
 */
export async function searchBiomarkerFactors(needle, opts = {}) {
    const q = String(needle || "").trim();
    if (q.length < 2) return [];

    const topK = Math.max(1, Math.min(50, Number(opts.limit) || 10));
    const url = `${BIOMARKER_FACTOR_SEARCH_URL}?q=${encodeURIComponent(q)}&top_k=${topK}`;
    const response = await fetch(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: opts.signal,
    });
    if (!response.ok) {
        throw new Error(`Factor search failed (${response.status})`);
    }
    const body = await response.json();
    const results = Array.isArray(body && body.results) ? body.results : [];
    return results
        .map((row) => {
            const id = Number(row && row.id);
            const iri = String((row && row.factor_iri) || "").trim();
            const label = String((row && row.factor_label) || "").trim();
            if (!Number.isFinite(id) || !iri || !label) return null;
            return {
                id,
                iri,
                label,
                factor: String((row && row.factor) || "").trim(),
                cfdeDisease: String((row && row.cfde_disease) || "").trim(),
                score: row && row.score != null && !Number.isNaN(Number(row.score))
                    ? Number(row.score)
                    : null,
            };
        })
        .filter(Boolean);
}
