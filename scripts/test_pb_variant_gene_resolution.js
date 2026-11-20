const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const {createRequire} = require('node:module');
const babel = require('@babel/core');
const Vue = require('vue');

const filename = path.resolve('src/views/PbVariant/pageModel.js');
const localRequire = createRequire(filename);
const output = {exports: {}};
const location = {search: '', href: 'http://localhost/variantresult.html?query=chr11:5227002:T:A&gene=HBB'};
const historyCalls = [];
const history = Object.fromEntries(['pushState', 'replaceState'].map(method => [method, (_state, _title, href) => {
    historyCalls.push(method);
    location.href = href;
}]));
const variants = {
    '7:117587806:G:A': [{geneId: 'AC000111', biotype: 'processed_pseudogene'}, {symbol: 'CFTR', biotype: 'protein_coding', pick: '1'}],
    '13:20189473:C:T': [{geneId: 'RP11-264J4', biotype: 'lncRNA'}, {symbol: 'GJB2', biotype: 'protein_coding', pick: '1'}],
};
let failAnnotation = false, failEvidence = false;
const genes = [];
const overrides = {
    '@/utils/pbBioIndex': {query: async (_index, variant) => {
        if (failAnnotation) throw new Error('Annotation unavailable');
        return variants[variant] || [];
    }},
    '@/views/PbGene/pbGeneBioIndexAdapter': {fetchPbGeneBioIndexState: async (gene, options) => {
        genes.push(gene);
        if (failEvidence) throw new Error('Evidence unavailable');
        return {geneInfo: {symbol: gene}, crdcEvidence: {}, variantRows: [
            {id: `chr${options.genotypeVariantId}`, carrierSamples: [], carrierCount: 0},
        ]};
    }},
    '@/views/KrClinicalFocus/focusStore': {readClinicalFocus: () => null},
    '@/views/PbGene/hpoContextSearch': {},
};
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
vm.runInNewContext(code, {module: output, exports: output.exports, URL, URLSearchParams,
    window: {location, history}, require: name => Object.hasOwn(overrides, name) ? overrides[name] : localRequire(name)});
const model = output.exports;
const page = new Vue({data: model.createPbVariantState, computed: model.pbVariantComputed,
    methods: {...model.pbVariantMethods, loadCarrierMetadata: async () => {}}});

(async () => {
    for (const [variant, gene] of [['chr7:117587806:G:A', 'CFTR'], ['chr13:20189473:C:T', 'GJB2']]) {
        page.searchQuery = variant;
        await page.submitVariantSearch();
        assert.equal(page.searchError, '');
        assert.equal(page.variantAvailable, true);
        assert.equal(page.variantIdentity.gene, gene);
        assert.equal(page.geneQuery, gene);
        const params = new URL(location.href).searchParams;
        assert.equal(params.get('query'), variant);
        assert.equal(params.get('gene'), gene);
    }
    assert.deepEqual(genes, ['CFTR', 'GJB2'], 'A previous search gene must not leak into the new search');
    assert.equal(historyCalls.filter(method => method === 'pushState').length, 2, 'One history entry per search');

    // Explicit links from a Gene page keep the context the user selected.
    page.searchQuery = 'chr7:117587806:G:A';
    page.geneQuery = 'AC000111';
    await page.loadLiveVariantData();
    assert.equal(page.variantIdentity.gene, 'AC000111');

    failEvidence = true;
    page.searchQuery = 'chr13:20189473:C:T';
    await page.submitVariantSearch();
    assert.equal(page.searchError, 'Evidence unavailable');
    assert.equal(new URL(location.href).searchParams.get('gene'), 'GJB2');
    assert.equal(new URL(location.href).searchParams.get('query'), page.searchQuery);

    failAnnotation = true;
    page.searchQuery = 'chr7:117587806:G:A';
    await page.submitVariantSearch();
    assert.equal(page.searchError, 'Annotation unavailable');
    assert.equal(new URL(location.href).searchParams.get('query'), page.searchQuery);
    assert.equal(new URL(location.href).searchParams.has('gene'), false, 'Failed annotation cannot leave a previous gene in the URL');

    failAnnotation = false;
    page.searchQuery = 'chr1:1:A:G';
    await page.submitVariantSearch();
    assert(page.searchError.includes('no gene mapping'));
    assert.equal(page.variantAvailable, false);
    console.log('PB_VARIANT_OVERLAPPING_GENE_SEARCH_AND_URL_RECOVERY_PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
