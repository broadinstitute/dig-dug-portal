import { query } from "@/utils/bioIndexUtils";

const { canonicalSampleId, emptyPbSample, sampleFromPatientRow } = require("./sampleRecord");

async function queryPrivate(index, q, limit = null) {
    let error = "";
    const rows = await query(index, q, {
        limit,
        onError: response => { error = response.detail || `Unable to query ${index}.`; },
    }, true);
    return { rows, error };
}

export async function fetchPbSampleBioIndexState(sampleId) {
    const canonicalId = canonicalSampleId(sampleId);
    const patient = await queryPrivate("patient", canonicalId, 1);
    const sample = patient.rows.length ? sampleFromPatientRow(patient.rows[0], canonicalId) : emptyPbSample(canonicalId);

    return {
        sample,
        patientStatus: patient.error ? "unavailable" : patient.rows.length ? "live" : "not-found",
        patientError: patient.error,
    };
}
