const { normalizeCarrierRecords } = require("./carrierStatistics");
const { observedPhenotypeCategories } = require("./hpoHierarchy");
// Shared immutable reference objects keep large carrier lists from creating
// millions of duplicate reactive gene/HPO records in the browser.
const geneReferences = new Map();
const hpoReferences = new Map();
function geneReference(gene) {
    if (!geneReferences.has(gene)) geneReferences.set(gene, Object.freeze({ gene, note: null }));
    return geneReferences.get(gene);
}
function immutablePhenotypes(categories) {
    if (!categories) return null;
    return Object.freeze(categories.map(category => Object.freeze({ ...category,
        terms: Object.freeze(category.terms.map(term => {
            const key = `${term.id}|${term.parentId}`;
            if (!hpoReferences.has(key)) hpoReferences.set(key, Object.freeze(term));
            return hpoReferences.get(key);
        })),
    })));
}

function first(row, keys) {
    for (const key of keys) {
        const value = row[key];
        if (value != null && String(value).trim() !== "") return value;
    }
    return null;
}

function scoringTermCount(source) {
    if (source && source.n_terms != null && String(source.n_terms).trim() !== '') {
        const count = Number(source.n_terms);
        if (Number.isInteger(count) && count >= 0) return count;
    }
    return null;
}

function carrierHpoTermCount(carrier, metadataById = {}) {
    const metadata = metadataById[carrier.id];
    for (const source of [metadata, carrier]) {
        if (!source) continue;
        if (source.hpoCount != null && String(source.hpoCount).trim() !== '') {
            const count = Number(source.hpoCount);
            if (Number.isInteger(count) && count >= 0) return count;
        }
        if (source.phenotypeDataAvailable === false) return 0;
        if (source === metadata && Object.prototype.hasOwnProperty.call(source, 'hpoCount')) return null;
    }
    return null;
}

function sampleMetadataFromRows(rows, sampleId, gene) {
    const canonicalId = sampleId.replace(/_G38$/i, "");
    const row = (rows || []).find(candidate => {
        if (!candidate || typeof candidate !== "object") return false;
        if (candidate.SampleInVCF) return String(candidate.SampleInVCF).trim() === sampleId;
        return candidate.sample_id && String(candidate.sample_id).trim() === canonicalId;
    });
    if (!row) return null;

    // Use the same samples-info gene list and symbol rules as the PB Gene
    // carrier summary. A missing list is different from a known empty list.
    const coGenes = Array.isArray(row.genes)
        ? Object.freeze([...new Set(row.genes
            .filter(value => typeof value === "string" && /^[A-Z0-9.-]{1,40}$/i.test(value))
            .map(value => value.toUpperCase()))]
            .filter(symbol => symbol !== String(gene || "").toUpperCase())
            .map(geneReference))
        : null;
    const phenotypes = immutablePhenotypes(observedPhenotypeCategories(row.phenotypes));

    const normalized = normalizeCarrierRecords([{
        id: sampleId,
        age: first(row, ["age_at_enrollment", "age_for_portal", "age", "age_band"]),
        sex: first(row, ["sex", "gender"]),
        investigator: first(row, ["investigator", "cohort", "study", "study_code"]),
        affected: first(row, ["initial_study_affected", "affected_flag", "affected", "is_affected"]),
        gendx: first(row, ["GeneDx", "gendx_detail_label", "gendx"]),
    }])[0];
    return {
        id: sampleId,
        age: normalized.age,
        ageYears: normalized.ageYears,
        sex: normalized.sex,
        investigator: normalized.investigator,
        project: first(row, ["Project", "project", "project_name", "clean_name"]),
        affected: normalized.affected,
        gendx: normalized.gendx,
        coGenes,
        coGeneCount: coGenes && coGenes.length,
        phenotypes,
        hpoCount: scoringTermCount(row) ?? (Array.isArray(row.phenotypes) && !row.phenotypes.length ? 0 : null),
        phenotypeDataAvailable: Array.isArray(row.phenotypes) ? row.phenotypes.length > 0 : null,
    };
}

function mergeCarrierMetadata(records, metadataById) {
    return records.map(carrier => {
        const metadata = metadataById[carrier.id];
        if (!metadata) return carrier;
        const fields = {};
        for (const key of ["age", "ageYears", "sex", "investigator", "project", "affected", "gendx", "coGenes", "coGeneCount", "phenotypes", "hpoCount", "phenotypeDataAvailable"]) {
            if (key === 'hpoCount' && Object.prototype.hasOwnProperty.call(metadata, key)) { fields[key] = metadata[key]; continue; }
            if (metadata[key] != null && metadata[key] !== "") fields[key] = metadata[key];
        }
        return { ...carrier, ...fields };
    });
}

function sampleMetadataFromCachedInfo(info, id, gene) {
    if (!info) return null;
    const result = sampleMetadataFromRows([{
        SampleInVCF: id, age: info.age, sex: info.sex, investigator: info.investigator,
        project: info.project, affected: info.affected, genes: info.genes,
        phenotypes: info.observedHpoIds == null ? null : info.observedHpoIds.map(hpo_id => ({ hpo_id, is_observed: true })),
    }], id, gene);
    result.phenotypeDataAvailable = Array.isArray(info.hpoIds) ? info.hpoIds.length > 0 : null;
    result.hpoCount = scoringTermCount(info) ?? (Array.isArray(info.hpoIds) && !info.hpoIds.length ? 0 : null);
    return result;
}

module.exports = { sampleMetadataFromRows, sampleMetadataFromCachedInfo, mergeCarrierMetadata, carrierHpoTermCount };
