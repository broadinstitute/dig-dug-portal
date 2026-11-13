// Private n_terms lookup from the actual rPheRS input matrix, never metadata length.
const fs = require('fs');
const crypto = require('crypto');
const zlib = require('zlib');
const readline = require('readline');
const express = require('express');
const VARIANT = /^chr(?:[0-9]{1,2}|X|Y|M|MT):[1-9][0-9]*:[ACGTN*.-]+:[ACGTN*.,-]+$/i;

async function readLines(file, visit, digest) {
    const source = fs.createReadStream(file);
    if (digest) source.on('data', chunk => digest.update(chunk));
    const input = file.endsWith('.gz') ? source.pipe(zlib.createGunzip()) : source;
    if (input !== source) source.on('error', error => input.destroy(error));
    const lines = readline.createInterface({input, crlfDelay: Infinity});
    try { for await (const line of lines) visit(line); }
    finally { lines.close(); input.destroy(); source.destroy(); }
}

function createScoringHpoTotals(matrixPath, aliasesPath, expectedSha256) {
    let cached;
    return async function totals() {
        if (!matrixPath) throw new Error('The rPheRS scoring matrix is not configured.');
        const paths = [matrixPath, ...(aliasesPath ? [aliasesPath] : [])];
        const stats = await Promise.all(paths.map(file => fs.promises.stat(file)));
        const key = JSON.stringify(stats.map((stat, i) => [paths[i], stat.size, stat.mtimeMs, stat.ctimeMs, stat.ino]));
        if (!cached || cached.key !== key) {
            const promise = (async () => {
                const counts = new Map(), aliases = new Map();
                const digest = crypto.createHash('sha256');
                let header;
                await readLines(matrixPath, line => {
                    const fields = line.split('\t');
                    if (!header) {
                        header = fields;
                        if (header[0] !== 'sample_id' || header.length < 2 || new Set(header.slice(1)).size !== header.length - 1)
                            throw new Error('Invalid scoring matrix header.');
                        return;
                    }
                    const [id, ...values] = fields;
                    if (!id || counts.has(id) || fields.length !== header.length) throw new Error('Invalid scoring matrix sample row.');
                    let total = 0;
                    for (const value of values) {
                        const number = value.trim() === '' ? NaN : Number(value);
                        if (number !== 0 && number !== 1) throw new Error('The scoring HPO matrix must be binary.');
                        total += number;
                    }
                    counts.set(id, total);
                }, digest);
                if (!header || !counts.size) throw new Error('The scoring HPO matrix is empty.');
                const sha256 = digest.digest('hex');
                if (expectedSha256 && sha256 !== expectedSha256) throw new Error('The scoring matrix source hash does not match.');
                if (aliasesPath) {
                    let columns;
                    await readLines(aliasesPath, line => {
                        const fields = line.split('\t');
                        if (!columns) {
                            columns = {id: fields.indexOf('sample_id'), vcf: fields.indexOf('vcf_sample_id')};
                            if (columns.id < 0 || columns.vcf < 0) throw new Error('The scoring ID mapping is missing required columns.');
                            return;
                        }
                        const id = fields[columns.id], vcf = fields[columns.vcf];
                        if (!id || !vcf) return;
                        if (aliases.has(vcf) && aliases.get(vcf) !== id) throw new Error('Ambiguous scoring sample ID mapping.');
                        aliases.set(vcf, id);
                    });
                }
                return {
                    countFor(id) {
                        const key = counts.has(id) ? id : aliases.has(id) ? aliases.get(id) : id.replace(/_[EG]38$/i, '');
                        return counts.has(key) ? counts.get(key) : null;
                    },
                    source: {method: 'binary_hpo_matrix_row_sum', covariate: 'n_terms', matrix_sha256: sha256,
                        sample_count: counts.size, hpo_column_count: header.length - 1},
                };
            })();
            const entry = {key, promise};
            cached = entry;
            promise.catch(() => { if (cached === entry) cached = null; });
        }
        return cached.promise;
    };
}

function registerCarrierHpoTotals(app, provider, options = {}) {
    const load = createScoringHpoTotals(options.matrixPath, options.aliasesPath, options.expectedSha256);
    app.post('/__gene_carrier_sort_values__', express.json({limit: '128kb'}), async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const {gene, variant, field, sample_ids: requested} = request.body || {};
        if (typeof gene !== 'string' || !/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) || typeof variant !== 'string' || !VARIANT.test(variant)
            || !['age','hpoTerms'].includes(field) || !Array.isArray(requested) || !requested.length || requested.length > 100
            || requested.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(id))) {
            response.status(400).json({error: 'Enter a valid carrier selection and numeric sort field.'}); return;
        }
        try {
            const token = provider.accessToken(request);
            const carriers = await provider.carriersForGene(gene, token);
            const allowed = carriers.byVariant.get(variant), ids = [...new Set(requested)];
            if (!allowed || ids.some(id => !allowed.has(id))) {
                response.status(400).json({error: 'A requested sample is not a carrier of this variant.'}); return;
            }
            const values = {};
            if (field === 'hpoTerms') {
                const totals = await load();
                ids.forEach(id => {values[id] = totals.countFor(id);});
            } else {
                let next = 0;
                await Promise.all(Array.from({length: Math.min(12, ids.length)}, async () => {
                    while (next < ids.length) {
                        const id = ids[next++], info = await provider.sampleInfo(id, token, gene);
                        const age = info && info.age;
                        const value = age != null && String(age).trim() !== '' ? Number(age) : NaN;
                        values[id] = Number.isFinite(value) && value >= 0 && value <= 100 ? value : null;
                    }
                }));
            }
            response.json({gene, variant, field, values});
        } catch (_) {response.status(502).json({error: 'Carrier sorting values are unavailable.'});}
    });
    app.post('/__gene_carrier_hpo_totals__', express.json({limit: '128kb'}), async (request, response) => {
        response.set('Cache-Control', 'private, no-store');
        response.set('X-Content-Type-Options', 'nosniff');
        const {gene, variant, sample_ids: requested} = request.body || {};
        if (typeof gene !== 'string' || !/^[A-Z0-9][A-Z0-9.-]{0,31}$/.test(gene) || typeof variant !== 'string' || !VARIANT.test(variant)
            || !Array.isArray(requested) || !requested.length || requested.length > 100
            || requested.some(id => typeof id !== 'string' || !/^[A-Za-z0-9_-]{1,200}$/.test(id))) {
            response.status(400).json({error: 'Enter a valid gene, variant and up to 100 carrier IDs.'}); return;
        }
        try {
            const carriers = await provider.carriersForGene(gene, provider.accessToken(request));
            const allowed = carriers.byVariant.get(variant);
            const ids = [...new Set(requested)];
            if (!allowed || ids.some(id => !allowed.has(id))) {
                response.status(400).json({error: 'A requested sample is not a carrier of this variant.'}); return;
            }
            const totals = await load();
            response.json({gene, variant, counts: Object.fromEntries(ids.map(id => [id, totals.countFor(id)])), source: totals.source});
        } catch (_) {
            response.status(502).json({error: 'Scoring-matrix HPO totals are unavailable.'});
        }
    });
}

module.exports = registerCarrierHpoTotals;
module.exports.createScoringHpoTotals = createScoringHpoTotals;
