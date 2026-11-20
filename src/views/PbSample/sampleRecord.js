const UNAVAILABLE = "Unavailable";
const { hpoPath } = require('../PbVariant/hpoHierarchy');
const ontology = require('../PbVariant/hpoTree.generated.json');

function canonicalSampleId(value) {
    return String(value || "").trim().replace(/_[EG]38$/i, "");
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
        projectName: UNAVAILABLE,
        genes: [],
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

function sampleFromInfoRow(row) {
    const sample = emptyPbSample(row.sample_id || row.SampleInVCF);
    const rawAge = row.age_at_enrollment;
    const age = rawAge == null || String(rawAge).trim() === '' ? NaN : Number(rawAge);
    sample.ageAtEnrollment = Number.isFinite(age) && age >= 0 && age <= 100 ? age : UNAVAILABLE;
    sample.sex = ['male', 'female'].includes(String(row.gender).toLowerCase()) ? String(row.gender).toLowerCase() : UNAVAILABLE;
    sample.affected = String(row.initial_study_affected).toUpperCase() === 'Y' ? 'Yes' : String(row.initial_study_affected).toUpperCase() === 'N' ? 'No' : UNAVAILABLE;
    sample.investigator = row.investigator || UNAVAILABLE;
    sample.projectName = row.clean_name || row.Project || row.project || row.project_name || UNAVAILABLE;
    sample.genes = [...new Set((Array.isArray(row.genes) ? row.genes : []).filter(gene => typeof gene === 'string' && gene.trim()).map(gene => gene.trim()))].sort();
    const observed = [...new Set((Array.isArray(row.phenotypes) ? row.phenotypes : [])
        .filter(term => term && term.is_observed === true && /^HP:\d{7}$/i.test(term.hpo_id || ''))
        .map(term => term.hpo_id.toUpperCase()))];
    const groups = new Map();
    for (const id of observed) {
        const path = hpoPath(id);
        const groupId = path.length >= 2 ? path[1] : 'other';
        if (!groups.has(groupId)) groups.set(groupId, { id: groupId,
            label: groupId === 'other' ? 'Other recorded HPO terms' : ontology.nodes[groupId][0], count: 0, terms: [] });
        const group = groups.get(groupId);
        group.terms.push({ id, label: ontology.nodes[id] ? ontology.nodes[id][0] : id });
        group.count++;
    }
    sample.phenotypeGroups = [...groups.values()];
    sample.phenotypeTotal = observed.length;
    return sample;
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
    sampleFromInfoRow,
};
