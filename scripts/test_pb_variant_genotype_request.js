const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {createRequire} = require('node:module');
const babel = require('@babel/core');
const Vue = require('vue');
const register = require('./gene_genotype_endpoint');
const {callKey} = require('./processed_genotype_source');

function load(relative, overrides, runtime = {}) {
    const filename = path.resolve(relative), module = {exports: {}};
    const localRequire = createRequire(filename);
    const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
    vm.runInNewContext(code, {module, exports: module.exports, structuredClone, URLSearchParams,
        window: {location: {search: ''}},
        require: name => Object.hasOwn(overrides, name) ? overrides[name] : localRequire(name), ...runtime});
    return module.exports;
}

const variant = 'chr13:20189313:A:G';
let handler, requests = [], failures = 0;
register({get(_route, callback) {handler = callback;}}, {
    accessToken: () => '',
    carriersForGene: async () => ({byVariant: new Map([[variant, new Set(['A_E38', 'B_E38', 'C_E38'])]])}),
}, {
    readGenotypes: async () => ({source: {data_version: 'fixture'}, calls: new Map([
        [callKey(variant, 'A_E38'), {gt: '0/1', status: 'matched'}],
    ])}),
    readVariantGenotypes: async (id, samples) => ({source: {kind: 'original_vcf'},
        rows: samples.map(sample_id => ({variant_id: id, sample_id,
            gt: sample_id === 'B_E38' ? '1/1' : null,
            status: sample_id === 'B_E38' ? 'matched' : 'low_or_missing_depth'}))}),
});

function adapter() {
    return load('src/views/PbGene/pbGeneBioIndexAdapter.js', {
        '@/utils/pbBioIndex': {query: async index => index === 'gene' ? [] : [{
            chromosome: '13', position: 20189313, reference: 'A', alt: 'G',
            samples: ['A_E38', 'B_E38', 'C_E38'],
        }]},
        './geneHpoDisplay': {},
        './geneAnnotationReference': {getGeneReferenceAnnotation: () => null},
        './geneExonReference': {getGeneExons: () => []},
        './geneIdReference.generated': {PB_GENE_ID_REFERENCE: {}},
        './variantLookup': {collectVariantIdentifiers: () => ({})},
    }, {fetch: async url => {
        if (!url.startsWith('/phenotype-analyzer-api/pb/__pb_gene_genotypes__')) return {ok: true, json: async () => ({associations: []})};
        requests.push(url);
        if (failures > 0) {failures--; return {ok: false};}
        const query = Object.fromEntries(new URL(url, 'http://localhost').searchParams);
        let code = 200, data;
        await handler({query}, {set() {}, status(value) {code = value; return this;}, json(value) {data = value;}});
        return {ok: code === 200, json: async () => data};
    }});
}

(async () => {
    const geneAdapter = adapter();
    const model = load('src/views/PbVariant/pageModel.js', {
        '@/views/PbGene/pbGeneBioIndexAdapter': geneAdapter,
        '@/utils/pbBioIndex': {query: async () => []},
        '@/views/KrClinicalFocus/focusStore': {readClinicalFocus: () => null},
        '@/views/PbGene/hpoContextSearch': {},
    });
    const page = new Vue({data: () => ({...model.createPbVariantState(), searchQuery: variant, geneQuery: 'GJB2'}),
        computed: model.pbVariantComputed,
        methods: {...model.pbVariantMethods, loadCarrierMetadata: async () => {}}});
    await page.loadLiveVariantData();
    assert.equal(page.searchError, '');
    assert.equal(new URL(requests[0], 'http://localhost').searchParams.get('variant'), variant,
        'The actual Variant page → shared adapter → GT route must preserve the required chr prefix');
    assert.deepEqual(Array.from(page.genotypeOptions, row => row.count), [1, 1, 1]);
    assert.equal(page.genotypeLookupFailed, false);
    assert.equal(page.carrierRecords.find(row => row.id === 'A_E38').genotype, '0/1');
    assert.equal(page.carrierGenotypeLabel(page.carrierRecords.find(row => row.id === 'C_E38')), 'Low or missing DP');
    assert.equal(page.carrierGenotypeLabel({ gtStatus: 'no_call' }), 'No GT call');
    await geneAdapter.fetchPbGeneBioIndexState('GJB2', {genotypeVariantId: variant});
    assert.equal(requests.length, 1, 'Equivalent internal and API IDs share the successful cache');

    const recovering = adapter();
    failures = 1;
    const failed = await recovering.fetchPbGeneBioIndexState('GJB2', {genotypeVariantId: variant});
    assert.equal(failed.variantRows[0].carrierSamples[0].gtStatus, 'lookup_unavailable');
    const recovered = await recovering.fetchPbGeneBioIndexState('GJB2', {genotypeVariantId: variant});
    assert.equal(recovered.variantRows[0].carrierSamples[0].gt, '0/1',
        'A failed GT request must not poison later searches after the service recovers');
    console.log('VARIANT_PAGE_GT_REQUEST_PREFIX_AND_FAILED_CACHE_RECOVERY_PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
