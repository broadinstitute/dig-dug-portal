const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const assert = require('node:assert/strict');
const { createRequire } = require('node:module');
const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'src/views/PbVariant/pageModel.js');
const req = createRequire(filename);
const babel = req('@babel/core');
const Vue = req('vue');
const variantId = 'chr13:20189005:CTG:C';
const requests = [];
const replies = [];
const overrides = {
    '@/views/PbGene/pbGeneBioIndexAdapter': {},
    '@/utils/bioIndexUtils': {},
    '@/views/KrClinicalFocus/focusStore': { readClinicalFocus: () => null },
    '@/views/PbGene/hpoContextSearch': {
        hpoLabel: id => ({'HP:0000364': 'Hearing abnormality', 'HP:0030766': 'Ear pain'})[id] || id,
        resolveHpoTerms: input => input.split(/[,\s]+/).filter(Boolean),
        contextApiError: async () => 'Analysis failed',
        contextApiFailure: async () => ({ missingTerms: [], message: 'Analysis failed' }),
    },
};
const output = { exports: {} };
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    babelrc: false, configFile: false, plugins: [req.resolve('@babel/plugin-transform-modules-commonjs')],
}).code;
vm.runInNewContext(code, {
    module: output, exports: output.exports,
    require: name => Object.hasOwn(overrides, name) ? overrides[name] : req(name),
    window: { location: { search: `?query=${variantId}&gene=GJB2` } }, URLSearchParams, console,
    fetch: async (url, options) => {
        requests.push({ url, ...JSON.parse(options.body) });
        assert(replies.length, 'Unexpected API request');
        return await replies.shift();
    },
});
const model = output.exports;
function response(terms, beta, mean) {
    const reference = {
        version: 'rphers_scoring_cohort_sample_sd_v1', status: 'ok',
        reference_id: terms.join(','), data_release_id: 'data', scoring_cohort_id: 'cohort',
        reference_n: 100, reference_mean: 2, reference_sd: 4, ddof: 1, query_hpo: terms,
    };
    const standardized = { standardization_status: 'ok', standardization_reference_id: reference.reference_id };
    return { ok: true, json: async () => ({
        rphers_standardization: reference,
        variant_match_scores: { [variantId]: { ...standardized, status: 'ok', carrier_count: 1, scored_carrier_count: 1, mean_rphers_z: mean } },
        variant_associations: { [variantId]: { ...standardized, status: 'ok', beta_sd: beta, beta: beta * 4, p_value: 0.54, n_carriers: 1, n_samples: 100, model_version: 'ols' } },
    }) };
}
function deferred() { let resolve; const promise = new Promise(r => { resolve = r; }); return { promise, resolve }; }
async function main() {
    const coGeneRuns = [];
    const app = new Vue({
        data: model.createPbVariantState,
        computed: model.pbVariantComputed,
        methods: { ...model.pbVariantMethods, revealAppliedPhenotypes() {}, runCoGeneAssociations(terms, id) { coGeneRuns.push({ terms, id }); } },
    });
    app.variantIdentity = { ...app.variantIdentity, canonicalId: variantId, gene: 'GJB2' };
    app.$refs.profile = { resetDraft() {} };
    app.contextInput = 'HP:0000364';
    replies.push(response(['HP:0000364'], -0.608, -0.549));
    await app.runVariantContext();
    assert.equal(app.profileRuns.length, 1);
    const first = app.profileRuns[0];
    assert.equal(first.association.beta, -0.608, 'Use server SD beta, not raw beta');
    assert.equal(first.match.matchScore, -0.549);
    assert(Object.isFrozen(first) && Object.isFrozen(first.association) && Object.isFrozen(first.terms));

    app.contextInput = 'HP:0000364, HP:0030766';
    app.contextScoreTypeInput = 'sum';
    app.contextAnalysisSetInput = 'affected';
    const secondResponse = deferred();
    replies.push(secondResponse.promise);
    const pending = app.runVariantContext();
    assert(app.contextLoading);
    assert.equal(app.currentProfileRunId, first.id, 'Old analysis stays applied while waiting');
    assert.equal(app.contextAssociation.beta, -0.608);
    secondResponse.resolve(response(['HP:0000364', 'HP:0030766'], -0.587, -0.527));
    await pending;
    assert.equal(app.profileRuns.length, 2);
    const second = app.profileRuns[0];
    assert.equal(app.profileRuns[1], first);
    assert.equal(second.scoreType, 'sum');
    assert.equal(second.analysisSet, 'affected');
    assert.equal(first.scoreType, 'max');
    assert.equal(first.analysisSet, 'all');
    assert.equal(first.association.beta, -0.608);
    assert.equal(second.association.beta, -0.587);
    assert.equal(app.currentProfileRunId, second.id);
    assert.equal(requests[1].affected_only, true);
    assert.equal(requests[1].score_type, 'sum');

    replies.push({ ok: false });
    await app.runVariantContext();
    assert.equal(app.contextError, 'Analysis failed');
    assert.equal(app.profileRuns.length, 2);
    assert.equal(app.currentProfileRunId, second.id, 'Failed calculation cannot replace Applied');
    assert.equal(app.contextAssociation.beta, -0.587);

    replies.push(response(['HP:0000364'], -0.608, -0.549));
    await app.rerunVariantProfile(first);
    assert.equal(app.profileRuns.length, 3, 'Re-run adds a fresh row and retains the original');
    assert.equal(app.profileRuns[2], first);
    assert.equal(app.contextScoreTypeInput, 'max');
    assert.equal(app.contextAnalysisSetInput, 'all');
    assert.equal(requests.at(-1).terms, 'HP:0000364');
    assert.equal(requests.at(-1).score_type, 'max');
    const appliedId = app.currentProfileRunId;
    app.deleteVariantProfile(second);
    assert.equal(app.profileRuns.length, 2);
    assert.equal(app.currentProfileRunId, appliedId, 'Deleting an older row leaves applied analysis intact');
    app.deleteVariantProfile(app.profileRuns[0]);
    assert.equal(app.profileRuns.length, 1);
    assert.equal(app.profileRuns[0], first);
    assert.equal(app.currentProfileRunId, null);
    assert.equal(app.contextAssociation, null);
    assert.equal(coGeneRuns.length, 3, 'Only successful analyses launch co-gene requests');

    // Summary HPO counts use the same exact recorded-ID OR endpoint as Gene2,
    // independently of scoring settings, display filters and score availability.
    app.variantAvailable = true;
    app.contextAssociation = {beta:-0.608};
    app.activeContextTerms = ['HP:0000364', 'HP:0030766'];
    const key = app.variantHpoCountKey;
    const hpoResponse = (terms, count, complete=true) => ({ok:true,json:async()=>({gene:'GJB2',hpo_terms:terms,match:'any',variants:{[variantId]:{count,metadataCount:complete?2:1,carrierTotal:2,complete}}})});
    replies.push(hpoResponse(['HP:0000364','HP:0030766'],1));
    await app.loadVariantHpoCounts(key);
    assert.equal(app.variantHpoCountDisplay,'1');
    assert.equal(requests.at(-1).url,'/__gene_variant_hpo_counts__');
    assert.deepEqual(requests.at(-1).hpo_terms,['HP:0000364','HP:0030766']);
    app.contextAnalysisSetInput='affected';app.filters.sex=['F'];
    assert.equal(app.variantHpoCountKey,key,'HPO reference count includes all observed variant carriers');
    replies.push(hpoResponse(['HP:0000364','HP:0030766'],0,false));
    await app.loadVariantHpoCounts(key);
    assert.equal(app.variantHpoCountDisplay,'0 (partial)','known zero with missing coverage must be labelled');
    const staleCount = deferred(); replies.push(staleCount.promise);
    const counting = app.loadVariantHpoCounts(key);
    app.activeContextTerms=['HP:0030766'];
    staleCount.resolve(hpoResponse(['HP:0000364','HP:0030766'],99));
    await counting;
    assert.equal(app.variantHpoCount,null,'late HPO count cannot populate a different applied profile');
    replies.push({ok:false});
    await app.loadVariantHpoCounts(app.variantHpoCountKey);
    assert.equal(app.variantHpoCountDisplay,'Unavailable','failed metadata queries must not display zero');
    app.contextAssociation=null;
    assert.equal(app.variantHpoCountDisplay,'—','unapplied context has no HPO reference count');

    const late = deferred();
    replies.push(late.promise);
    const staleRun = app.runVariantContext();
    app.contextRunId++;
    app.contextLoading = false;
    app.currentProfileRunId = null;
    app.variantIdentity = { ...app.variantIdentity, canonicalId: 'chr1:1:A:G' };
    app.profileRuns = [];
    late.resolve(response(['HP:0000364'], 9, 9));
    await staleRun;
    assert.equal(app.profileRuns.length, 0, 'Late response cannot appear in another variant history');
    assert.equal(app.contextAssociation, null);
    console.log('PB_VARIANT_PROFILE_HISTORY_AND_ASYNC_LIFECYCLE_PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
