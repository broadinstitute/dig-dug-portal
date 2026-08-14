/**
 * Load CFDE disease↔factor rows and build disease-centered / factor-centered indexes.
 * Source CSV: ./data/biomarker_cfde_disease_factors.csv
 */

import factorRows from "./data/biomarker_cfde_disease_factors.json";

function uniqPush(list, value) {
    if (!value) return;
    if (list.indexOf(value) === -1) list.push(value);
}

/**
 * @param {Array<Record<string, string>>} rows
 * @returns {{
 *   diseases: Record<string, {
 *     iri: string,
 *     disease: string,
 *     cfdeDiseases: string[],
 *     factors: string[],
 *     roles: string[],
 *   }>,
 *   factors: Record<string, {
 *     factor: string,
 *     diseases: Array<{ iri: string, disease: string, cfdeDisease: string, roles: string[] }>,
 *   }>,
 * }}
 */
export function buildDiseaseFactorIndexes(rows) {
    const diseases = {};
    const factors = {};

    (rows || []).forEach((raw) => {
        const iri = String((raw && raw.biomarker_disease_iris) || "").trim();
        const disease = String((raw && raw.disease) || "").trim();
        const cfdeDisease = String((raw && raw.cfde_disease) || "").trim();
        const factor = String((raw && raw.factor) || "").trim();
        const role = String((raw && raw.role) || "").trim();
        if (!iri || !factor) return;

        if (!diseases[iri]) {
            diseases[iri] = {
                iri,
                disease: disease || cfdeDisease,
                cfdeDiseases: [],
                factors: [],
                roles: [],
            };
        }
        const d = diseases[iri];
        if (disease && !d.disease) d.disease = disease;
        uniqPush(d.cfdeDiseases, cfdeDisease);
        uniqPush(d.factors, factor);
        uniqPush(d.roles, role);

        if (!factors[factor]) {
            factors[factor] = { factor, diseases: [] };
        }
        const f = factors[factor];
        let link = f.diseases.find(
            (x) => x.iri === iri && x.cfdeDisease === (cfdeDisease || x.cfdeDisease)
        );
        if (!link) {
            link = {
                iri,
                disease: disease || cfdeDisease,
                cfdeDisease: cfdeDisease || disease,
                roles: [],
            };
            f.diseases.push(link);
        }
        uniqPush(link.roles, role);
    });

    Object.keys(diseases).forEach((iri) => {
        diseases[iri].factors.sort((a, b) => a.localeCompare(b));
        diseases[iri].cfdeDiseases.sort((a, b) => a.localeCompare(b));
    });
    Object.keys(factors).forEach((name) => {
        factors[name].diseases.sort((a, b) => {
            const da = (a.cfdeDisease || a.disease || "").localeCompare(
                b.cfdeDisease || b.disease || ""
            );
            return da !== 0 ? da : (a.disease || "").localeCompare(b.disease || "");
        });
    });

    return { diseases, factors };
}

/**
 * Autocomplete options from the two indexes.
 * Mechanism labels are "factor (disease)".
 */
export function buildSearchOptions(indexes) {
    const diseases = (indexes && indexes.diseases) || {};
    const factors = (indexes && indexes.factors) || {};
    const diseaseOptions = Object.keys(diseases)
        .map((iri) => {
            const d = diseases[iri];
            const aliases = [d.disease].concat(d.cfdeDiseases || []).filter(Boolean);
            return {
                kind: "disease",
                iri,
                label: d.disease,
                searchText: aliases.concat([iri]).join(" ").toLowerCase(),
            };
        })
        .sort((a, b) => a.label.localeCompare(b.label));

    const mechanismOptions = [];
    Object.keys(factors)
        .sort((a, b) => a.localeCompare(b))
        .forEach((name) => {
            const f = factors[name];
            (f.diseases || []).forEach((link) => {
                const diseaseName = link.cfdeDisease || link.disease || "";
                const label = `${f.factor} (${diseaseName})`;
                mechanismOptions.push({
                    kind: "mechanism",
                    iri: link.iri,
                    factor: f.factor,
                    disease: link.disease,
                    cfdeDisease: diseaseName,
                    label,
                    searchText: [f.factor, link.disease, diseaseName, link.iri]
                        .filter(Boolean)
                        .join(" ")
                        .toLowerCase(),
                });
            });
        });

    return { diseaseOptions, mechanismOptions };
}

let cached = null;

/** Parse the imported list once and return both indexes plus search options. */
export function getBiomarkerDiseaseFactorData() {
    if (!cached) {
        const indexes = buildDiseaseFactorIndexes(factorRows);
        cached = Object.assign({ diseases: indexes.diseases, factors: indexes.factors }, buildSearchOptions(indexes));
    }
    return cached;
}
