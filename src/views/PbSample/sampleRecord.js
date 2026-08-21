const UNAVAILABLE = "Unavailable";

function canonicalSampleId(value) {
    return String(value || "").trim().replace(/_G38$/i, "");
}

function sampleIdFromPatientRow(row = {}, fallback = "") {
    return canonicalSampleId(row.patient_id || row.sample_id || fallback);
}

function emptyPbSample(sampleId = "") {
    return {
        sampleId: canonicalSampleId(sampleId),
        sex: UNAVAILABLE,
        ageAtEnrollment: UNAVAILABLE,
        affected: UNAVAILABLE,
        investigator: UNAVAILABLE,
        familyMembers: [],
        phenotypeTotal: 0,
        phenotypeMatchEligibleCount: 0,
        phenotypeMatches: [],
        investigatorPhenotypeSummary: [],
        phenotypeGroups: [],
        variants: [],
        allVariants: [],
    };
}

function sampleFromPatientRow(row, fallback = "") {
    return {
        ...emptyPbSample(sampleIdFromPatientRow(row, fallback)),
        sex: row.sex || row.gender || UNAVAILABLE,
        ageAtEnrollment: row.age_at_enrollment || row.age || UNAVAILABLE,
        affected: row.affected == null ? UNAVAILABLE : row.affected,
        investigator: row.investigator || row.cohort || UNAVAILABLE,
    };
}

module.exports = {
    UNAVAILABLE,
    canonicalSampleId,
    emptyPbSample,
    sampleFromPatientRow,
    sampleIdFromPatientRow,
};
