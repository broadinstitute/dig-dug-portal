/**
 * BioIndex biomarker-factor-disease: factor IRI → ranked MONDO diseases.
 * Host: CFDE BioIndex (dev).
 */

export const CFDE_BIOINDEX_HOST = "https://cfde-dev.hugeampkpnbi.org";
export const BIOMARKER_FACTOR_DISEASE_INDEX = "biomarker-factor-disease";

function parseSupportingGenes(raw) {
    return String(raw || "")
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean);
}

function num(value) {
    if (value == null || value === "") return null;
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
}

/**
 * Map one BioIndex row into the associated-disease shape used by the UI.
 * @param {object} row
 * @returns {{
 *   disease: string,
 *   diseaseLabel: string,
 *   sharedGeneCount: number,
 *   geneEvidenceSimilarity: number|null,
 *   overlapNegLog10P: number|null,
 *   overlapPValue: number|null,
 *   combinedScore: number|null,
 *   supportingGenes: string[],
 *   rank: number|null,
 * }}
 */
export function mapBiomarkerFactorDiseaseRow(row) {
    const disease = String((row && row.disease_iri) || "").trim();
    const supportingGenes = parseSupportingGenes(row && row.supporting_genes);
    const sharedFromApi = Number(row && row.shared_gene_count);
    return {
        disease,
        diseaseLabel: String((row && row.disease_label) || "").trim() || disease,
        sharedGeneCount: Number.isFinite(sharedFromApi)
            ? sharedFromApi
            : supportingGenes.length,
        geneEvidenceSimilarity: num(row && row.gene_evidence_similarity),
        overlapNegLog10P: num(row && row.overlap_neg_log10_p),
        overlapPValue: num(row && row.overlap_p_value),
        combinedScore: num(row && row.combined_score),
        supportingGenes,
        rank: num(row && row.rank),
    };
}

/**
 * @param {string} factorIri
 * @param {{ signal?: AbortSignal, host?: string }} [opts]
 * @returns {Promise<ReturnType<typeof mapBiomarkerFactorDiseaseRow>[]>}
 */
export async function listMondoDiseasesForFactor(factorIri, opts = {}) {
    const q = String(factorIri || "").trim();
    if (!q) return [];

    const host = String(opts.host || CFDE_BIOINDEX_HOST).replace(/\/$/, "");
    const url = new URL(`${host}/api/bio/query/${BIOMARKER_FACTOR_DISEASE_INDEX}`);
    url.searchParams.set("q", q);

    const res = await fetch(url.toString(), {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: opts.signal,
    });
    if (!res.ok) {
        const text = await res.text().catch(() => "");
        throw new Error(
            `biomarker-factor-disease HTTP ${res.status}${
                text ? `: ${text.slice(0, 200)}` : ""
            }`
        );
    }

    const json = await res.json();
    const rows = Array.isArray(json && json.data) ? json.data : [];
    return rows
        .map(mapBiomarkerFactorDiseaseRow)
        .filter((r) => !!r.disease)
        .sort((a, b) => {
            const ra = a.rank != null ? a.rank : Number.POSITIVE_INFINITY;
            const rb = b.rank != null ? b.rank : Number.POSITIVE_INFINITY;
            if (ra !== rb) return ra - rb;
            const sa = a.geneEvidenceSimilarity != null ? a.geneEvidenceSimilarity : -1;
            const sb = b.geneEvidenceSimilarity != null ? b.geneEvidenceSimilarity : -1;
            return sb - sa;
        });
}

/**
 * Build diseaseGenes map entries from API supporting_genes (symbol-only).
 * @param {Array<{ disease: string, supportingGenes?: string[] }>} diseases
 * @returns {Record<string, Array<{ gene: string, geneLabel: string, factorLoading: null, pigeanScore: null }>>}
 */
export function diseaseGenesFromSupportingLists(diseases) {
    const out = {};
    (diseases || []).forEach((row) => {
        const iri = row && row.disease;
        if (!iri) return;
        out[iri] = (row.supportingGenes || []).map((symbol) => ({
            gene: symbol,
            geneLabel: symbol,
            factorLoading: null,
            pigeanScore: null,
        }));
    });
    return out;
}
