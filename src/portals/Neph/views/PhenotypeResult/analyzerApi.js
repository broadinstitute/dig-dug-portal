// Data layer for the Phenotype page. It talks only to the phenotype analyzer
// service that the previous PhenotypeResult page used:
//   POST /phenotype-analyzer-api/analyze           -> top matching samples
//   POST /phenotype-analyzer-api/top_phenotypes    -> co-observed phenotypes
//   POST /phenotype-analyzer-api/sample_phenotypes -> HPO terms of one sample
// Everything is normalised into the row shape that the page components use.

export const ANALYZE_URL = "/phenotype-analyzer-api/analyze";
export const TOP_PHENOTYPES_URL = "/phenotype-analyzer-api/top_phenotypes";
export const SAMPLE_PHENOTYPES_URL = "/phenotype-analyzer-api/sample_phenotypes";

async function postJson(url, body, signal) {
    const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal,
    });
    if (!response.ok) throw new Error(`Phenotype analyzer returned ${response.status}.`);
    const result = await response.json();
    if (result && result.error) throw new Error(result.error);
    return result;
}

const firstPresent = (row, keys) => keys.find((key) => Object.prototype.hasOwnProperty.call(row, key));

// Analyzer rows carry the sample table's non-HPO columns plus `matches`
// ("2/3") and `similarity_score`. Optional demographic columns are exposed
// only when the service returns them; otherwise the page shows them unknown.
export function normalizeAnalyzerSample(row, index) {
    if (row === null || typeof row !== "object") return { rank: index + 1, unique_sample_ID: String(row) };
    const sample = { ...row, rank: index + 1, rphers_z: null, profileMetadataComplete: false };
    const cohortKey = firstPresent(row, ["cohort_category", "clean_name", "Project", "project", "cohort"]);
    if (cohortKey && !sample.cohort_category) sample.cohort_category = row[cohortKey];
    const ageKey = firstPresent(row, ["age_at_enrollment", "age_for_portal", "age"]);
    if (ageKey && !Object.prototype.hasOwnProperty.call(row, "age_at_enrollment")) sample.age_at_enrollment = row[ageKey];
    if (!sample.gender) {
        const sexKey = firstPresent(row, ["sex", "Sex", "gender", "Gender"]);
        if (sexKey) sample.gender = row[sexKey];
    }
    return sample;
}

export async function analyzeProfile(hpoIds, { signal } = {}) {
    const result = await postJson(ANALYZE_URL, { terms: hpoIds.join(",") }, signal);
    const matches = Array.isArray(result) ? result : result.top_matches;
    if (!Array.isArray(matches)) throw new Error("Phenotype analyzer returned an unexpected result.");
    return {
        samples: matches.map(normalizeAnalyzerSample),
        validTermCount: Number(result.valid_query_terms_used_as_denominator) || null,
    };
}

export async function fetchSamplePhenotypes(sampleId, { signal } = {}) {
    const result = await postJson(SAMPLE_PHENOTYPES_URL, { sample_id: sampleId }, signal);
    return (result.phenotypes || []).map((item) => item.hpo_id).filter(Boolean);
}

// Adds `expanded_hpo_ids` to each sample, a few requests at a time. Samples
// whose list cannot be read keep no list, which the page treats as unknown.
export async function attachSamplePhenotypes(samples, { signal, concurrency = 6, onProgress } = {}) {
    const enriched = samples.map((sample) => ({ ...sample }));
    let cursor = 0;
    const worker = async () => {
        while (cursor < enriched.length && !(signal && signal.aborted)) {
            const sample = enriched[cursor++];
            const id = sample.unique_sample_ID || sample.SampleInVCF || sample.sample_id;
            if (!id) continue;
            try {
                sample.expanded_hpo_ids = await fetchSamplePhenotypes(id, { signal });
            } catch (error) {
                if (signal && signal.aborted) return;
            }
            if (onProgress) onProgress();
        }
    };
    await Promise.all(Array.from({ length: Math.min(concurrency, enriched.length) }, worker));
    return enriched;
}

// Normalises the many response shapes /top_phenotypes can return into
// [{ hpo_id, name, count, Wp, matches }].
export function normalizeTopPhenotypes(data) {
    if (Array.isArray(data)) return data;
    if (!data || typeof data !== "object") return [];
    const arrayKey = Object.keys(data).find((key) => Array.isArray(data[key]));
    if (arrayKey) return data[arrayKey];
    return Object.entries(data).map(([key, value]) =>
        value && typeof value === "object" ? { hpo_id: key, ...value } : { hpo_id: key, samples: value }
    );
}

export async function fetchTopPhenotypes(sampleIds, { signal } = {}) {
    if (!sampleIds.length) return [];
    const data = await postJson(TOP_PHENOTYPES_URL, { samples: sampleIds }, signal);
    return normalizeTopPhenotypes(data);
}
