// Private server-side lookup. Only a selected gene's calls enter memory.
const fs = require('fs/promises');
const path = require('path');
const crypto = require('crypto');
const { createReadStream } = require('fs');
const { promisify } = require('util');
const gunzip = promisify(require('zlib').gunzip);
const SOURCE_SHA256 = 'e602b847ccdba8961f788701b43004514346490f55164dd3023be23aa7c6bbc7';
const canonicalSample = id => String(id).replace(/_[EG]38$/i, '');
const canonicalVariant = id => String(id).replace(/^chr/i, '').toUpperCase();
const key = (variant, sample) => `${canonicalVariant(variant)}|${canonicalSample(sample)}`;

module.exports = function processedGenotypeSource(directory = process.env.PB_GENOTYPE_INDEX) {
    let pending;
    const genes = new Map();
    async function open() {
        if (!directory) return null;
        if (!pending) {
            pending = (async () => {
                const manifest = JSON.parse(await fs.readFile(path.join(directory, 'manifest.json'), 'utf8'));
                if (manifest.format !== 1 || manifest.source_sha256 !== SOURCE_SHA256
                    || !/^genotypes-[a-f0-9]{64}\.bin$/.test(manifest.packed_file)) {
                    throw Error('Unexpected genotype source manifest.');
                }
                const filename = path.join(directory, manifest.packed_file);
                const hash = crypto.createHash('sha256');
                for await (const chunk of createReadStream(filename)) hash.update(chunk);
                if (hash.digest('hex') !== manifest.packed_sha256) throw Error('Genotype index checksum mismatch.');
                return { manifest, filename };
            })().catch(error => { pending = null; throw error; });
        }
        return pending;
    }
    return async function readGene(gene) {
        const source = await open();
        if (!source) return null;
        if (!genes.has(gene)) {
            const loading = (async () => {
                const range = source.manifest.genes[gene];
                const calls = new Map();
                if (range) {
                    const [offset, length] = range;
                    const handle = await fs.open(source.filename, 'r');
                    let bytes;
                    try {
                        bytes = Buffer.alloc(length);
                        const { bytesRead } = await handle.read(bytes, 0, length, offset);
                        if (bytesRead !== length) throw Error('Incomplete genotype index member.');
                    } finally { await handle.close(); }
                    const rows = JSON.parse((await gunzip(bytes)).toString('utf8'));
                    for (const [sample, variant, gt] of rows) {
                        if (gt == null || gt.includes('.')) continue;
                        const id = key(variant, sample);
                        if (!calls.has(id)) calls.set(id, { gt, status: 'matched' });
                        else if (calls.get(id).gt !== gt) calls.set(id, { gt: null, status: 'conflict' });
                    }
                }
                return { calls, source: { data_version: source.manifest.data_version,
                    source_file: source.manifest.source_file, source_sha256: source.manifest.source_sha256,
                    scope: source.manifest.scope } };
            })().catch(error => { genes.delete(gene); throw error; });
            genes.set(gene, loading);
            if (genes.size > 5) genes.delete(genes.keys().next().value);
        }
        return genes.get(gene);
    };
};
module.exports.callKey = key;
