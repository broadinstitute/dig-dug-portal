// Variant-specific information stays on carrier records, never in a cache
// keyed by sample alone. The endpoint returns original CRDC sample IDs.
function applyCarrierGenotypes(variants, response) {
    const calls = new Map();
    for (const row of response.rows || []) {
        const key = `${String(row.variant_id).replace(/^chr/i, '').toUpperCase()}|${row.sample_id}`;
        const previous = calls.get(key);
        if (previous && (previous.gt !== row.gt || previous.status !== row.status)) {
            calls.set(key, { gt: null, status: 'conflict' });
        } else if (!previous) calls.set(key, row);
    }
    return variants.map(variant => ({ ...variant,
        carrierSamples: variant.carrierSamples.map(sample => {
            const call = calls.get(`${variant.id.replace(/^chr/i, '').toUpperCase()}|${sample.id}`);
            const matched = call && call.status === 'matched' && typeof call.gt === 'string'
                && /^(?:\d+)(?:[/|]\d+)*$/.test(call.gt);
            return { ...sample, gt: matched ? call.gt : 'Unavailable',
                gtStatus: matched ? 'matched' : call && call.status === 'conflict' ? 'conflict' : 'not_in_source',
                gtSource: response.source || null };
        }),
    }));
}
module.exports = { applyCarrierGenotypes };
