const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const register = require('./gene_carrier_hpo_totals_endpoint');

(async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'scoring-hpo-test-'));
    try {
        const matrixPath = path.join(root, 'matrix.tsv.gz'), aliasesPath = path.join(root, 'map.tsv');
        const matrix = zlib.gzipSync('sample_id\tHP:0001250\tHP:0001252\tHP:0000365\nA\t1\t1\t1\nB\t0\t0\t0\nC\t0\t1\t0\n');
        await fs.writeFile(matrixPath, matrix);
        await fs.writeFile(aliasesPath, 'sample_id\tvcf_sample_id\nA\tVCF_A\nB\tVCF_B\n');
        const hash = crypto.createHash('sha256').update(matrix).digest('hex');
        const options = {matrixPath, aliasesPath, expectedSha256: hash};
        const load = register.createScoringHpoTotals(matrixPath, aliasesPath, hash);
        const totals = await load();
        assert.equal(totals.countFor('VCF_A'), 3);
        assert.equal(totals.countFor('VCF_B'), 0, 'An all-zero row is a known zero');
        assert.equal(totals.countFor('C_E38'), 1);
        assert.equal(totals.countFor('C_G38'), 1);
        assert.equal(totals.countFor('MISSING'), null, 'Absent samples must not become zero');
        assert.equal(totals.source.matrix_sha256, hash);
        assert.equal(await load(), totals, 'Reuse row sums while the source is unchanged');
        let handler, scope;const handlers={};
        const variant = 'chr1:100:A:G';
        register({post(route, ...callbacks) {handler = callbacks.at(-1);handlers[route]=handler;}}, {
            accessToken: () => 'private-session',
            sampleInfo: async id => ({age: {VCF_A: '53', VCF_B: '0', MISSING: 'Unknown'}[id]}),
            carriersForGene: async (_gene, token) => {
                scope = token;
                return {byVariant: new Map([[variant, new Set(['VCF_A', 'VCF_B', 'MISSING'])]])};
            },
        }, options);
        async function call(body) {
            const response = {code: 200, set() {}, status(code) {this.code = code; return this;}, json(value) {this.value = value;}};
            await handler({body}, response); return response;
        }
        const body = {gene: 'TEST', variant, sample_ids: ['VCF_A', 'VCF_B', 'MISSING', 'VCF_A']};
        const result = await call(body);
        assert.equal(result.code, 200);
        assert.equal(scope, 'private-session');
        assert.deepEqual(result.value.counts, {VCF_A: 3, VCF_B: 0, MISSING: null});
        assert.equal((await call({...body, sample_ids: ['OUTSIDE']})).code, 400);
        assert.equal((await call({...body, sample_ids: Array(101).fill('VCF_A')})).code, 400);
        assert.equal((await call({...body, variant: 'chr2:1:A:T'})).code, 400);
        handler=handlers['/__gene_carrier_sort_values__'];
        assert.deepEqual((await call({...body,field:'age'})).value.values,{VCF_A:53,VCF_B:0,MISSING:null});
        assert.deepEqual((await call({...body,field:'hpoTerms'})).value.values,{VCF_A:3,VCF_B:0,MISSING:null});
        assert.equal((await call({...body,field:'age',sample_ids:['OUTSIDE']})).code,400);
        assert.equal((await call({...body,field:'unsupported'})).code,400);
        await assert.rejects(register.createScoringHpoTotals(matrixPath, aliasesPath, 'wrong-hash')(), /hash/);
        const unpinned = register.createScoringHpoTotals(matrixPath, aliasesPath);
        assert.equal((await unpinned()).countFor('A'), 3);
        await fs.writeFile(matrixPath, zlib.gzipSync('sample_id\tHP:0001250\nA\t0\n'));
        assert.equal((await unpinned()).countFor('A'), 0, 'Changing matrix source invalidates the row-sum cache');
        await fs.writeFile(matrixPath, zlib.gzipSync('sample_id\tHP:0001250\nA\t2\n'));
        await assert.rejects(unpinned(), /binary/);
        await fs.writeFile(matrixPath, zlib.gzipSync('sample_id\tHP:0001250\nA\t1\nA\t0\n'));
        await assert.rejects(unpinned(), /sample row/);
        console.log('Scoring HPO totals: binary row sums, ID mapping, zero/missing, carrier scope, source hash and cache refresh PASS');
    } finally {await fs.rm(root, {recursive: true, force: true});}
})().catch(error => {console.error(error); process.exitCode = 1;});
