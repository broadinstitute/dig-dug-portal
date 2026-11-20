// Count recorded HPO presence separately from residual-score availability.
const express = require('express');
const crypto = require('crypto');
const VARIANT = /^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i;

function countMatches(samples, info, hpos) {
    let known = 0, matched = 0;
    for (const id of samples) {
        const record = info.get(id);
        if (!record || !Array.isArray(record.hpoIds)) continue;
        known++;
        if (hpos.some(term => record.hpoIds.includes(term))) matched++;
    }
    return {count: known || !samples.size ? matched : null, metadataCount: known,
        carrierTotal: samples.size, complete: known === samples.size};
}

module.exports = function registerVariantHpoCounts(app, provider) {
    const jobs = new Map();
    app.post('/__gene_variant_hpo_counts__', express.json({limit: '1mb'}), async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const body = request.body || {};
        const gene = String(body.gene || '').trim().toUpperCase();
        const geneScope = body.scope === 'gene';
        const variants = geneScope ? [] : body.variant_ids;
        const terms = body.hpo_terms;
        const selection = body.sample_ids;
        const quality = body.quality === 'dp20_af001' ? 'dp20_af001' : '';
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) || !Array.isArray(variants) || variants.length > 20000 ||
            variants.some(id => typeof id !== 'string' || !VARIANT.test(id)) || !Array.isArray(terms) || !terms.length || terms.length > 50 ||
            terms.some(id => typeof id !== 'string' || !/^HP:\d{7}$/.test(id)) ||
            (geneScope && (body.variant_ids != null || selection != null)) ||
            (selection != null && (!Array.isArray(selection) || selection.length > 50000 || selection.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_.-]{1,150}$/.test(id))))) {
            response.status(400).json({error: 'Enter a valid gene, variant selection and HPO profile.'}); return;
        }
        const ids = [...new Set(variants)].sort();
        const hpos = [...new Set(terms)].sort();
        const sampleIds = selection == null ? null : [...new Set(selection)].sort();
        const selected = sampleIds == null ? null : new Set(sampleIds);
        const token = provider.accessToken(request);
        const scope = crypto.createHash('sha256').update(token).digest('hex');
        const key = JSON.stringify([scope, gene, geneScope, ids, hpos, sampleIds, quality]);
        try {
            if (jobs.has(key) && jobs.get(key).expires < Date.now()) jobs.delete(key);
            if (!jobs.has(key)) {
                const promise = (async () => {
                    const carriers = await provider.carriersForGene(gene, token, quality);
                    if (ids.some(id => !carriers.byVariant.has(id))) {
                        const error = new Error('A selected variant is unavailable for this gene.'); error.status = 400; throw error;
                    }
                    const allSamples = geneScope ? carriers.all : new Set(ids.flatMap(id => [...carriers.byVariant.get(id)]));
                    if (sampleIds && sampleIds.some(id => !allSamples.has(id))) {
                        const error = new Error('A selected sample is not a carrier of the requested variant.'); error.status = 400; throw error;
                    }
                    const samples = [...allSamples].filter(id => !selected || selected.has(id));
                    const info = new Map();
                    let next = 0;
                    await Promise.all(Array.from({length: Math.min(24, samples.length)}, async () => {
                        while (next < samples.length) {
                            const id = samples[next++];
                            info.set(id, await provider.sampleInfo(id, token));
                        }
                    }));
                    if (geneScope) return {gene, hpo_terms: hpos, match: 'any', population: 'observed_gene_carriers',
                        gene_carriers: countMatches(allSamples, info, hpos)};
                    const counts = {};
                    for (const id of ids) {
                        const people = new Set([...carriers.byVariant.get(id)].filter(sid => !selected || selected.has(sid)));
                        counts[id] = countMatches(people, info, hpos);
                    }
                    return {gene, hpo_terms: hpos, match: 'any', population: 'observed_variant_carriers', variants: counts,
                        ...(sampleIds == null ? {} : {sample_scope: {sample_ids: sampleIds}})};
                })();
                jobs.set(key, {promise, expires: Date.now() + 15 * 60 * 1000});
                if (jobs.size > 20) jobs.delete(jobs.keys().next().value);
            }
            response.json(await jobs.get(key).promise);
        } catch (error) {
            jobs.delete(key);
            response.status(error.status || 502).json({error: error.status === 400 ? error.message : 'Recorded HPO carrier counts are unavailable.'});
        }
    });
};
