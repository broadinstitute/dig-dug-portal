// Private, bounded metadata batches for the already-selected exact variant.
// Uses the Gene endpoint's source/auth-scoped cache and queue; never use as a public aggregate route.
const express = require('express');
const VARIANT = /^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i;

module.exports = function registerVariantCarrierMetadata(app, provider) {
    const readHpoCounts = provider.readHpoCounts || require('./variant_hpo_term_counts_source')();
    app.post('/__pb_variant_carrier_metadata__', express.json({ limit: '128kb' }), async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const { gene, variant, sample_ids: requested } = request.body || {};
        if (typeof gene !== 'string' || !/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene)
            || typeof variant !== 'string' || !VARIANT.test(variant)
            || !Array.isArray(requested) || !requested.length || requested.length > 100
            || requested.some(id => typeof id !== 'string' || !id || id.length > 200)) {
            response.status(400).json({ error: 'Enter a valid gene, exact variant and up to 100 carrier IDs.' }); return;
        }
        try {
            const token = provider.accessToken(request);
            const carriers = await provider.carriersForGene(gene, token);
            const key = [...carriers.byVariant.keys()].find(id => id.toLowerCase() === variant.toLowerCase());
            const allowed = key && carriers.byVariant.get(key);
            const ids = [...new Set(requested)];
            if (!allowed || ids.some(id => !allowed.has(id))) {
                response.status(400).json({ error: 'A requested sample is not a carrier of this variant.' }); return;
            }
            let next = 0;
            const hpoCounts = readHpoCounts();
            const metadata = {};
            const failed = [];
            await Promise.all(Array.from({ length: Math.min(12, ids.length) }, async () => {
                while (next < ids.length) {
                    const id = ids[next++];
                    try {
                        const info = await provider.sampleInfo(id, token);
                        if (!info) { metadata[id] = null; continue; }
                        const canonical = id.replace(/_[EG]38$/i, '');
                        const count = hpoCounts && hpoCounts.counts[canonical];
                        const knownCount = Number.isInteger(count) && count >= 0;
                        const empty = Array.isArray(info.hpoIds) && info.hpoIds.length === 0;
                        metadata[id] = {...info, n_terms: knownCount ? count : empty ? 0 : null,
                            n_terms_status: knownCount ? 'scoring_matrix' : empty ? 'empty_phenotype_record' : hpoCounts ? 'not_in_scoring_matrix' : 'source_unavailable'};
                    }
                    catch (_) { failed.push(id); }
                }
            }));
            response.json({ gene, variant, metadata, failed, n_terms_source: hpoCounts && hpoCounts.source });
        } catch (_) {
            response.status(502).json({ error: 'Private variant carrier metadata is unavailable.' });
        }
    });
};
