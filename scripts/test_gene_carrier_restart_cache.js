const assert = require('assert');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');
const register = require('./gene_carrier_summary_endpoint');
const pause = ms => new Promise(resolve => setTimeout(resolve, ms));

(async () => {
    const root = await fs.mkdtemp(path.join(os.tmpdir(), 'carrier-restart-test-'));
    const originalFetch = global.fetch;
    const previousRoot = process.env.PB_GENE_CARRIER_CACHE_DIR;
    process.env.PB_GENE_CARRIER_CACHE_DIR = root;
    let metadataCalls = 0;
    let variantCalls = 0;
    let build = 'build-1';
    global.fetch = async url => {
        const parsed = new URL(url);
        let data;
        if (parsed.pathname.endsWith('/indexes')) {
            data = ['samples-info', 'gene-variants-crdc'].map(index => ({index, built: build, schema: index}));
        } else if (parsed.pathname.endsWith('/gene-variants-crdc')) {
            variantCalls++;
            data = [{chromosome: '1', position: 100, reference: 'A', alt: 'G', samples: ['TEST_G38']}];
        } else if (parsed.pathname.endsWith('/samples-info')) {
            metadataCalls++;
            data = [{SampleInVCF: 'TEST_G38', gender: 'female', age_at_enrollment: 12,
                clean_name: 'Project A', investigator: 'Investigator A', genes: ['TEST']}];
        } else throw new Error(`Unexpected ${parsed.pathname}`);
        return {ok: true, json: async () => ({data})};
    };
    function instance(token = '') {
        const handlers = {};
        register({get(route, fn) {handlers[route] = fn;}, post() {}}, 'http://source.test');
        return () => new Promise(resolve => handlers['/__gene_carrier_summary__'](
            {query: {gene: 'TEST'}, headers: {cookie: token ? `session=${token}` : ''}},
            {set() {}, json: resolve, status(code) {throw new Error(`Unexpected ${code}`);}}));
    }
    async function ready(call) {
        for (let n = 0; n < 100; n++) {
            const result = await call();
            if (result.status === 'error') throw new Error(result.error);
            if (result.status === 'ready') return result;
            await pause(10);
        }
        throw new Error('Summary did not finish');
    }
    try {
        const cold = await ready(instance());
        assert.strictEqual(cold.matchedMetadataCount, 1);
        // Wait for the asynchronous atomic summary save before simulating a restart.
        for (let n = 0; n < 100; n++) {
            const directories = await fs.readdir(root);
            const files = (await Promise.all(directories.map(dir => fs.readdir(path.join(root, dir))))).flat();
            if (files.includes('summary-TEST.json.gz')) break;
            await pause(10);
        }
        const warm = await ready(instance());
        assert.deepStrictEqual(warm.geneCarrierDemographics, cold.geneCarrierDemographics);
        assert.strictEqual(metadataCalls, 1, 'A restarted server must reuse exact source metadata');
        assert.strictEqual(variantCalls, 1, 'A restarted server must reuse its carrier sets');
        await ready(instance('different-session'));
        assert.strictEqual(metadataCalls, 2, 'A different authorization scope must fetch separately');
        build = 'build-2';
        await ready(instance());
        assert.strictEqual(metadataCalls, 3, 'A source rebuild must invalidate previous records');
        await pause(30);
        console.log('Carrier endpoint restart cache: reused results, session isolation and rebuild invalidation PASS');
    } finally {
        global.fetch = originalFetch;
        if (previousRoot === undefined) delete process.env.PB_GENE_CARRIER_CACHE_DIR;
        else process.env.PB_GENE_CARRIER_CACHE_DIR = previousRoot;
        await fs.rm(root, {recursive: true, force: true});
    }
})().catch(error => {console.error(error); process.exitCode = 1;});
