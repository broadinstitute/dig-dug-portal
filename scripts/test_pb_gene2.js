const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');
const { filterAssociations, togglePinnedAssociation, sortAssociationRows } = require('../src/views/PbGene2/associationRows');
const root = path.resolve(__dirname, '..');
const location = { search: '?query=SLC6A7', href: 'http://localhost/pb_gene2.html?query=SLC6A7' };
let resolved;
const window = { location, history: { pushState(_, __, url) { location.href = url; location.search = new URL(url).search; } } };
function load(relative, imports = {}, sfc = false) {
    const filename = path.join(root, relative);
    let text = fs.readFileSync(filename, 'utf8');
    if (sfc) {
        const parsed = compiler.parseComponent(text);
        const rendered = compiler.compile(parsed.template.content);
        assert.deepEqual(rendered.errors, [], `Invalid template: ${relative}`);
        text = parsed.script.content;
    }
    const code = babel.transformSync(text, { filename, babelrc: false, configFile: false, plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    const exports = {};
    vm.runInNewContext(code, { exports, module: { exports }, require: name => {
        if (Object.hasOwn(imports, name)) return imports[name];
        if (name.endsWith('.css')) return {};
        throw new Error(`Unexpected dependency ${name}`);
    }, window, URL, URLSearchParams, process: { env: {} } });
    return exports;
}
const data = load('src/views/PbGene/mockData.js');
const base = load('src/views/PbGene/pageModel.js', {
    '../../utils/rphersUnits': require('../src/utils/rphersUnits'),
    './mockData': data,
    './fixturePipeline': { fixtureLoaded: false },
    './pbGeneBioIndexAdapter': { fetchPbGeneBioIndexState: async (_, { onPartial }) => { onPartial({ variantRows: [] }); return JSON.parse(JSON.stringify(resolved)); } },
    './hpoContextSearch': { resolveHpoTerms: () => [], contextApiError: async () => '' },
    './variantTableNavigation': load('src/views/PbGene/variantTableNavigation.js'),
    './carrierAge': load('src/views/PbGene/carrierAge.js'),
    './locusFilters': load('src/views/PbGene/locusFilters.js'),
    './summaryTable': load('src/views/PbGene/summaryTable.js'),
    './clinvarBadge': load('src/views/PbGene/clinvarBadge.js'),
    './hgvsNotation': load('src/views/PbGene/hgvsNotation.js'),
    '@/utils/bioIndexUtils': { query: async () => [] },
    '../KrClinicalFocus/focusStore': { readClinicalFocus: () => null },
});
const options = load('src/views/PbGene2/Template.vue', {
    '../PbGene/pageModel': base,
    '../PbGene/hpoContextSearch': { hpoLabel: id => id },
    './associationRows': { filterAssociations, togglePinnedAssociation, sortAssociationRows },
    './variantFacets': require('../src/views/PbGene2/variantFacets'),
    '../PbGene/variantLookup': require('../src/views/PbGene/variantLookup'),
    '../PbGene/variantTableNavigation': load('src/views/PbGene/variantTableNavigation.js'),
    './GeneIdentity': {}, './Demographics': {}, './ContextPanel': {}, './VariantSummary': {},
}, true).default;
for (const name of ['GeneIdentity', 'Demographics', 'ContextPanel', 'VariantSummary']) {
    const parsed = compiler.parseComponent(fs.readFileSync(path.join(root, `src/views/PbGene2/${name}.vue`), 'utf8'));
    assert.deepEqual(compiler.compile(parsed.template.content).errors, []);
}
async function main() {
    const rows = [ { hpoId: 'HP:0001250', label: 'Seizure', betaPer0_1Grs: .123, pValue: .001 }, { hpoId: 'HP:0001252', label: 'Hypotonia', betaPer0_1Grs: -.01, pValue: .4 } ];
    const pinned = togglePinnedAssociation([], rows[0]);
    assert.notEqual(pinned[0], rows[0], 'Pin keeps an independent release-row snapshot');
    assert.equal(pinned[0].pValue, rows[0].pValue);
    assert.deepEqual(filterAssociations(rows, 'Hypotonia', pinned).map(row => row.hpoId), ['HP:0001252']);
    assert.deepEqual(filterAssociations(rows, 'HP:0001250', pinned), []);
    assert.equal(pinned.length, 1, 'Changing lookup must not remove pinned rows');
    assert.deepEqual(togglePinnedAssociation(pinned, rows[0]), []);
    const sortable = [
        { hpoId: 'a', pValue: 1e-6, qValue: .05, betaPer0_1Grs: -.1, betaCiLowPer0_1Grs: -.2, betaCiHighPer0_1Grs: .05 },
        { hpoId: 'b', pValue: .01, qValue: .02, betaPer0_1Grs: .3, betaCiLowPer0_1Grs: .1, betaCiHighPer0_1Grs: .4 },
        { hpoId: 'c', pValue: null, qValue: null, betaPer0_1Grs: null },
    ];
    const counts = { a: 8, b: 2 };
    for (const key of ['beta', 'ci', 'p', 'q', 'carriers']) {
        const ascending = sortAssociationRows(sortable, key, 'asc', id => counts[id]);
        const descending = sortAssociationRows(sortable, key, 'desc', id => counts[id]);
        assert.equal(ascending[2].hpoId, 'c', 'Missing numeric values stay last ascending');
        assert.equal(descending[2].hpoId, 'c', 'Missing numeric values stay last descending');
        assert.equal(ascending[0].hpoId, descending[1].hpoId);
    }
    assert.deepEqual(sortable.map(row => row.hpoId), ['a', 'b', 'c'], 'Sorting must not reorder the source release');
    assert.deepEqual(sortAssociationRows(sortable, 'p', 'asc', () => null).map(row => row.hpoId), ['a', 'b', 'c'], 'p-values sort numerically, including scientific notation');
    const page = new Vue(options);
    page.loadCarrierSummary = async () => {};
    page.fetchVisibleCarrierSampleDetails = () => {};
    page.geneCarrierSummary = { status: 'ready', carrierTotal: 13, matchedMetadataCount: 12, phenotypeMetadataCount: 10, observedPhenotypes: [{ hpoId: 'HP:0001250', count: 4 }] };
    const originalGeneSummary = page.geneCarrierSummary;
    page.liveDataLoaded = true;
    page.selectVariant(page.variantRows[0].id);
    assert.equal(page.geneCarrierSummary, originalGeneSummary, 'Variant selection must not replace gene-wide demographics');
    assert.equal(page.phenotypeCarrierCount('HP:0001250'), '4 / 10 (partial)');
    assert.equal(page.phenotypeCarrierCount('HP:9999999'), '0 / 10 (partial)');
    page.geneCarrierSummary = { status: 'ready', carrierTotal: 13, matchedMetadataCount: 13 };
    assert.equal(page.phenotypeCarrierCount('HP:0001250'), '—', 'Unavailable HPO coverage is not zero');
    page.toggleAssociationPin(rows[0]); page.associationSearch = 'Hypotonia';
    page.contextInput = 'HP:0001250';
    assert.equal(page.pinnedAssociations.length, 1);
    assert.equal(page.contextInput, 'HP:0001250', 'Release lookup does not mutate custom HPO');
    page.sortAssociationColumn('p');
    assert.equal(page.associationAriaSort('p'), 'ascending');
    page.sortAssociationColumn('p');
    assert.equal(page.associationAriaSort('p'), 'descending');
    assert.equal(page.sortedPinnedAssociations.length, 1, 'Sorting preserves the pinned group');
    const variantOptions = load('src/views/PbGene2/VariantSummary.vue', {
        '../PbGene/SummaryPager': {},
        '../PbGene/hpoContextSearch': { hpoLabel: id => ({ 'HP:0001250': 'Seizure', 'HP:0001252': 'Hypotonia' }[id] || id), contextApiError: async () => '' },
        '../../utils/rphersUnits': require('../src/utils/rphersUnits'),
        '../../utils/contextAssociationRequest': require('../src/utils/contextAssociationRequest'),
    }, true).default;
    const detail = new Vue({ ...variantOptions, propsData: { gene: 'TEST', variant: { id: 'chr1:1:A:G', carrierCount: 8 }, summary: { status: 'ready', carrierTotal: 8, geneListMetadataCount: 8, phenotypeMetadataCount: 8,
        observedPhenotypes: [{ hpoId: 'HP:0001250', count: 8, denominator: 8 }, { hpoId: 'HP:0001252', count: 2, denominator: 8 }],
        coCarrierGenes: [{ gene: 'NINL', count: 8 }, { gene: 'USH2A', count: 3 }],
    } } });
    assert.equal(detail.visiblePhenotypes[0].count, 8);
    detail.togglePhenotypeSort();
    assert.equal(detail.visiblePhenotypes[0].count, 2);
    detail.phenotypePage = 2; detail.phenotypeSearch = 'sEiZuRe';
    detail.coGenePage = 2; detail.coGeneSearch = 'ush2';
    const originalRequestKey = detail.requestKey;
    await Vue.nextTick();
    assert.equal(detail.phenotypePage, 1); assert.equal(detail.coGenePage, 1);
    assert.equal(detail.visiblePhenotypes[0].hpoId, 'HP:0001250');
    assert.equal(detail.visibleCoGenes[0].gene, 'USH2A');
    assert.equal(detail.coGenes.length, 2, 'Search never changes the full co-gene FDR family');
    detail.phenotypeSearch = 'HP:0001252'; detail.coGeneSearch = '';
    await Vue.nextTick();
    assert.equal(detail.visiblePhenotypes[0].hpoId, 'HP:0001252');
    assert.equal(detail.requestKey, originalRequestKey, 'Display filters must not trigger co-gene recalculation');
    let coGeneRequests = 0;
    detail.loadAssociations = () => { coGeneRequests++; };
    detail.context = { terms: ['HP:0001250'], scoreType: 'max', analysisSet: 'all' };
    detail.standardization = { version: 'rphers_scoring_cohort_sample_sd_v1', status: 'ok', reference_id: 'test-reference', data_release_id: 'release', scoring_cohort_id: 'cohort', reference_n: 100, reference_mean: 0, reference_sd: 1, ddof: 1 };
    const coGeneRows = ['A', 'B', 'C', 'D', 'E', 'F', 'G'].map((gene, index) => ({ gene, count: 8 - index, denominator: 8 }));
    detail.summary = { ...detail.summary, coCarrierGenes: coGeneRows };
    const association = (beta, p, q) => ({status: 'ok', beta_sd_per_0_1_grs: beta, standardization_status: 'ok', standardization_reference_id: 'test-reference', p_value: p, fdr: q});
    detail.associations = {
        A: association(.00011, .2, .4), B: association(-.2, 1e-7, .05), C: association(.00012, 2e-6, .03),
        D: association(null, null, null), E: association(0, 0, 0), F: association(NaN, NaN, NaN),
        G: { ...association(-100, 0, 0), status: 'not_in_score_file' },
    };
    await Vue.nextTick();
    coGeneRequests = 0;
    const coGeneRequestKey = detail.requestKey;
    for (const [key, ascending, descending] of [
        ['beta', ['B', 'E', 'A', 'C', 'D', 'F', 'G'], ['C', 'A', 'E', 'B', 'D', 'F', 'G']],
        ['p_value', ['E', 'B', 'C', 'A', 'D', 'F', 'G'], ['A', 'C', 'B', 'E', 'D', 'F', 'G']],
        ['fdr', ['E', 'C', 'B', 'A', 'D', 'F', 'G'], ['A', 'B', 'C', 'E', 'D', 'F', 'G']],
    ]) {
        detail.coGenePage = 2;
        detail.toggleCoGeneSort(key);
        assert.equal(detail.coGenePage, 1, 'Changing co-gene sort returns to the first page');
        assert.equal(detail.coGeneAriaSort(key), 'ascending');
        assert.deepEqual(Array.from(detail.sortedCoGenes, row => row.gene), ascending);
        assert.deepEqual(Array.from(detail.visibleCoGenes, row => row.gene), ascending.slice(0, 5), 'Sort the whole matching set before pagination');
        detail.toggleCoGeneSort(key);
        assert.equal(detail.coGeneAriaSort(key), 'descending');
        assert.deepEqual(Array.from(detail.sortedCoGenes, row => row.gene), descending, 'Missing/non-OK values remain last in both directions');
    }
    detail.coGeneSearch = 'c';
    await Vue.nextTick();
    assert.deepEqual(Array.from(detail.visibleCoGenes, row => row.gene), ['C']);
    assert.deepEqual(coGeneRows.map(row => row.gene), ['A', 'B', 'C', 'D', 'E', 'F', 'G'], 'Sorting preserves source order and complete FDR family');
    assert.equal(detail.requestKey, coGeneRequestKey);
    assert.equal(coGeneRequests, 0, 'Sorting and search must reuse calculated results');
    detail.$destroy();
    page.variantRows = Array.from({ length: 12 }, (_, index) => ({ ...data.variantRows[0], id: `chr5:${150200000 + index}:A:G`, carrierCount: index + 1 }));
    page.variantSortKey = 'variant'; page.variantSortDir = 'asc'; page.variantPage = 1;
    const pinnedVariantId = page.variantRows[0].id;
    page.toggleVariantPin(pinnedVariantId);
    page.goToVariantPage(3);
    assert.equal(page.comparisonVariantRows[0].id, pinnedVariantId, 'Pinned variant stays first across pages');
    assert.equal(page.comparisonVariantRows.filter(row => row.id === pinnedVariantId).length, 1);
    page.selectVariant(pinnedVariantId);
    assert.equal(page.variantPage, 3, 'Opening a pinned row must not navigate the unpinned results');
    page.goToVariantPage(2);
    assert.equal(page.expandedVariantId, pinnedVariantId, 'An expanded pinned variant remains open across pages');
    page.sortVariantsBy('carriers');
    assert.equal(page.comparisonVariantRows[0].id, pinnedVariantId);
    page.variantPositionQuery = '150200010';
    page.searchVariantPosition();
    assert.equal(page.comparisonVariantRows[0].id, pinnedVariantId, 'Position search preserves pinned comparison');
    page.variantRows[0].phenotypeMatchScore = 4.5;
    assert.equal(page.pinnedVariantRows[0].phenotypeMatchScore, 4.5, 'Pinned rows use the current applied HPO values, not stale snapshots');
    page.goToVariantPage(3);
    page.toggleVariantPin(pinnedVariantId);
    assert.equal(page.pinnedVariantIds.length, 0);
    assert.equal(page.expandedVariantId, null, 'Unpinning an off-page expansion clears the hidden selection');
    page.toggleVariantPin(pinnedVariantId);
    page.variantRows[0].clinvar = 'Pathogenic'; page.variantRows[0].consequence = 'missense_variant';
    page.variantRows[1].clinvar = 'Benign'; page.variantRows[1].consequence = 'stop_gained';
    page.variantRows[0].hgvsc = 'ENST00000382848.5:c.35del'; page.variantRows[0].rsids = ['rs80338939'];
    page.variantRows[1].hgvsc = 'ENST00000382848.5:c.35dup'; page.variantRows[1].rsids = ['rs80338939'];
    page.variantPositionQuery = 'rs80338939'; page.searchVariantPosition();
    assert.equal(page.matchingVariantRows.length, 2);
    assert.equal(page.variantIdentifierIds.length, 2);
    page.sortVariantsBy('carriers');
    assert.equal(page.variantPositionQuery, 'rs80338939', 'Sorting retains the applied identifier search');
    page.variantPositionQuery = 'c.35delG'; page.searchVariantPosition();
    assert.equal(page.matchingVariantRows.length, 1, 'A new identifier lookup searches beyond the previous result set');
    assert.equal(page.matchingVariantRows[0].id, pinnedVariantId);
    page.variantPositionQuery = 'rs000000'; page.searchVariantPosition();
    assert.equal(page.matchingVariantRows.length, 1, 'Failed lookups preserve the last valid result');
    assert.ok(page.variantPositionError.includes('No matching variant'));
    page.clearVariantIdentifierSearch();
    assert.equal(page.matchingVariantRows.length, 12);
    assert.equal(page.pinnedVariantIds[0], pinnedVariantId);
    page.toggleVariantFilter('clinvar', 'B/LB');
    assert.equal(page.matchingVariantRows.length, 1);
    assert.equal(page.matchingVariantRows[0].id, page.variantRows[1].id);
    assert.equal(page.variantPageCount, 1);
    assert.equal(page.pinnedVariantRows[0].id, pinnedVariantId, 'Pinned comparisons stay visible outside a display filter');
    page.toggleVariantFilter('consequence', 'Missense');
    assert.equal(page.matchingVariantRows.length, 0, 'Different filter categories intersect');
    page.clearVariantFilters();
    assert.equal(page.matchingVariantRows.length, 12);
    assert.equal(page.variantRows.length, 12, 'Display filtering must not remove variants from analysis');
    page.variantRows.forEach(row => { row.variantEvidence = []; });
    page.variantRows[0].variantEvidence = [{ label: 'AlphaMissense', value: 0 }, { label: 'REVEL', value: '0.31' }];
    page.variantRows[1].variantEvidence = [{ label: 'AlphaMissense', value: '—' }, { label: 'REVEL', value: '0' }];
    page.variantRows[2].variantEvidence = [{ label: 'AlphaMissense', value: 'Unavailable' }, { label: 'REVEL', value: 'NA' }];
    assert.deepEqual(Array.from(page.variantMix.annotations, item => [item.label, item.count]), [['AM annotated', 1], ['REVEL annotated', 2]], 'Annotation availability includes zero and excludes missing scores');
    assert.ok(!page.variantMix.consequence.some(item => item.label === 'Predicted LoF'));
    assert.equal(page.variantMix.consequence.reduce((sum, item) => sum + item.count, 0), page.variantRows.length, 'Consequence groups still cover every variant');
    page.toggleVariantFilter('annotations', 'AM annotated');
    assert.equal(page.matchingVariantRows.length, 1);
    page.toggleVariantFilter('annotations', 'REVEL annotated');
    assert.equal(page.matchingVariantRows.length, 2, 'Annotation selections use OR within their category');
    page.toggleVariantFilter('clinvar', 'P/LP');
    assert.equal(page.matchingVariantRows.length, 1, 'Annotations intersect other filter categories');
    page.clearVariantFilters();
    const demoOptions = load('src/views/PbGene2/Demographics.vue', { '../PbGene/carrierAge': load('src/views/PbGene/carrierAge.js') }, true).default;
    const demo = new Vue({ ...demoOptions, propsData: { scope: 'gene', carrierCount: 3, summary: { status: 'ready', matchedMetadataCount: 3, geneCarrierDemographics: { byProject: [{project: 'Hearing Loss', count: 2}, {project: 'Neurology', count: 1}], bySex: [{label:'female', count:2}], byAffected: [{label:'Yes', count:1}] } } } });
    assert.equal(demo.columns.length, 3);
    assert.deepEqual(Array.from(demo.columns[2], item => item.key), ['bySex', 'byAffected']);
    demo.projectSearch = 'hEaRiNg';
    assert.equal(demo.filteredProjects.length, 1);
    assert.equal(demo.filteredProjects[0].label, 'Hearing Loss');
    demo.projectSearch = '';
    assert.equal(demo.filteredProjects.length, 2);
    const sexSource = [{label:'female', count:7062}, {label:'male', count:6550}, {label:'unknown', count:122}, {label:'0', count:8}, {label:' Unknown ', count:2}];
    demo.summary = { status: 'ready', matchedMetadataCount: 13744, geneCarrierDemographics: { bySex: sexSource } };
    assert.deepEqual(Array.from(demo.groups[2].rows, row => [row.label, row.count]), [['female',7062], ['male',6550], ['Unknown',132]], 'Sex zero merges with unknown, including case/whitespace variants');
    assert.equal(demo.groups[2].rows.reduce((sum, row) => sum + row.count, 0), 13744, 'Merging preserves the total and bar counts');
    assert.equal(sexSource.length, 5, 'Do not mutate source summaries');
    demo.summary = null;
    demo.fallback = { bySex: [{label:'0',count:8}, {label:'unknown',count:122}], byAge: [{band:'0',count:3}] };
    assert.equal(demo.groups[2].rows.length, 1, 'Fallback metadata uses the same sex grouping');
    assert.equal(demo.groups[2].rows[0].count, 130);
    assert.equal(demo.groups[1].rows[0].label, '0', 'Age zero remains a valid age band');
    demo.$destroy();
    resolved = { ...data, geneInfo: { ...data.geneInfo, symbol: 'OTHER' } };
    await page.loadLiveGeneData('OTHER', true);
    await Vue.nextTick();
    assert.equal(new URL(location.href).pathname, '/pb_gene2.html');
    assert.equal(new URL(location.href).searchParams.get('query'), 'OTHER');
    assert.equal(page.pinnedAssociations.length, 0, 'Pins must not leak between genes');
    assert.equal(page.pinnedVariantIds.length, 0, 'Variant pins must not leak between genes');
    assert.equal(page.currentContextRunId, '');
    const template = fs.readFileSync(path.join(root, 'src/views/PbGene2/Template.vue'), 'utf8').split('<script>')[0];
    assert.ok(!template.includes('gene locus') && !template.includes('genomeWindow') && !template.includes('locus-filter'), 'Gene2 omits the locus visualization entirely');
    assert.equal(options.methods.runContextAnalysis.constructor.name, 'AsyncFunction');
    assert.equal(options.methods.variantScoreValue, base.pbGeneMethods.variantScoreValue, 'Variant score calculation is reused unchanged');
    assert.equal(options.methods.applyVariantContextScores.constructor.name, 'Function');
    console.log('PB Gene2: pin/search isolation, metadata coverage, independent gene scope, route retention, shared calculations, and Vue templates PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
