const assert = require('node:assert/strict');
const register = require('./sample_match_projects_endpoint');

(async () => {
    const inputs = Array.from({length: 55}, (_, i) => ({sample_id: `S${i}`, vcf_sample_id: `S${i}_G38`, residual: i}));
    const source = {sample_id: 'REF', eligible_sample_count: 55, _reference_vcf_sample_id: 'REF_E38',
        _project_inputs: inputs, phenotypeMatches: inputs.map(row => ({sampleId: row.sample_id,
            project: 'Old CSV project', investigator: 'Old metadata investigator', residual: row.residual})),
        projectPhenotypeSummary: [{project: 'Old CSV project', n: 55}], rphers_standardization: {version: 'unchanged'}};
    const calls = [];
    const provider = {accessToken: () => 'private-token', sampleInfo: async (id, token) => {
        calls.push({id, token});
        if (id === 'REF_E38') return {project: 'Project B', investigator: 'Ref investigator'};
        const i = Number(id.match(/^S(\d+)_G38$/)[1]);
        return i === 0 ? null : {project: i >= 50 ? 'Project B' : 'Project A', investigator: 'BioIndex investigator', observedHpoIds: ['HP:0000001', 'HP:0000001']};
    }};
    const result = await register.projectResults(source, provider, 'private-token');
    assert.equal(result.project_metadata_source, 'BioIndex samples-info');
    assert.equal(result.phenotypeMatches.length, 55, 'Return every candidate, including those beyond 50');
    assert.equal(result.phenotypeMatches[1].recordedHpoCount, 1, 'Count distinct observed BioIndex HPO terms');
    assert.equal(result.phenotypeMatches[0].project, 'Unavailable', 'Missing BioIndex record must not use a local label');
    assert.equal(result.phenotypeMatches[1].project, 'Project A');
    assert.equal(result.phenotypeMatches[1].investigator, 'BioIndex investigator');
    assert.equal(result.phenotypeMatches[1].residual, source.phenotypeMatches[1].residual);
    assert.deepEqual(result.rphers_standardization, source.rphers_standardization);
    assert(!Object.hasOwn(result, '_project_inputs'));
    assert(!Object.hasOwn(result, '_reference_vcf_sample_id'));
    const b = result.projectPhenotypeSummary.find(row => row.project === 'Project B');
    assert.deepEqual(b.investigators, ['BioIndex investigator'], 'Project investigators are deduplicated across all eligible candidates');
    assert.deepEqual([b.n, b.q1, b.medianResidual, b.q3, b.currentGroup], [5, 51, 52, 53, true], 'Summary must include candidates beyond the 50 visible matches');
    assert.equal(result.projectPhenotypeSummary.reduce((n, row) => n + row.n, 0), 55);
    const unscored = await register.projectResults({...source,
        _project_inputs: inputs.map((row, index) => index === 54 ? {...row, residual: null} : row)}, provider, 'private-token');
    assert.equal(unscored.phenotypeMatches.length, 55, 'Missing phenotype scores do not remove candidates');
    assert.equal(unscored.projectPhenotypeSummary.reduce((n, row) => n + row.n, 0), 54, 'Project statistics exclude unscored candidates');
    const detail = await register.detailResult({candidate_id: 'S1', hpo_matches: [{id:'HP:0000001',matched:true},{id:'HP:0000002',matched:true},{id:'HP:0000003',matched:false}]},
        {sampleInfo: async () => ({observedHpoIds:['HP:0000001']})}, 'private-token');
    assert.deepEqual(detail.hpo_matches.map(row=>row.matchType), ['recorded','parent-expanded','unmatched']);
    const aliased = await register.detailResult({candidate_id:'S1',hpo_matches:[{id:'HP:0001317',matched:true}]},
        {sampleInfo:async()=>({observedHpoIds:['HP:0002438']})}, 'private-token');
    assert.equal(aliased.hpo_matches[0].matchType,'recorded','An official old HPO ID remains recorded evidence after canonicalization');
    assert(calls.every(call => call.token === 'private-token'));
    await assert.rejects(register.projectResults({...source, _project_inputs: [{sample_id: 'S1', vcf_sample_id: 'WRONG_G38', residual: 0}]}, provider, ''), /Invalid/);
    await assert.rejects(register.projectResults(source, {sampleInfo: async () => {throw Error('BioIndex failed');}}, ''), /BioIndex failed/);
    const routes = {};
    register({post(path, ...handlers) {routes[path] = handlers.at(-1);}}, provider);
    let status;
    routes['/__pb_phenotype_profile__/sample-match-inputs']({}, {status(code) {status = code; return this;}, end() {}});
    assert.equal(status, 404, 'Full candidate vectors must not be proxied to the browser');
    console.log('Sample project labels: shared BioIndex provider, full candidate summaries, auth scope and missing/error behavior PASS');
})().catch(error => {console.error(error); process.exitCode = 1;});
