import { query } from "@/utils/pbBioIndex";

const { canonicalSampleId, emptyPbSample, sampleFromInfoRow } = require("./sampleRecord");

export async function fetchPbSampleBioIndexState(sampleId) {
    const canonicalId = canonicalSampleId(sampleId);
    const requested = String(sampleId || '').trim().replace(/_[EG]38$/i, suffix => suffix.toUpperCase());
    const keys = /_[EG]38$/i.test(requested) ? [requested] : [`${canonicalId}_E38`, `${canonicalId}_G38`];
    const errors = [];
    for (const key of keys) {
        try {
            const rows = await query('samples-info', key, { limit: 5 });
            const exact = rows.find(row => row.SampleInVCF === key && canonicalSampleId(row.sample_id) === canonicalId);
            if (exact) return { sample: sampleFromInfoRow(exact), patientStatus: 'live', patientError: '' };
        } catch (error) { errors.push(error.message || 'Unable to load sample metadata.'); }
    }
    return { sample: emptyPbSample(canonicalId), patientStatus: errors.length ? 'unavailable' : 'not-found', patientError: errors.join(' ') };
}
