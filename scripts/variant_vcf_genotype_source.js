// Missing processed-release calls use the original VCF through the private API.
// The caller must authorize the exact variant and sample set before invoking it.
const http = require('http');
const https = require('https');
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
module.exports = function variantVcfGenotypes(host = process.env.PB_VARIANT_CONTEXT_HOST_PRIVATE || 'http://127.0.0.1:8095',
    cacheDirectory = process.env.PB_VARIANT_GT_CACHE_DIR || path.resolve(__dirname, '../.pb-private-data/genotypes/original-vcf')) {
    const jobs = new Map();
    return async (variant, samples) => {
        const ids = [...new Set(samples)].sort();
        const key = JSON.stringify([variant, ids]);
        const filename = path.join(cacheDirectory, crypto.createHash('sha256').update(host+'|crdc-2025-original-vcf|'+key).digest('hex')+'.json');
        const checksum = result => crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
        const valid = result => result && result.variant_id === variant && result.source && result.source.kind === 'original_vcf' &&
            Array.isArray(result.rows) && result.rows.length === ids.length && new Set(result.rows.map(row=>row.sample_id)).size === ids.length &&
            result.rows.every(row=>row.variant_id === variant && ids.includes(row.sample_id));
        if (!jobs.has(key)) {
            const promise = (async () => {
                try {
                    const cached = JSON.parse(await fs.readFile(filename,'utf8'));
                    if (cached.format === 1 && valid(cached.result) && checksum(cached.result) === cached.sha256) return cached.result;
                } catch (_) {   }
                const result = await new Promise((resolve, reject) => {
                const url = new URL('/phenotype-analyzer-api/carrier-genotypes', host);
                const body = JSON.stringify({variant_id: variant, sample_ids: ids});
                const request = (url.protocol === 'https:' ? https : http).request(url, {
                    method: 'POST', headers: {'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body)},
                }, response => {
                    let text = '';
                    response.setEncoding('utf8');
                    response.on('data', chunk => { text += chunk; if (text.length > 8 * 1024 * 1024) request.destroy(Error('GT response too large')); });
                    response.on('end', () => {
                        try {
                            if (response.statusCode !== 200) throw Error('Original VCF genotype lookup unavailable.');
                            const result = JSON.parse(text);
                            if (!valid(result)) throw Error('GT selection mismatch.');
                            resolve(result);
                        } catch (error) { reject(error); }
                    });
                });
                request.setTimeout(70000, () => request.destroy(Error('Original VCF genotype lookup timed out.')));
                request.on('error', reject);
                request.end(body);
                });
                await fs.mkdir(cacheDirectory,{recursive:true,mode:0o700});
                const temporary = filename+'.'+crypto.randomBytes(8).toString('hex')+'.tmp';
                await fs.writeFile(temporary,JSON.stringify({format:1,result,sha256:checksum(result)}),{mode:0o600});
                await fs.rename(temporary,filename);
                return result;
            })().catch(error => { jobs.delete(key); throw error; });
            jobs.set(key, promise);
            if (jobs.size > 32) jobs.delete(jobs.keys().next().value);
        }
        return jobs.get(key);
    };
};
