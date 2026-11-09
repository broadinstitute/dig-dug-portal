import { query } from "@/utils/bioIndexUtils";

const { canonicalSampleId, emptyPbSample, sampleFromInfoRow } = require("./sampleRecord");

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
    const requested = String(sampleId || '').trim().replace(/_[EG]38$/i, suffix => suffix.toUpperCase());
    const keys = /_[EG]38$/i.test(requested) ? [requested] : [`${canonicalId}_E38`, `${canonicalId}_G38`];
    const errors = [];
    for (const key of keys) {
        try {
            const result = await queryPrivate('samples-info', key, 5);
            if (result.error) errors.push(result.error);
            const exact = result.rows.find(row => row.SampleInVCF === key && canonicalSampleId(row.sample_id) === canonicalId);
            if (exact) return { sample: sampleFromInfoRow(exact), patientStatus: 'live', patientError: '' };
        } catch (error) { errors.push(error.message || 'Unable to load sample metadata.'); }
    }
    return { sample: emptyPbSample(canonicalId), patientStatus: errors.length ? 'unavailable' : 'not-found', patientError: errors.join(' ') };
}
