const { normalizeCarrierRecords } = require("./carrierStatistics");
const { observedPhenotypeCategories } = require("./hpoHierarchy");

function first(row, keys) {
    for (const key of keys) {
        const value = row[key];
        if (value != null && String(value).trim() !== "") return value;
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
        ? [...new Set(row.genes
            .filter(value => typeof value === "string" && /^[A-Z0-9.-]{1,40}$/i.test(value))
            .map(value => value.toUpperCase()))]
            .filter(symbol => symbol !== String(gene || "").toUpperCase())
            .map(symbol => ({ gene: symbol, note: null }))
        : null;
    const phenotypes = observedPhenotypeCategories(row.phenotypes);

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
    };
}

function mergeCarrierMetadata(records, metadataById) {
    return records.map(carrier => {
        const metadata = metadataById[carrier.id];
        if (!metadata) return carrier;
        const fields = {};
        for (const key of ["age", "ageYears", "sex", "investigator", "project", "affected", "gendx", "coGenes", "coGeneCount", "phenotypes"]) {
            if (metadata[key] != null && metadata[key] !== "") fields[key] = metadata[key];
        }
        return { ...carrier, ...fields };
    });
}

module.exports = { sampleMetadataFromRows, mergeCarrierMetadata };
