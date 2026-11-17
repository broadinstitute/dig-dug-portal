const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');
const register = require('./gene_genotype_endpoint');
const {callKey} = require('./processed_genotype_source');

function load(relative, overrides = {}, runtime = {}, stub = false) {
    const filename = path.resolve(relative), module = {exports: {}};
    const localRequire = createRequire(filename);
    let source = fs.readFileSync(filename, 'utf8');
    if (relative.endsWith('.vue')) source = compiler.parseComponent(source).script.content;
    const code = babel.transformSync(source, {babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs']}).code;
    vm.runInNewContext(code, {module, exports: module.exports, structuredClone, URLSearchParams, URL,
        process: {env: {}}, window: {location: {search: ''}},
        require: name => Object.hasOwn(overrides, name) ? overrides[name] : stub ? {} : localRequire(name),
        ...runtime});
    return module.exports;
}

const target = 'chr13:20189546:AC:A', covered = 'chr13:20189553:AG:A';
let handler, unavailable = false, mismatch = false, release;
const requests = [], vcfRequests = [];
register({get(_, callback) {handler = callback;}}, {
    accessToken: () => '',
    carriersForGene: async () => ({byVariant: new Map([
        [target, new Set(['A_E38', 'B_E38'])], [covered, new Set(['C_E38'])],
    ])}),
}, {
    readGenotypes: async () => ({source: {data_version: 'fixture'}, calls: new Map([
        [callKey(covered, 'C_E38'), {gt: '1|1', status: 'matched'}],
    ])}),
    readVariantGenotypes: async (variant, samples) => {
        vcfRequests.push({variant, samples});
        if (unavailable) throw Error('offline');
        return {source: {kind: 'original_vcf'}, rows: samples.map((sample_id, index) => ({
            variant_id: variant, sample_id, gt: index ? '1/1' : '0/1', status: 'matched',
        }))};
    },
});
const adapter = load('src/views/PbGene/pbGeneBioIndexAdapter.js', {
    '@/utils/bioIndexUtils': {query: async index => index === 'gene' ? [] : [
        {chromosome: '13', position: 20189546, reference: 'AC', alt: 'A', samples: ['A_E38', 'B_E38'], af: .0094},
        {chromosome: '13', position: 20189553, reference: 'AG', alt: 'A', samples: ['C_E38']},
    ]},
    './geneHpoDisplay': {}, './geneAnnotationReference': {getGeneReferenceAnnotation: () => null},
    './geneExonReference': {getGeneExons: () => []}, './geneIdReference.generated': {PB_GENE_ID_REFERENCE: {}},
    './variantLookup': {collectVariantIdentifiers: () => ({})},
}, {fetch: async url => {
    if (!url.startsWith('/__pb_gene_genotypes__')) return {ok: true, json: async () => ({associations: []})};
    requests.push(url);
    const query = Object.fromEntries(new URL(url, 'http://localhost').searchParams);
    let code = 200, data;
    await handler({query}, {set() {}, status(value) {code = value; return this;}, json(value) {data = value;}});
    if (mismatch && query.variant) data.requested_variant = covered;
    if (release && query.variant) await new Promise(resolve => {release.resolve = resolve;});
    return {ok: code === 200, json: async () => data};
}});
const model = load('src/views/PbGene/pageModel.js', {'./pbGeneBioIndexAdapter': adapter}, {}, true);
const gene2 = load('src/views/PbGene2/Template.vue', {
    '../PbGene/pageModel': model,
    './carrierTable': {carrierTableMixin: {methods: {visibleCarrierRows() {return [];}}}},
}, {}, true).default;

function page(state, methods = model.pbGeneMethods, options = gene2) {
    return {...state, ...methods, liveDataLoaded: true, activeTabMap: {}, pinnedVariantIds: [],
        visibleVariantRows: state.variantRows, sortedVariantRows: state.variantRows,
        resetSummaryPages() {}, loadCarrierSummary() {}, fetchVisibleCarrierSampleDetails() {},
        isVariantPinned() {return false;}, selectVariant: options.methods.selectVariant, $set: Vue.set};
}
const tick = () => new Promise(resolve => setImmediate(resolve));
async function state() {return adapter.fetchPbGeneBioIndexState('GJB2');}

(async () => {
    const initial = await state();
    assert.equal(vcfRequests.length, 0);
    const current = page(initial), original = structuredClone(initial.variantRows[0]);
    current.selectVariant(covered);
    assert.equal(vcfRequests.length, 0, 'Covered GT must not trigger original-VCF work');
    assert.equal(current.variantRows[1].carrierSamples[0].gt, '1|1');

    release = {};
    current.selectVariant(target);
    while (!release.resolve) await tick();
    const pending = current.loadVariantCarrierGenotypes(target);
    assert.equal(vcfRequests.length, 1, 'Repeated expansion shares the pending lookup');
    release.resolve(); release = null;
    await pending;
    const filled = current.variantRows[0];
    assert.equal(filled.genotypeLookupStatus, 'ready');
    assert.deepEqual(Array.from(filled.carrierSamples, sample => sample.gt), ['0/1', '1/1']);
    assert(filled.carrierSamples.every(sample => sample.gtSource.kind === 'original_vcf'));
    assert.deepEqual(Array.from(filled.carrierSamples, sample => sample.id), Array.from(original.carrierSamples, sample => sample.id));
    assert.equal(filled.carrierCount, original.carrierCount);
    assert.equal(filled.crdcAF, original.crdcAF);
    for (const key of ['phenotypeMatchScore', 'variantEffectBeta', 'variantEffectPValue']) assert.equal(filled[key], original[key]);
    current.selectVariant(target);
    await current.loadVariantCarrierGenotypes(target);
    assert.equal(vcfRequests.length, 1, 'Completed GT is reused on reopening');
    assert.equal(new URL(requests.at(-1), 'http://localhost').searchParams.get('variant'), target);

    const retry = page(await state());
    unavailable = true;
    await retry.loadVariantCarrierGenotypes(target);
    assert.equal(retry.variantRows[0].genotypeLookupStatus, 'unavailable');
    assert(retry.variantRows[0].carrierSamples.every(sample => sample.gt === 'Unavailable'));
    unavailable = false;
    await retry.loadVariantCarrierGenotypes(target);
    assert.equal(retry.variantRows[0].genotypeLookupStatus, 'ready');

    const stale = page(await state());
    release = {};
    const oldRequest = stale.loadVariantCarrierGenotypes(target);
    while (!release.resolve) await tick();
    const replacement = structuredClone(stale.variantRows[0]);
    stale.variantRows = [replacement];
    release.resolve(); release = null;
    await oldRequest;
    assert(replacement.carrierSamples.every(sample => sample.gt === 'Unavailable'), 'A late response cannot patch a replacement gene state');

    const wrong = page(await state());
    mismatch = true;
    await wrong.loadVariantCarrierGenotypes(target);
    assert.equal(wrong.variantRows[0].genotypeLookupStatus, 'unavailable');
    assert(wrong.variantRows[0].carrierSamples.every(sample => sample.gt === 'Unavailable'));
    mismatch = false;
    await wrong.loadVariantCarrierGenotypes(target);
    assert.equal(wrong.variantRows[0].genotypeLookupStatus, 'ready');
    console.log('GENE2_EXPANSION_GT_VCF_FALLBACK_SCOPE_REUSE_RETRY_AND_STALE_RESPONSE_PASS');

    if (process.env.PB_GT_LIVE_BASE) {
        const base = process.env.PB_GT_LIVE_BASE;
        const json = async url => {
            const response = await fetch(base + url);
            assert.equal(response.status, 200);
            return response.json();
        };
        const source = await json('/__pb_gene_genotypes__?gene=GJB2');
        const reference = await json('/__pb_gene_genotypes__?gene=GJB2&variant=' + encodeURIComponent(target));
        const expected = reference.rows.filter(row => row.variant_id === target);
        assert(expected.length > 0);
        const liveAdapter = load('src/views/PbGene/pbGeneBioIndexAdapter.js', {
            './carrierGenotypes': require('../src/views/PbGene/carrierGenotypes'),
        }, {fetch: url => fetch(base + url)}, true);
        const liveModel = load('src/views/PbGene/pageModel.js', {'./pbGeneBioIndexAdapter': liveAdapter}, {}, true);
        const liveOptions = load('src/views/PbGene2/Template.vue', {
            '../PbGene/pageModel': liveModel,
            './carrierTable': {carrierTableMixin: {methods: {visibleCarrierRows() {return [];}}}},
        }, {}, true).default;
        const unfilled = {id: target, carrierCount: expected.length,
            carrierSamples: expected.map(row => ({id: row.sample_id, gt: 'Unavailable', gtStatus: 'not_in_source'}))};
        const initialRows = require('../src/views/PbGene/carrierGenotypes').applyCarrierGenotypes([unfilled], source);
        const live = page({geneInfo: {symbol: 'GJB2'}, variantRows: initialRows}, liveModel.pbGeneMethods, liveOptions);
        const before = initialRows[0].carrierSamples.filter(sample => sample.gtStatus === 'matched').length;
        live.selectVariant(target);
        await live.loadVariantCarrierGenotypes(target);
        const filled = live.variantRows[0];
        assert.equal(filled.genotypeLookupStatus, 'ready');
        const calls = new Map(expected.map(row => [row.sample_id, row]));
        for (const sample of filled.carrierSamples) {
            assert.equal(sample.gt, calls.get(sample.id).gt || 'Unavailable');
            assert.equal(sample.gtStatus, calls.get(sample.id).status);
        }
        assert.equal(filled.carrierCount, expected.length);
        console.log(JSON.stringify({liveGene2Expansion: target, processedMatched: before,
            afterExpansionMatched: filled.carrierSamples.filter(sample => sample.gtStatus === 'matched').length,
            carriers: filled.carrierCount, agreesWithVariantLookup: true}));
    }
})().catch(error => {console.error(error); process.exitCode = 1;});
