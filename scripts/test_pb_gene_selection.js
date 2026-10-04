// Run: node scripts/test_pb_gene_selection.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const Vue = require('vue');
const root = path.resolve(__dirname, '..');
let fetchState;
const location = { search: '', href: 'http://localhost/pb_Gene.html' };
const window = { location, history: { pushState(_, __, href) { location.href = href; } } };
function load(relative, imports = {}) {
    const filename = path.join(root, relative);
    const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
        filename, babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
    const exports = {};
    vm.runInNewContext(code, { exports, require: name => {
        assert.ok(Object.hasOwn(imports, name), `Unexpected dependency: ${name}`);
        return imports[name];
    }, window, URL, URLSearchParams, process: { env: {} } });
    return exports;
}
const data = load('src/views/PbGene/mockData.js');
const navigation = load('src/views/PbGene/variantTableNavigation.js');
const carrierAge = load('src/views/PbGene/carrierAge.js');
const locusFilters = load('src/views/PbGene/locusFilters.js');
const summaryTable = load('src/views/PbGene/summaryTable.js');
const clinvarBadge = load('src/views/PbGene/clinvarBadge.js');
const hgvsNotation = load('src/views/PbGene/hgvsNotation.js');
const model = load('src/views/PbGene/pageModel.js', {
    './hpoContextSearch': { resolveHpoTerms: () => [], contextApiError: async () => '' },
    './mockData': data,
    './fixturePipeline': { fixtureLoaded: false },
    './pbGeneBioIndexAdapter': { fetchPbGeneBioIndexState: (...args) => fetchState(...args) },
    './variantTableNavigation': navigation,
    './carrierAge': carrierAge,
    './locusFilters': locusFilters,
    './summaryTable': summaryTable,
    './clinvarBadge': clinvarBadge,
    './hgvsNotation': hgvsNotation,
    '@/utils/bioIndexUtils': { query: async () => ({}) },
    '../KrClinicalFocus/focusStore': { readClinicalFocus: () => null },
});
function page(variant = '', gene = data.geneInfo.symbol) {
    location.search = `?query=${gene}&variant=${encodeURIComponent(variant)}`;
    location.href = `http://localhost/pb_Gene.html${location.search}`;
    return new Vue({ data: model.createPbGeneState(), computed: model.pbGeneComputed, methods: model.pbGeneMethods });
}
function resolved(gene = data.geneInfo.symbol) {
    return JSON.parse(JSON.stringify({ ...data, geneInfo: { ...data.geneInfo, symbol: gene } }));
}
async function main() {
    const id = data.variantRows[0].id;
    const p = page(id);
    assert.equal(p.expandedVariantId, id);
    assert.equal(p.geneTab, 'variant');
    p.toggleVariant(id);
    assert.equal(p.geneTab, 'gene');
    p.toggleVariant(id);
    assert.equal(p.expandedVariantId, id, 'Selecting a variant updates the carrier summary');
    assert.equal(p.selectVariant('missing'), false);
    assert.equal(p.expandedVariantId, id);
    const invalid = page('missing');
    assert.equal(invalid.expandedVariantId, null);
    assert.equal(invalid.geneTab, 'gene');

    // The requested row can be absent from partial data and arrive in the final response.
    fetchState = async (_, { onPartial }) => {
        onPartial({ variantRows: [] });
        assert.equal(p.expandedVariantId, null);
        return resolved();
    };
    await p.loadLiveGeneData();
    assert.equal(p.expandedVariantId, id);

    // URL selection is also restored for a gene with no initial fixture rows.
    const delayed = page(id, 'LATE');
    assert.equal(delayed.expandedVariantId, null);
    fetchState = async (_, { onPartial }) => { onPartial({ variantRows: [] }); return resolved('LATE'); };
    await delayed.loadLiveGeneData();
    assert.equal(delayed.expandedVariantId, id);

    // An explicit deselection during loading must not be undone by the response.
    fetchState = async (_, { onPartial }) => {
        onPartial(resolved('LATE'));
        delayed.setGeneTab('gene');
        return resolved('LATE');
    };
    await delayed.loadLiveGeneData();
    assert.equal(delayed.expandedVariantId, null);
    await invalid.loadLiveGeneData();
    assert.equal(invalid.expandedVariantId, null);

    const more = page();
    more.variantRows = Array.from({ length: 12 }, (_, i) => ({ ...data.variantRows[0], id: `chr5:${150203770 + i}:A:T` }));
    more.variantSortKey = 'variant';
    more.variantSortDir = 'asc';
    assert.equal(more.variantPageCount, 3);
    assert.equal(more.visibleVariantRows.length, 5);
    more.goToVariantPage(2);
    assert.equal(more.visibleVariantRows[0].id, more.sortedVariantRows[5].id);
    const last = more.sortedVariantRows[11].id;
    more.selectVariant(last);
    assert.equal(more.variantPage, 3);
    assert.ok(more.visibleVariantRows.some(row => row.id === last), 'Selected row is visible on its page');
    more.variantPositionQuery = 'chr5:150203777';
    more.searchVariantPosition();
    assert.equal(more.visibleVariantRows[2].id, 'chr5:150203777:A:T');
    const sparse = Array.from({ length: 8 }, (_, i) => ({ id: `chr5:${150203770 + i * 10}:A:T` }));
    const nearest = navigation.findPositionWindow(sparse, { chromosome: '5', location: 'chr5:150203760-150203850' }, '150203793');
    assert.equal(nearest.match.id, 'chr5:150203790:A:T');
    assert.equal(nearest.ordered[nearest.start + 2].id, nearest.match.id);
    assert.equal(navigation.findPositionWindow(sparse, { chromosome: '5', location: 'chr5:150203760-150203850' }, '150203851').error, 'Invalid position');
    assert.deepEqual(Array.from(navigation.visiblePageNumbers(1, 100)), [1, 2, 3, 4, 5]);
    assert.deepEqual(Array.from(navigation.visiblePageNumbers(100, 100)), [96, 97, 98, 99, 100]);
    const hundredPages = page();
    hundredPages.variantRows = Array.from({ length: 500 }, (_, i) => ({ ...data.variantRows[0], id: `chr5:${150203770 + i}:A:T` }));
    hundredPages.variantSortKey = 'variant';
    hundredPages.variantSortDir = 'asc';
    assert.equal(hundredPages.variantPageCount, 100);
    hundredPages.variantPageJump = '80';
    hundredPages.jumpToVariantPage();
    assert.equal(hundredPages.variantPage, 80);
    assert.equal(hundredPages.visibleVariantRows[0].id, hundredPages.sortedVariantRows[395].id);
    hundredPages.variantPageJump = '101';
    hundredPages.jumpToVariantPage();
    assert.equal(hundredPages.variantPageJumpError, 'Invalid page');
    assert.equal(hundredPages.variantPage, 80);
    const beforeInvalid = more.visibleVariantRows.map(row => row.id);
    more.variantPositionQuery = 'chr4:150203777';
    more.searchVariantPosition();
    assert.equal(more.variantPositionError, 'Invalid position');
    assert.deepEqual(more.visibleVariantRows.map(row => row.id), beforeInvalid);
    more.setGeneTab('gene');
    more.setGeneTab('variant');
    assert.equal(more.geneTab, 'variant');

    fetchState = async () => resolved('OTHER');
    await p.loadLiveGeneData('OTHER', true);
    assert.equal(p.expandedVariantId, null);
    assert.equal(new URL(location.href).searchParams.has('variant'), false);
    fetchState = async () => { throw new Error('offline'); };
    await assert.rejects(p.loadLiveGeneData(), /offline/);
    assert.equal(p.searchGeneLoading, false);
    assert.equal(p.searchGeneError, 'offline');
    console.log('PB_GENE_SELECTION_TEST_PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
