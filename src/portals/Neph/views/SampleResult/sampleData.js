import { request } from "@/utils/bioIndexUtils";

const { canonicalSampleId, emptyPbSample, UNAVAILABLE } = require("./sampleRecord");
const { familyIdFromSampleId } = require("./familyModel");
const { hpoPath, hpoTermLabel } = require("../VariantResult/hpoHierarchy");

const MATCH_TERM_LIMIT = 10;

function first(row, keys) {
    for (const key of keys) {
        const value = row && row[key];
        if (value != null && String(value).trim() !== "") return value;
    }
    return null;
}

async function samplesInfoRow(lookupId) {
    try {
        const response = await request("/api/bio/query/samples-info", { q: lookupId, limit: 5 }, undefined, true);
        if (!response.ok) return null;
        const payload = await response.json();
        const rows = payload.data || [];
        const strip = value => String(value || "").replace(/_G38$/i, "");
        return rows.find(row => [row.SampleInVCF, row.sampleInVCF, row.sample_in_vcf, row.sample_id].some(v => strip(v) === strip(lookupId))) || rows[0] || null;
    } catch (error) {
        return null;
    }
}

function observedHpoIds(row) {
    if (!row || !Array.isArray(row.phenotypes)) return null;
    return Array.from(new Set(row.phenotypes
        .filter(item => item && item.is_observed === true && /^HP:\d{7}$/i.test(String(item.hpo_id || "")))
        .map(item => String(item.hpo_id).toUpperCase())));
}

async function phenotypesFromAnalyzer(sampleId) {
    try {
        const response = await fetch("/phenotype-analyzer-api/sample_phenotypes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ sample_id: sampleId }),
        });
        const data = await response.json();
        if (data.error) return null;
        const list = Array.isArray(data) ? data : data.phenotypes || [];
        return list.map(item => String(item.hpo_id || item.id || "").toUpperCase()).filter(id => /^HP:\d{7}$/.test(id));
    } catch (error) {
        return null;
    }
}

// Group observed terms by their HP:0000118 child category.
export function buildPhenotypeGroups(hpoIds) {
    const groups = new Map();
    (hpoIds || []).forEach(id => {
        const path = hpoPath(id);
        if (path.length < 2) return;
        const categoryId = path[1];
        if (!groups.has(categoryId)) groups.set(categoryId, { id: categoryId, label: hpoTermLabel(categoryId) || categoryId, count: 0, terms: [] });
        const group = groups.get(categoryId);
        group.count += 1;
        group.terms.push({ id, label: hpoTermLabel(id) || id });
    });
    return Array.from(groups.values());
}

function matchedCount(value) {
    if (typeof value === "number") return value;
    const parsed = parseInt(String(value == null ? "" : value), 10);
    return Number.isFinite(parsed) ? parsed : 0;
}

async function similarSamples(sampleId, hpoIds) {
    const terms = (hpoIds || []).slice(0, MATCH_TERM_LIMIT).join(",");
    if (!terms) return [];
    try {
        const response = await fetch("/phenotype-analyzer-api/analyze", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ terms }),
        });
        if (!response.ok) return [];
        const data = await response.json();
        const matches = Array.isArray(data) ? data : Array.isArray(data.top_matches) ? data.top_matches : [];
        const family = familyIdFromSampleId(sampleId);
        return matches
            .map(match => ({
                sampleId: canonicalSampleId(match.unique_sample_ID || match.sample_id || match.sampleId || ""),
                matchedHpo: matchedCount(match.matches != null ? match.matches : match.overlap),
                investigator: match.investigator || UNAVAILABLE,
                age: match.age || UNAVAILABLE,
                sex: match.sex || UNAVAILABLE,
            }))
            .filter(match => match.sampleId && match.sampleId !== sampleId && !(family && familyIdFromSampleId(match.sampleId) === family))
            .map((match, index) => ({ rank: index + 1, ...match }));
    } catch (error) {
        return [];
    }
}

// sampleId is displayed; sampleInVcf (when provided) is used to look up the
// samples-info record, matching the GeneResult sample subtable.
export async function fetchSampleState(sampleId, sampleInVcf) {
    const canonicalId = canonicalSampleId(sampleId);
    const info = await samplesInfoRow(String(sampleInVcf || "").trim() || canonicalId);
    let sample = emptyPbSample(canonicalId);
    if (info) {
        const set = (field, value) => {
            if (value != null) sample[field] = value;
        };
        set("sex", first(info, ["sex", "gender"]));
        set("ageAtEnrollment", first(info, ["age_at_enrollment", "age_for_portal", "age"]));
        set("affected", first(info, ["initial_study_affected", "affected_flag", "affected"]));
        set("investigator", first(info, ["investigator", "cohort", "study"]));
    }

    let hpoIds = observedHpoIds(info);
    if (!hpoIds || !hpoIds.length) hpoIds = (await phenotypesFromAnalyzer(canonicalId)) || hpoIds || [];
    const phenotypeGroups = buildPhenotypeGroups(hpoIds);
    sample = {
        ...sample,
        phenotypeTotal: hpoIds.length,
        phenotypeGroups,
    };
    return { sample, patientStatus: info ? "live" : "not-found", patientError: "", hpoIds };
}

export async function fetchSampleMatches(sampleId, hpoIds) {
    return similarSamples(canonicalSampleId(sampleId), hpoIds);
}
