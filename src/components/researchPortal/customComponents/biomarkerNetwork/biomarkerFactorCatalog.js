/**
 * Local catalog of CFDE biomarker factors (id → iri/label).
 * Source: ./data/biomarker_cfde_factors_with_iris.csv
 * Row `id` matches the pgvector search API's `id` (1-based).
 */

import factorRows from "./data/biomarker_cfde_factors_with_iris.json";

const byId = Object.create(null);
(factorRows || []).forEach((row) => {
    const id = Number(row && row.id);
    if (!Number.isFinite(id) || id <= 0) return;
    byId[id] = {
        id,
        factor: String((row && row.factor) || ""),
        iri: String((row && row.factor_iri) || ""),
        label: String((row && row.factor_label) || ""),
        cfdeDisease: String((row && row.cfde_disease) || ""),
    };
});

/**
 * @param {number|string} id
 * @returns {{ id: number, factor: string, iri: string, label: string, cfdeDisease: string } | null}
 */
export function getFactorById(id) {
    const n = Number(id);
    if (!Number.isFinite(n) || n <= 0) return null;
    return byId[n] || null;
}

/**
 * @param {string} raw
 * @returns {boolean}
 */
export function looksLikeFactorId(raw) {
    return /^\d+$/.test(String(raw || "").trim());
}
