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
    }, window, URL, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch: async () => ({ok:true,json:async()=>({status:'ready',carrierTotal:0,matchedMetadataCount:0,geneCarrierDemographics:{}})}), process: { env: {} } });
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
    './carrierScores': require('../src/views/PbGene2/carrierScores'),
    './filteredCarrierDemographics': load('src/views/PbGene2/filteredCarrierDemographics.js'),
    './variantHpoCounts': load('src/views/PbGene2/variantHpoCounts.js'),
    './carrierHpoTotals': load('src/views/PbGene2/carrierHpoTotals.js'),
    './carrierTable': load('src/views/PbGene2/carrierTable.js', {'./evidencePagination':require('../src/views/PbGene2/evidencePagination')}),
    './evidenceHelp': require('../src/views/PbGene2/evidenceHelp'),
    './referenceProvenance': load('src/views/PbGene2/referenceProvenance.js'),
    './evidencePagination': require('../src/views/PbGene2/evidencePagination'),
    '../PbGene/variantLookup': require('../src/views/PbGene/variantLookup'),
    '../PbGene/variantTableNavigation': load('src/views/PbGene/variantTableNavigation.js'),
    './GeneIdentity': {}, './Demographics': {}, './ContextPanel': {}, './VariantSummary': {}, './VariantOverview': {}, './HelpTooltip': {}, './InfoRail': {}, './VariantAnnotation': {}, './CarrierMetadataList': {},
}, true).default;
for (const name of ['GeneIdentity', 'Demographics', 'ContextPanel', 'VariantSummary', 'VariantOverview', 'HelpTooltip', 'ProfileInput', 'InfoRail', 'VariantAnnotation', 'CarrierMetadataList']) {
    const parsed = compiler.parseComponent(fs.readFileSync(path.join(root, `src/views/PbGene2/${name}.vue`), 'utf8'));
    assert.deepEqual(compiler.compile(parsed.template.content).errors, []);
}
async function main() {
    const numericSorter = {
        variantRows: [
            {id:'chr1:1:A:G',carrierCount:2,phenotypeMatchScore:-2,variantEffectBeta:-1,variantEffectPValue:0.1},
            {id:'chr1:2:A:G',carrierCount:10,phenotypeMatchScore:0,variantEffectBeta:0,variantEffectPValue:1e-9},
            {id:'chr1:3:A:G',carrierCount:0,phenotypeMatchScore:2,variantEffectBeta:1,variantEffectPValue:0.2},
            {id:'chr1:4:A:G',carrierCount:0,phenotypeMatchScore:null,variantEffectBeta:null,variantEffectPValue:null},
        ],
        appliedContext:{},variantHpoCountStatus:'ready',variantHpoCounts:{'chr1:1:A:G':{count:10},'chr1:2:A:G':{count:2},'chr1:3:A:G':{count:0}},
        variantSortValue(row,key){return options.methods.variantSortValue.call(this,row,key);},
    };
    const checkNumericSort=(key,direction,expected)=>{
        Object.assign(numericSorter,{variantSortKey:key,variantSortDir:direction});
        assert.deepEqual(Array.from(base.pbGeneComputed.sortedVariantRows.call(numericSorter),row=>Number(row.id.split(':')[1])),expected,`${key} must sort numerically with missing last`);
    };
    checkNumericSort('hpoCarriers','asc',[3,2,1,4]);checkNumericSort('hpoCarriers','desc',[1,2,3,4]);
    checkNumericSort('matchScore','asc',[1,2,3,4]);checkNumericSort('matchScore','desc',[3,2,1,4]);
    checkNumericSort('effectScore','asc',[1,2,3,4]);checkNumericSort('effectScore','desc',[3,2,1,4]);
    checkNumericSort('pValue','asc',[2,1,3,4]);checkNumericSort('pValue','desc',[3,1,2,4]);
    checkNumericSort('carriers','desc',[2,1,3,4]);
    const identityBase = load('src/views/PbGene/GeneIdentityPanel.vue', {}, true).default;
    const identityOptions = load('src/views/PbGene2/GeneIdentity.vue', {
        '../PbGene/GeneIdentityPanel': identityBase, './HelpTooltip': {},
        './referenceProvenance': load('src/views/PbGene2/referenceProvenance.js'),
    }, true).default;
    const identity = new Vue({ ...identityOptions, propsData: { geneInfo: { symbol: 'GJB2' } } });
    for (const symbol of ['GJB2', 'SLC6A7']) {
        for (const description of [undefined, null, '', '  ', 'Unavailable', 'Unavailable in live BioIndex', 'NCBI summary unavailable', 'N/A']) {
            identity.geneInfo = { symbol, description };
            assert.equal(identity.hasSummary, false, 'Missing summaries follow the same rule across genes');
            assert.equal(identity.summaryText, 'NCBI summary unavailable');
            assert.equal(identity.geneOmimLinks.length, 0);
            assert.equal(identity.geneEnsemblLink, null);
            assert.equal(identity.geneRefseqLink, null);
            assert.equal(identity.pathwayDetailItems.length, 0);
            assert.equal(identity.annotation.ddg2p.support, undefined, 'Missing reference bundles are safe to render');
        }
    }
    identity.geneInfo = { symbol: 'GJB2', description: 'A supplied NCBI summary.' };
    assert.equal(identity.hasSummary, true, 'Available summaries use the normal text state');
    assert.equal(identity.summaryText, 'A supplied NCBI summary.');
    const contextPanel = load('src/views/PbGene2/ContextPanel.vue', {
        '../PbGene/HpoContextPanel': {}, '../PbGene/hpoContextSearch': { hpoLabel: id => id },
        './HelpTooltip': {}, './ProfileInput': {}, './evidenceHelp': require('../src/views/PbGene2/evidenceHelp'),
    }, true).default;
    const profile = load('src/views/PbGene2/ProfileInput.vue', {
        '../PbGene/HpoTermInput': {}, '../PbGene/hpoContextSearch': {hpoSuggestions:()=>[]},
    }, true).default;
    const events=[];
    const input={query:'HP:0001250',selected:['HP:0001250'],open:true,$emit:(name,value)=>events.push([name,value])};
    profile.methods.finish.call(input);
    assert.equal(input.query,'','Committed HPO IDs leave a chip and an empty query');
    assert.equal(input.open,false,'Submitting a profile closes suggestions');
    assert.deepEqual(events[0],['input','HP:0001250']);
    const resultUrl = contextPanel.methods.phenotypeResultUrl;
    assert.equal(resultUrl({ hpos: 'HP:0000364' }), '/pb_phenotype.html?query=HP%3A0000364');
    assert.equal(resultUrl({ hpos: 'HP:0000364, HP:0001250' }), '/pb_phenotype.html?query=HP%3A0000364%2CHP%3A0001250');
    assert.equal(resultUrl({ hpos: 'HP:0001250' }), '/pb_phenotype.html?query=HP%3A0001250', 'Each history row links its own profile');
    assert.equal(resultUrl({ hpos: '' }), '', 'No unrelated default phenotype for an empty run');
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
    const releaseRows = Array.from({length:119}, (_,index)=>({hpoId:`HP:${String(index+1).padStart(7,'0')}`,label:`Phenotype ${index}`,pValue:.001,qValue:index<9?.01:.5}));
    page.genePhenotypeAssociations = releaseRows;
    assert.equal(page.associationPageCount,24,'All delivered associations are paginated, without a top-15 cutoff');
    page.associationPage=24;
    assert.equal(page.visibleAssociations.length,4,'The last page uses the actual remainder');
    assert.equal(page.filteredAssociations.length,119,'Removing the selector retains every delivered result');
    page.associationPage=1;
    page.genePhenotypeAssociations=[];
    page.loadCarrierSummary = async () => {};
    page.fetchVisibleCarrierSampleDetails = () => {};
    page.geneCarrierSummary = { status: 'ready', carrierTotal: 13, matchedMetadataCount: 12, phenotypeMetadataCount: 10, observedPhenotypes: [{ hpoId: 'HP:0001250', count: 4 }] };
    const originalGeneSummary = page.geneCarrierSummary;
    page.liveDataLoaded = true;
    page.selectVariant(page.variantRows[0].id);
    assert.equal(page.geneCarrierSummary, originalGeneSummary, 'Variant selection must not replace gene-wide demographics');
    assert.equal(page.phenotypeCarrierCount('HP:0001250'), '4 (partial)');
    assert.equal(page.phenotypeCarrierCount('HP:9999999'), '0 (partial)');
    assert.ok(page.phenotypeCountTitle.includes('10 / 13'), 'The common denominator stays available in the info definition');
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
    page.toggleVariantFilter('consequence', 'missense_variant');
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
    page.variantRows[3].variantEvidence = [{ label: 'LOFTEE', value: 'LC' }];
    page.toggleVariantFilter('predictionCoverage', 'Annotated');
    assert.equal(page.matchingVariantRows.length, page.predictionAnnotatedVariantCount, 'Coverage filtering uses the same availability rule, including non-HC LoFTEE annotations');
    assert.ok(page.matchingVariantRows.some(row => row.id === page.variantRows[3].id));
    page.clearVariantFilters();
    page.toggleVariantFilter('annotations', 'AM annotated');
    assert.equal(page.matchingVariantRows.length, 1);
    page.toggleVariantFilter('annotations', 'REVEL annotated');
    assert.equal(page.matchingVariantRows.length, 2, 'Annotation selections use OR within their category');
    page.toggleVariantFilter('clinvar', 'P/LP');
    assert.equal(page.matchingVariantRows.length, 1, 'Annotations intersect other filter categories');
    page.clearVariantFilters();
    page.variantRows[2].consequence = 'splice_donor_variant';
    page.variantRows[3].consequence = 'frameshift_variant';
    page.variantRows[4].consequence = 'Unavailable';
    page.variantRows[5].consequence = 'splice_region_variant&intron_variant';
    for (const item of page.variantMix.consequence) {
        page.toggleVariantFilter('consequence', item.label);
        assert.equal(page.matchingVariantRows.length, item.count, 'Every consequence count filters the exact variant-table values');
        assert.ok(page.matchingVariantRows.every(row => page.variantRowFacets(row).consequence === item.label));
        page.clearVariantFilters();
    }
    assert.ok(page.variantMix.consequence.length >= 5, 'Distinct consequences are not collapsed into Missense/Other');
    assert.ok(page.variantMix.consequence.some(item => item.label === 'splice_region_variant&intron_variant'), 'Composite table values count each variant once');
    const demoOptions = load('src/views/PbGene2/Demographics.vue', { '../PbGene/carrierAge': load('src/views/PbGene/carrierAge.js'), './HelpTooltip':{} }, true).default;
    const overviewOptions = load('src/views/PbGene2/VariantOverview.vue', { './HelpTooltip': {}, './referenceProvenance': load('src/views/PbGene2/referenceProvenance.js') }, true).default;
    const overview = new Vue({ ...overviewOptions, propsData: { mix: page.variantMix, total: page.variantRows.length, annotatedCount: page.predictionAnnotatedVariantCount, sampleCount: 100, filters: page.variantFilters } });
    assert.equal(overview.groups.length, 3);
    for (const group of overview.groups) assert.equal(group.segments.reduce((sum, item) => sum + item.count, 0), page.variantRows.length, 'Every stacked bar partitions the same full variant set');
    assert.equal(overview.predictorRows[0].count, 1);
    assert.equal(overview.predictorRows[1].count, 2, 'Overlapping predictor counts are preserved rather than summed into coverage');
    const otherClinvar = overview.groups[2].segments.find(item => item.label === 'Other');
    if (otherClinvar) assert.equal(otherClinvar.filterLabel, 'Other classification', 'Short display labels retain the existing filter key');
    assert.ok(overview.groups[0].segments.some(item => item.filterLabel === 'frameshift_variant'), 'Consequence labels retain exact filter values');
    assert.equal(overview.showPredictors, false, 'Predictor details start collapsed');
    overview.$on('filter', (group, label) => { page.toggleVariantFilter(group, label); overview.filters = page.variantFilters; });
    const annotated = overview.groups[1].segments[0];
    overview.activate(annotated);
    assert.equal(overview.showPredictors, true, 'Annotated opens the three predictor details');
    assert.equal(page.matchingVariantRows.length, page.predictionAnnotatedVariantCount, 'Clicking the annotated count filters its exact union');
    overview.activate(annotated);
    assert.equal(overview.showPredictors, false);
    assert.equal(page.matchingVariantRows.length, page.variantRows.length);
    overview.activate(overview.groups[1].segments[1]);
    assert.equal(page.matchingVariantRows.length, page.variantRows.length - page.predictionAnnotatedVariantCount);
    assert.equal(page.variantFiltersActive, true);
    page.clearVariantFilters();
    overview.filters = page.variantFilters;
    overview.total = 392;
    assert.equal(overview.segmentFontSize({ label: 'Other', count: 21 }), 18, 'Narrow ClinVar segments retain readable type below the main count size');
    overview.gene = 'OTHER';
    await Vue.nextTick();
    assert.equal(overview.showPredictors, false, 'Changing genes resets disclosure state');
    overview.$destroy();
    const consequenceCounts = [99, 86, 70, 68, 16, 15, 11, 9, 8, 3, 2, 1, 1, 1, 1, 1];
    const fullMix = { consequence: consequenceCounts.map((count, index) => ({ label: 'consequence_' + index, count })), clinvar: [{label:'No ClinVar', count:392}], annotations: [{label:'AM annotated',count:68},{label:'REVEL annotated',count:68}], loftee:21 };
    const pagedOverview = new Vue({ ...overviewOptions, propsData: { mix: fullMix, total: 392, annotatedCount: 92, sampleCount: 16143, filters: page.variantFilters } });
    assert.deepEqual(Array.from(pagedOverview.consequenceBarSegments, item => item.count), [99,86,70,68,69], 'The four largest counts stay separate and remaining variants sum to Others');
    const othersSegment = pagedOverview.consequenceBarSegments[4];
    assert.equal(othersSegment.members.length, 12);
    assert.equal(pagedOverview.otherDividers(othersSegment).length, 11, 'Others retains internal subdivisions without crowding the numbers');
    assert.equal(pagedOverview.consequencePageCount, 4);
    pagedOverview.goToConsequencePage(4);
    assert.equal(pagedOverview.visibleConsequences.length, 4);
    pagedOverview.toggleConsequenceSort();
    assert.equal(pagedOverview.currentConsequencePage, 1);
    assert.ok(pagedOverview.visibleConsequences.every(row => row.count === 1), 'Sort applies to all categories before pagination');
    assert.equal(pagedOverview.consequenceBarSegments[0].count, 99, 'Changing table sort must not regroup the chart');
    const originalVariantRows = page.variantRows;
    page.variantRows = fullMix.consequence.flatMap((item, index) => Array.from({length:item.count}, (_, n) => ({...data.variantRows[0], id:`test-${index}-${n}`, consequence:item.label})));
    pagedOverview.$on('filter-consequences', labels => { page.toggleConsequenceGroup(labels); pagedOverview.filters = page.variantFilters; });
    pagedOverview.activate(othersSegment);
    assert.equal(page.matchingVariantRows.length, 69, 'Others selects the union of its actual table consequences');
    assert.equal(pagedOverview.selected(othersSegment), true);
    page.toggleVariantFilter('consequence', 'consequence_0');
    pagedOverview.activate(othersSegment);
    assert.equal(page.matchingVariantRows.length, 99, 'Clearing Others preserves separately selected categories');
    assert.deepEqual(Array.from(page.variantFilters.consequence), ['consequence_0']);
    page.clearVariantFilters();
    page.variantRows = originalVariantRows;
    pagedOverview.$destroy();
    const projectRows = Array.from({ length: 40 }, (_, index) => ({ project: 'Project ' + index, count: index + 1, investigator: index === 39 ? 'Investigator A' : undefined }));
    const projectDemo = new Vue({ ...demoOptions, propsData: { scope: 'gene', overview: true, carrierCount: 1000, summary: { status: 'ready', matchedMetadataCount: 1000, geneCarrierDemographics: { byProject: projectRows } } } });
    assert.equal(projectDemo.showCoverage, false, 'Complete overview metadata does not duplicate the sample total');
    assert.equal(projectDemo.projectPageCount, 10);
    assert.equal(projectDemo.visibleProjects.length, 4);
    assert.equal(projectDemo.visibleProjects[0].count, 40, 'Project counts sort descending by default');
    projectDemo.goToProjectPage(10);
    assert.equal(projectDemo.visibleProjects.length, 4);
    projectDemo.projectSearch = 'Investigator A';
    await Vue.nextTick();
    assert.equal(projectDemo.currentProjectPage, 1, 'Searching from a later page resets the project page');
    assert.equal(projectDemo.visibleProjects[0].label, 'Project 39', 'Investigator search only uses supplied project-level metadata');
    projectDemo.projectSearch = '';
    projectDemo.toggleProjectSort();
    await Vue.nextTick();
    assert.equal(projectDemo.visibleProjects[0].count, 1);
    assert.equal(projectRows[0].count, 1, 'Sorting must not mutate source metadata');
    projectDemo.summary = { status: 'ready', matchedMetadataCount: 1000, geneCarrierDemographics: { byProject: [{project: 'Shared project', count: 9}, {project: 'Different project', count: 2}], projectInvestigators: { 'Shared project': ['Investigator A', 'Investigator B'], 'Different project': ['Investigator C'] } } };
    projectDemo.projectSearch = 'Investigator B';
    await Vue.nextTick();
    assert.equal(projectDemo.filteredProjects.length, 1);
    assert.equal(projectDemo.filteredProjects[0].investigator, 'Investigator A · Investigator B', 'Project-level labels attach to the matching project only');
    assert.equal(projectDemo.filteredProjects[0].count, 9, 'Multiple investigators do not duplicate carrier counts');
    projectDemo.projectSearch = 'No such project';
    await Vue.nextTick();
    assert.equal(projectDemo.visibleProjects.length, 0);
    assert.equal(projectDemo.currentProjectPage, 1);
    projectDemo.summary = { status: 'ready', matchedMetadataCount: 900, geneCarrierDemographics: {} };
    assert.equal(projectDemo.showCoverage, true, 'Partial metadata coverage remains visible');
    projectDemo.$destroy();
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
    const rerun = { id: 'previous', hpos: 'HP:0000364, HP:0001250' };
    const saved = { scoreType: 'sum', analysisSet: 'affected', significanceThreshold: .01, minCarriers: 25 };
    let rerunCalls = 0;
    const replay = {
        contextLoading: false, searchGeneLoading: false, contextRuns: [rerun], contextRunMeta: { previous: saved },
        contextInput: 'HP:0001252', contextScoreType: 'max', contextAnalysisSet: 'all', contextSignificanceThreshold: .05, contextMinCarriers: 10,
        async runContextAnalysis() {
            rerunCalls++;
            assert.equal(this.contextInput, rerun.hpos);
            assert.equal(this.contextScoreType, 'sum'); assert.equal(this.contextAnalysisSet, 'affected');
            assert.equal(this.contextSignificanceThreshold, .01); assert.equal(this.contextMinCarriers, 25);
            assert.equal(this.rerunningContextRunId, 'previous');
        },
    };
    await options.methods.rerunContextAnalysis.call(replay, rerun);
    assert.equal(rerunCalls, 1); assert.equal(replay.rerunningContextRunId, '');
    replay.contextLoading = true;
    await options.methods.rerunContextAnalysis.call(replay, rerun);
    assert.equal(rerunCalls, 1, 'Concurrent re-runs are blocked');
    replay.contextLoading = false;
    await options.methods.rerunContextAnalysis.call(replay, { id:'other-gene', hpos:'HP:0001252' });
    assert.equal(rerunCalls, 1, 'Unrelated history rows are not replayed');
    replay.contextRunMeta = {};
    await options.methods.rerunContextAnalysis.call(replay, rerun);
    assert.equal(rerunCalls, 1, 'Missing saved settings must not silently use the current form settings');
    assert.equal(contextPanel.methods.canRerun.call({runMeta:{previous:saved}}, rerun), true);
    assert.equal(contextPanel.methods.canRerun.call({runMeta:{}}, rerun), false);
    let clearedScores = 0;
    const deleting = {
        contextLoading:false, searchGeneLoading:false,
        contextRuns:[{id:'old'}, {id:'active'}], contextRunMeta:{old:saved,active:saved},
        currentContextRunId:'active', appliedContext:{terms:['HP:0001250']}, activeContextTerms:['HP:0001250'], contextTermDetails:[{id:'HP:0001250'}],
        $delete(object,key) { delete object[key]; },
        applyVariantContextScores(result) { assert.deepEqual(Object.keys(result),[]); clearedScores++; },
    };
    options.methods.deleteContextRun.call(deleting,{id:'old'});
    assert.deepEqual(deleting.contextRuns.map(run=>run.id),['active']);
    assert.equal(deleting.currentContextRunId,'active'); assert.equal(clearedScores,0,'Deleting an inactive row keeps applied evidence');
    assert.equal(deleting.contextRunMeta.old,undefined);
    deleting.contextLoading=true;
    options.methods.deleteContextRun.call(deleting,{id:'active'});
    assert.equal(deleting.contextRuns.length,1,'Deletion is disabled during a calculation');
    deleting.contextLoading=false;
    options.methods.deleteContextRun.call(deleting,{id:'active'});
    assert.equal(deleting.contextRuns.length,0); assert.equal(deleting.currentContextRunId,'');
    assert.equal(deleting.appliedContext,null); assert.equal(deleting.activeContextTerms.length,0);
    assert.equal(clearedScores,1,'Deleting the applied row clears the matching variant evidence');
    console.log('PB Gene2: pin/search isolation, metadata coverage, independent gene scope, route retention, shared calculations, and Vue templates PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
