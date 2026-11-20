const crypto = require('crypto');
const path = require('node:path');
const QUALITY = 'dp20_af001';
const canonical = id => String(id).replace(/_[EG]38$/i, '');
const variantId = row => `chr${String(row.chromosome || row.CHROM).replace(/^chr/i, '')}:${row.position || row.POS}:${row.reference || row.REF}:${row.alt || row.ALT}`;

module.exports = function registerGeneVariantQuality(app, provider, options = {}) {
    const cache = new Map();
    const readQuality = options.readVariantQuality || (async body => {
        const host = process.env.PB_GENE_QUALITY_HOST_PRIVATE || 'http://127.0.0.1:8096';
        const response = await fetch(new URL('/phenotype-analyzer-api/gene-variant-quality', host), {
            method: 'POST', headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(body), signal: AbortSignal.timeout(240000),
        });
        if (!response.ok) throw Error('Original VCF quality filtering is unavailable.');
        return response.json();
    });
    async function qualified(gene, token) {
        const key = crypto.createHash('sha256').update(JSON.stringify([gene, token])).digest('hex');
        if (cache.has(key) && cache.get(key).expires < Date.now()) cache.delete(key);
        if (!cache.has(key)) {
            const promise = (async () => {
                const rows = await provider.readRows(gene, token);
                if (!rows.length) {
                    return {gene, quality: QUALITY, status: 'no_source_variants', source: null,
                        variantRows: [], byVariant: new Map(), all: new Set()};
                }
                const membership = new Map();
                for (const row of rows) {
                    const id = variantId(row);
                    if (!/^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i.test(id)) continue;
                    if (!membership.has(id)) membership.set(id, new Set());
                    for (const sample of row.samples || []) if (typeof sample === 'string' && sample) membership.get(id).add(sample);
                }
                const ids = [...membership.keys()].sort();
                if (!ids.length) throw Error('No valid source variant identifiers returned for this gene.');
                const samples = [...new Set([...membership.values()].flatMap(set => [...set]))].sort();
                const result = await readQuality({variant_ids: ids, sample_ids: samples});
                if (result.min_depth !== 20 || result.max_af_exclusive !== 0.01 ||
                    !result.source || result.source.kind !== 'original_vcf_dp20_af001' ||
                    !Array.isArray(result.variants) || result.variants.length !== ids.length ||
                    new Set(result.variants.map(row => row.variant_id)).size !== ids.length)
                    throw Error('Unverified VCF quality response.');
                const representatives = new Map();
                for (const id of samples) if (!representatives.has(canonical(id))) representatives.set(canonical(id), id);
                const filtered = new Map();
                for (const row of result.variants) {
                    const allowed = membership.get(row.variant_id);
                    if (!allowed || !Array.isArray(row.sample_ids) ||
                        !Number.isSafeInteger(row.ac) || !Number.isSafeInteger(row.an) || row.ac < 0 || row.an < row.ac ||
                        (row.an ? typeof row.af !== 'number' || Math.abs(row.af - row.ac / row.an) > 1e-12 : row.af !== null) ||
                        row.sample_ids.some(id => typeof id !== 'string' || !representatives.has(canonical(id))) ||
                        (row.af == null || row.af >= 0.01) && row.sample_ids.length)
                        throw Error('Invalid VCF quality membership or allele frequency.');
                    const allowedCanonical = new Set([...allowed].map(canonical));
                    const passing = new Set(row.sample_ids.filter(id => allowedCanonical.has(canonical(id)))
                        .map(id => representatives.get(canonical(id))));
                    filtered.set(row.variant_id, {...row, samples: [...passing]});
                }
                const variantRows = rows.flatMap(row => {
                    const match = filtered.get(variantId(row));
                    return match && match.samples.length ? [{...row, samples: match.samples, ac: match.ac, an: match.an, af: match.af}] : [];
                });
                const byVariant = new Map([...filtered].filter(([, row]) => row.samples.length).map(([id, row]) => [id, new Set(row.samples)]));
                const source = { ...result.source };
                if (source.source_file) source.source_file = path.basename(source.source_file);
                return {gene, quality: QUALITY, source, variantRows, byVariant,
                    all: new Set([...byVariant.values()].flatMap(set => [...set]))};
            })().catch(error => {cache.delete(key); throw error;});
            cache.set(key, {promise, expires: Date.now() + 15 * 60 * 1000});
            if (cache.size > 5) cache.delete(cache.keys().next().value);
        }
        return cache.get(key).promise;
    }
    app.get('/__gene_qualified_variants__', async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const gene = String(request.query.gene || '').trim().toUpperCase();
        if (!/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene)) {response.status(400).json({error:'Enter a valid gene.'});return;}
        try {
            const result = await qualified(gene, provider.accessToken(request));
            response.json({gene, quality: QUALITY, status: result.status, source: result.source, variantRows: result.variantRows});
        } catch (_) {response.status(502).json({error:'DP>=20 / cohort AF<0.01 VCF evidence is unavailable. Please retry.'});}
    });
    return qualified;
};
module.exports.QUALITY = QUALITY;
