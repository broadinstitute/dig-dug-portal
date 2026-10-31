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

    const inputOptions = load('src/views/PbPhenotype/PhenotypeQueryInput.vue', { './hpoSearch': search }).default;
    const model = load('src/views/PbPhenotype/phenotypeModel.js');
    let metadataRequests = 0;
    let profileRows = [];
    const pageOptions = load('src/views/PbPhenotype/Template.vue', {
        './orphanetReference.generated': { ORPHANET_REFERENCE: { terms, diseases: [], associations: {}, meta: {} } },
        './additionalDiseaseReferences.generated.json': { terms: {}, profiles: [] },
        './phenotypeModel': model, './hpoSearch': search,
        './geneReferenceEvidence': require('../src/views/PbPhenotype/geneReferenceEvidence'),
        './PhenotypeQueryInput.vue': { default: inputOptions, __esModule: true },
        './PhenotypeHelp.vue': {},
        './sampleSelection': require('../src/views/PbPhenotype/sampleSelection'),
        './profileGeneApi': {}, '../../utils/rphersUnits': require('../src/utils/rphersUnits'),
        '@/utils/bioIndexUtils': { request: async (_, { q }) => {
            metadataRequests++;
            return { ok: true, json: async () => ({ data: [{ SampleInVCF: q, sample_id: q.slice(0, -4), clean_name: 'Project P' }] }) };
        } },
    }, { fetch: async () => ({ ok: true, json: async () => ({
        samples: profileRows, pagination: { total: profileRows.length },
        scoring_method: 'residual PheRS: rphers_fast.score_samples', cohort_sample_count: 16366,
    }) }) }).default;
    const page = new Vue({ ...pageOptions, parent: new Vue({ data: { diseaseGroup: '', frontContents: {} } }) });
    assert.equal(page.reference.__ob__, undefined, 'The static ontology must not be recursively observed');
    let parentRenders = 0;
    page.$watch(() => { parentRenders++; return page._render(); }, () => {});
    const before = parentRenders;
    const selected = [];
    const input = new Vue({ ...inputOptions, parent: page, propsData: { searchIndex: index, inputLabel: 'Add phenotype' } });
    input.$on('select', id => selected.push(id));
    for (let length = 1; length <= 'Chest tightness'.length; length++) {
        input.draft = 'Chest tightness'.slice(0, length);
        input.onInput({ target: {} });
        const vnode = input._render();
        const datalist = vnode.children.find(child => child.tag === 'datalist');
        assert.ok(datalist.children.length <= 30, 'Typing must not create the entire ontology as DOM options');
        await Vue.nextTick();
    }
    assert.equal(parentRenders, before, 'Typing drafts must not rerender the whole result page');
    assert.equal(selected.length, 0, 'Partial input must not start a new analysis');
    input.submit(); assert.deepEqual(selected, ['HP:0031352']); assert.equal(input.draft, '');
    input.draft = 'hp:0000001'; input.onInput({ target: {} });
    assert.equal(selected[1], 'HP:0000001');
    input.draft = 'Chest tightness [HP:0031352]'; input.onChange();
    assert.equal(selected[2], 'HP:0031352');
    input.draft = 'HP:000'; input.onInput({ target: {} });
    assert.equal(selected.length, 3);

    const profile = new Vue({ ...inputOptions, propsData: { inputLabel: 'HPO IDs', value: 'HP:0000001' } });
    const submissions = [];
    profile.$on('submit', query => submissions.push(query));
    profile.draft = 'HP:0000001,HP:0000002'; profile.onInput({ target: {} });
    assert.equal(submissions.length, 0);
    profile.submit(); assert.deepEqual(submissions, ['HP:0000001,HP:0000002']);
    profile.value = 'HP:0031352'; await Vue.nextTick(); assert.equal(profile.draft, 'HP:0031352');

    // Full profile responses already contain the joined cohort mapping and
    // demographics. Summarizing thousands of them must not fan out to BioIndex.
    const completeSamples = Array.from({ length: 16366 }, (_, i) => ({
        sample_id: `Complete${i}`, profileMetadataComplete: true,
        cohort_category: i % 2 ? 'Project A' : 'Project B', age_at_enrollment: 10,
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
    assert.equal(page.qualifyingSamples.length, 16366);
    page.selectedProjects = ['Project A'];
    await Vue.nextTick();
    assert.equal(page.qualifyingSamples.length, 8183);
    assert.equal(page.ageSummary.remaining, 8183);
    assert.equal(page.sexSummary.remaining, 8183);
    assert.equal(metadataRequests, 0, 'Changing projects must reuse the profile metadata');
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
    page.$destroy(); input.$destroy(); profile.$destroy();
    console.log('Phenotype input: 20k-term bounded autocomplete, isolated typing, selection/search, static reference, batched cached metadata PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
