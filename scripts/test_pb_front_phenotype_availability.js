const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const {createRequire} = require('node:module');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');

function load(file, overrides = {}, globals = {}) {
    const filename = path.resolve(file), output = {exports: {}}, req = createRequire(filename);
    const source = fs.readFileSync(filename, 'utf8');
    const sfc = file.endsWith('.vue') ? compiler.parseComponent(source) : null;
    if (sfc) {
        assert.deepEqual(compiler.compile(sfc.template.content).errors, []);
        require('postcss').parse(sfc.styles[0].content);
    }
    const code = babel.transformSync(sfc ? sfc.script.content : source, {
        babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
    vm.runInNewContext(code, {module: output, exports: output.exports,
        require: name => Object.hasOwn(overrides, name) ? overrides[name] : req(name), ...globals});
    return output.exports;
}

function harness(view, failFirst = false) {
    const navigations = [];
    let requests = 0, failures = failFirst ? 1 : 0;
    const counts = {'HP:0001250': 2059, 'HP:0001252': 1020, 'HP:0000002': 0, 'HP:1234567': 1};
    const availability = load('src/utils/crdcHpoAvailability.js', {}, {fetch: async url => {
        assert.equal(url, '/phenotype-analyzer-api/pb/__pb_phenotype_profile__/hpo-counts');
        requests++;
        if (failures-- > 0) return {ok: false};
        return {ok: true, json: async () => ({counts})};
    }});
    const runtime = {window: {location: {assign: url => navigations.push(url)}, clearTimeout, setTimeout}};
    const front = load('src/views/PbFront/phenotypeSearch.js', {'../../utils/crdcHpoAvailability': availability}, runtime);
    const options = load(`src/views/${view}/Template.vue`, {
        '@/components/pb/PortalGuide.vue': {},
        '../KrClinicalFocus/clinicalContextReference.generated': {hpoTerms: [
            ['HP:0001250', 'Seizure'], ['HP:0001252', 'Hypotonia'],
            ['HP:0010010', 'Abnormal 2nd metacarpal morphology'],
            ['HP:0000002', 'Zero count'], ['HP:1234567', 'Abnormality, example'],
        ]},
        '../PbGene/geneIdReference.generated': {PB_GENE_ID_REFERENCE: {GJB2: {}}},
        '../PbFront/phenotypeSearch': front,
    }, runtime).default;
    const page = new Vue(options);
    page.$refs.searchInput = {focus() {}};
    return {page, navigations, requests: () => requests};
}

(async () => {
    for (const view of ['PbFront']) {
        const {page, navigations, requests} = harness(view);
        page.query = 'GJB2'; await page.submitSearch();
        assert.equal(navigations.pop(), '/generesult.html?query=GJB2');
        page.query = 'chr13:20189313:A:G'; await page.submitSearch();
        assert.match(navigations.pop(), /^\/variantresult\.html\?/);
        assert.equal(requests(), 0, 'Gene/variant navigation must not wait for HPO counts');

        const unsupported = {kind: 'Phenotype', id: 'HP:0010010', label: 'Abnormal 2nd metacarpal morphology'};
        assert.equal(page.frontOptionAvailability(unsupported).enabled, false, 'Unchecked phenotypes cannot be selected');
        await page.loadFrontHpoCounts();
        for (const id of ['HP:0010010', 'HP:0000002']) {
            assert.equal(page.frontOptionAvailability({...unsupported, id}).enabled, false);
            page.query = id;
            page.updateSuggestions();
            assert.equal(page.visibleOptions.length, 0, 'Absent and zero-count phenotypes must be omitted from autocomplete');
        }
        page.query = 'Seizure'; page.updateSuggestions();
        assert.equal(page.visibleOptions[0].id, 'HP:0001250');
        page.query = 'Seizure [HP:0001250], ';
        page.selectOption(unsupported);
        assert.equal(page.query, 'Seizure [HP:0001250], ', 'Click/keyboard guard cannot add an unsupported suggestion');

        page.query = 'Seizure [HP:0001250], Hypotonia [HP:0001252]';
        await page.submitSearch();
        const url = new URL(navigations.pop(), 'http://localhost');
        assert.equal(url.pathname, '/phenotyperesult.html');
        assert.equal(url.searchParams.get('query'), 'HP:0001250,HP:0001252');
        assert.equal(url.searchParams.get('match'), 'all');
        assert.equal(requests(), 1, 'Suggestions and submission reuse validated shared counts');

        for (const query of ['HP:0001250, HP:0010010', 'HP:0001250, HP:0000002', 'Seizure, not a phenotype']) {
            page.query = query; await page.submitSearch();
            assert.equal(navigations.length, 0, 'Pasted unavailable/unresolved terms must not navigate or be silently dropped');
            assert.equal(page.query, query, 'Keep the full input so the user can correct it');
        }
        page.query = 'seizures, Hypotonia, Seizure'; await page.submitSearch();
        assert.equal(new URL(navigations.pop(), 'http://localhost').searchParams.get('query'), 'HP:0001250,HP:0001252');
        page.query = 'Abnormality, example [HP:1234567], Seizure [HP:0001250]'; await page.submitSearch();
        assert.equal(new URL(navigations.pop(), 'http://localhost').searchParams.get('query'), 'HP:1234567,HP:0001250');

        page.visibleOptions = [unsupported, {kind: 'Phenotype', id: 'HP:0001252', label: 'Hypotonia'}];
        page.suggestionsOpen = true; page.activeOption = -1;
        page.handleKeydown({key: 'ArrowDown', preventDefault() {}});
        assert.equal(page.activeOption, 1, 'Keyboard navigation skips unavailable suggestions');
        page.activeOption = -1;
        page.query = '';
        page.handleKeydown({key: 'Enter', preventDefault() {}});
        assert.equal(page.query, 'Hypotonia [HP:0001252]');

        const retry = harness(view, true);
        retry.page.query = 'HP:0001250,HP:0001252'; await retry.page.submitSearch();
        assert.equal(retry.navigations.length, 0);
        assert.equal(retry.page.frontHpoCountsStatus, 'error');
        await retry.page.retryFrontHpoCounts();
        assert.equal(retry.page.frontHpoCountsStatus, 'ready');
        await retry.page.submitSearch();
        assert.equal(new URL(retry.navigations.pop(), 'http://localhost').searchParams.get('match'), 'all');
        assert.equal(retry.requests(), 2, 'A failed availability check is retried, not cached');
    }
    console.log('INDEX_MULTI_HPO_ALL_AVAILABILITY_GUARDS_AND_RETRY_PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
