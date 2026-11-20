const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');
const search = require('../src/views/PbPhenotype/hpoSearch');

function load(file, imports = {}, globals = {}) {
    const raw = fs.readFileSync(file, 'utf8');
    const sfc = file.endsWith('.vue') ? compiler.parseComponent(raw) : null;
    const exports = {};
    const code = babel.transformSync(sfc ? sfc.script.content : raw, {
        filename: file, babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'],
    }).code;
    vm.runInNewContext(code, { exports, module: { exports }, require(name) {
        if (Object.hasOwn(imports, name)) return imports[name];
        throw new Error(`Unexpected import: ${name}`);
    }, window: { location: { search: '?query=HP:0000001,HP:0000002' } },
    URLSearchParams, AbortController, setTimeout, clearTimeout, console, ...globals });
    if (sfc) {
        const compiled = compiler.compile(sfc.template.content);
        assert.deepEqual(compiled.errors, []);
        Object.assign(exports.default, { render: new Function(compiled.render),
            staticRenderFns: compiled.staticRenderFns.map(code => new Function(code)) });
    }
    return exports;
}

async function main() {
    const terms = Object.fromEntries(Array.from({ length: 20000 }, (_, i) =>
        [`HP:${String(i).padStart(7, '0')}`, [`Common phenotype ${i}`, '', [], []]]));
    terms['HP:0031352'] = ['Chest tightness', '', [], []];
    const index = search.createHpoSearchIndex(terms);
    assert.ok(Object.isFrozen(index) && Object.isFrozen(index.entries));
    assert.equal(search.hpoSuggestions(index, '').length, 0);
    assert.equal(search.hpoSuggestions(index, 'common').length, 30);
    assert.equal(search.hpoSuggestions(index, 'chest')[0].id, 'HP:0031352');
    assert.equal(search.hpoSuggestions(index, 'HP:0031352')[0].name, 'Chest tightness');
    assert.equal(search.resolveIndexedHpo(index, ' CHEST TIGHTNESS '), 'HP:0031352');
    assert.equal(search.resolveIndexedHpo(index, 'Chest tightness [HP:0031352]'), 'HP:0031352');

    const model = load('src/views/PbPhenotype/phenotypeModel.js');
    let metadataRequests = 0;
    let profileRows = [];
    const pageOptions = load('src/views/PbPhenotype/Template.vue', {
        '../PbGene/SummaryPager': {}, '../PbGene2/InfoRail.vue': {}, '@/components/pb/PortalGuide.vue': {},
        './orphanetReference.generated': { ORPHANET_REFERENCE: { terms, diseases: [], associations: {}, meta: {} } },
        './additionalDiseaseReferences.generated.json': { terms: {}, profiles: [] },
        './SinglePhenotypeResults.vue': {}, './singlePhenotypeModel': load('src/views/PbPhenotype/singlePhenotypeModel.js', {'./phenotypeModel': model}),
 './phenotypeModel': model, './hpoSearch': search,
        '../../utils/crdcHpoAvailability': {...require('../src/utils/crdcHpoAvailability'),loadCrdcHpoCounts:async()=>Object.freeze(Object.fromEntries(Object.keys(terms).map(id=>[id,1])))},
        './geneReferenceEvidence': require('../src/views/PbPhenotype/geneReferenceEvidence'),
        './PhenotypeHelp.vue': {},
        './PhenotypeProfileEditor.vue': {}, './profileFilters': require('../src/views/PbPhenotype/profileFilters'),
        './sampleSelection': require('../src/views/PbPhenotype/sampleSelection'),
        './profileGeneApi': {}, '../../utils/rphersUnits': require('../src/utils/rphersUnits'),
        '@/utils/pbBioIndex': { request: async (_, { q }) => {
            metadataRequests++;
            return { ok: true, json: async () => ({ data: [{ SampleInVCF: q, sample_id: q.slice(0, -4), clean_name: 'Project P' }] }) };
        } },
    }, { fetch: async () => ({ ok: true, json: async () => ({
        samples: profileRows, pagination: { total: profileRows.length },
        scoring_method: 'residual PheRS: rphers_fast.score_samples', cohort_sample_count: 16366,
    }) }) }).default;
    const page = new Vue({ ...pageOptions, parent: new Vue({ data: { diseaseGroup: '', frontContents: {} } }) });
    assert.equal(page.reference.__ob__, undefined, 'The static ontology must not be recursively observed');
    const completeSamples = Array.from({ length: 16366 }, (_, i) => ({
        sample_id: `Complete${i}`, profileMetadataComplete: true,
        cohort_category: i % 2 ? 'Project A' : 'Project B', investigator: i % 2 ? 'inv_a' : 'inv_b', age_at_enrollment: 10,
        gender: 'female', expanded_hpo_ids: ['HP:0000001', 'HP:0000002'],
        matches: '2/2', rphers_z: 1,
    }));
    profileRows = completeSamples.slice(0, 6).map(({ profileMetadataComplete, ...row }) => row);
    await page.loadSamples(); await Vue.nextTick();
    assert.equal(page.matches.length, 6);
    assert.ok(page.matches.every(row => row.profileMetadataComplete), 'Profile loading must recognize metadata already supplied by the API');
    assert.equal(metadataRequests, 0, 'Normal profile loading must not issue sample-by-sample BioIndex requests');
    const started = process.hrtime.bigint();
    await page.loadSampleInfo(completeSamples);
    assert.equal(metadataRequests, 0, 'Complete profile metadata must require zero per-sample requests');
    assert.equal(page.sampleInfoLoading, false, 'Project controls must not wait for redundant metadata');
    page.sampleInfo = { Complete0: { clean_name: 'Different legacy label' } };
    assert.equal(page.sampleCohortDisease(completeSamples[0]), 'Project B', 'Profile mapping stays stable when BioIndex metadata differs');
    assert.equal(page.sampleCohortDisease({ ...completeSamples[0], cohort_category: '' }), 'Unknown', 'A missing profile mapping is explicit, not silently substituted');
    page.matches = completeSamples;
    await Vue.nextTick();
    assert.equal(page.cohortDiseaseSummary.length, 2);
    assert.deepEqual(Array.from(page.cohortDiseaseSummary.find(row => row.name === 'Project B').investigators), ['inv_b']);
    assert.equal(page.qualifyingSamples.length, 16366);
    page.selectedProjects = ['Project A'];
    await Vue.nextTick();
    assert.equal(page.qualifyingSamples.length, 8183);
    assert.equal(page.ageSummary.remaining, 8183);
    assert.equal(page.sexSummary.remaining, 8183);
    assert.equal(metadataRequests, 0, 'Changing projects must reuse the profile metadata');
    page.geneSampleScope = 'all';
    page.excluded = ['HP:0031352'];
    page.advancedRules = [{ field: 'phenotype', operator: 'exclude', value: 'HP:0031352' }];
    await Vue.nextTick();
    page.excluded = []; page.advancedRules = [];
    console.log(`Complete profile: 16,366 rows, 0 metadata requests, summary + selection ${Number(process.hrtime.bigint() - started) / 1e6} ms`);
    page.matches = []; page.selectedProjects = [];
    await Vue.nextTick();
    page.sampleInfo = {};

    let metadataUpdates = 0;
    page.$watch('sampleInfo', () => metadataUpdates++);
    const samples = Array.from({ length: 32 }, (_, i) => ({ sample_id: `S${i}` }));
    await page.loadSampleInfo(samples); await Vue.nextTick();
    assert.equal(metadataRequests, 32);
    assert.equal(Object.keys(page.sampleInfo).length, 32);
    assert.equal(Object.keys(page.sampleInfoChecked).length, 32);
    assert.equal(metadataUpdates, 1, 'Metadata must publish a batch, rather than rerendering once per sample');
    assert.equal(page.sampleInfoLoading, false);
    await page.loadSampleInfo(samples);
    assert.equal(metadataRequests, 32, 'Already loaded metadata remains cached');
    page.$destroy();
    console.log('Phenotype input: 20k-term bounded search, static reference, batched cached metadata PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
