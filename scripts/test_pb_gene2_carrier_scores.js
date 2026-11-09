const assert = require('node:assert/strict');
const Vue = require('vue');
const { readCarrierScores, fetchCarrierScores, carrierScoreMixin } = require('../src/views/PbGene2/carrierScores');
const reference = { version: 'rphers_scoring_cohort_sample_sd_v1', status: 'ok', reference_id: 'ref',
    data_release_id: 'release', scoring_cohort_id: 'cohort', reference_n: 20, reference_mean: 1,
    reference_sd: 2, ddof: 1, query_hpo: ['HP:0001250'] };
const context = { terms: ['HP:0001250'], scoreType: 'sum', analysisSet: 'affected', reference };
const result = () => ({ gene: 'TEST', rphers_standardization: reference,
    variant_carrier_residuals: { variant_id: 'chr1:1:A:T', rphers_standardization: reference,
        sample_rphers_z: { A: -0.549, B: 0, C: null }, sample_scores: { A: 999, C: 10 } } });

async function main() {
    const coverage = carrierScoreMixin.methods.scoredCarrierCoverage;
    const coverageRow = { phenotypeMatchScoredCarrierCount: 1, carrierCount: 2 };
    assert.equal(coverage.call({ appliedContext: context }, coverageRow), '1 / 2');
    assert.equal(coverage.call({ appliedContext: context }, { ...coverageRow, phenotypeMatchScoredCarrierCount: 0 }), '0 / 2');
    assert.equal(coverage.call({ appliedContext: context }, { ...coverageRow, phenotypeMatchScoredCarrierCount: null }), 'Unavailable');
    assert.equal(coverage.call({ appliedContext: { ...context, reference: null } }, coverageRow), 'Unavailable');
    assert.equal(coverage.call({ appliedContext: null }, coverageRow), 'no context');
    assert.deepEqual(readCarrierScores(result(), 'TEST', '1:1:A:T', context), { a: -.549, b: 0 });
    assert.throws(() => readCarrierScores(result(), 'OTHER', '1:1:A:T', context));
    assert.throws(() => readCarrierScores(result(), 'TEST', '1:2:A:T', context));
    assert.throws(() => readCarrierScores(result(), 'TEST', '1:1:A:T', { ...context, terms: ['HP:0001252'] }));
    assert.throws(() => readCarrierScores(result(), 'TEST', '1:1:A:T', { ...context, reference: { ...reference, reference_id: 'other' } }));
    const unsupported = result(); delete unsupported.variant_carrier_residuals.sample_rphers_z;
    assert.throws(() => readCarrierScores(unsupported, 'TEST', '1:1:A:T', context));
    const empty = result(); empty.variant_carrier_residuals.sample_rphers_z = {};
    assert.deepEqual(readCarrierScores(empty, 'TEST', '1:1:A:T', context), {});
    await fetchCarrierScores('TEST', 'chr1:1:A:T', context, async (url, options) => {
        assert.equal(url, '/phenotype-analyzer-api/analyze');
        const payload = JSON.parse(options.body);
        assert.equal(payload.variant_id, 'chr1:1:A:T');
        assert.equal(payload.terms, 'HP:0001250');
        assert.equal(payload.score_type, 'sum');
        assert.equal(payload.affected_only, true);
        return { ok: true, json: async () => result() };
    });
    await assert.rejects(fetchCarrierScores('TEST', '1:1:A:T', context, async () => ({ ok: false, status: 500 })), /failed/);
    await assert.rejects(fetchCarrierScores('TEST', '1:1:A:T', context, (_, options) => new Promise((resolve, reject) => {
        options.signal.addEventListener('abort', () => reject(new Error('aborted')));
    }), 5), /timed out/);

    const requests = [];
    const view = new Vue({ mixins: [carrierScoreMixin], data: () => ({ geneInfo: { symbol: 'TEST' },
        expandedVariantId: '1:1:A:T', appliedContext: null,
        variantRows: [{ id: '1:1:A:T', carrierSamples: [{ id: 'A' }, { id: 'B' }, { id: 'C' }] }] }),
        methods: { fetchCarrierScoreResult() { return new Promise((resolve, reject) => requests.push({ resolve, reject })); } } });
    assert.equal(requests.length, 0, 'No request before HPO context is applied');
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'no context');
    view.appliedContext = context;
    await Vue.nextTick();
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'Loading…');
    requests[0].resolve({ a: -.549, b: 0 });
    await Vue.nextTick();
    assert.equal(view.individualCarrierScore({ id: 'A' }), '-0.549');
    assert.equal(view.individualCarrierScore({ id: 'B' }), '0.000', 'Zero is a valid score');
    assert.equal(view.individualCarrierScore({ id: 'C' }), 'none*');
    assert.equal(view.hasMissingCarrierScores, true);
    view.appliedContext = { ...context, analysisSet: 'all' };
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'Loading…', 'Never expose scores from the previous context');
    await Vue.nextTick();
    view.expandedVariantId = '1:2:A:T';
    await Vue.nextTick();
    requests[1].resolve({ a: 9 });
    await Vue.nextTick();
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'Loading…', 'Ignore stale variant/context responses');
    requests[2].reject(new Error('Network failure'));
    await Vue.nextTick();
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'Unavailable');
    assert.equal(view.hasMissingCarrierScores, false, 'Failure is not a missing sample score');
    const retry = view.loadIndividualCarrierScores();
    requests[3].resolve({ a: 2 });
    await retry;
    assert.equal(view.individualCarrierScore({ id: 'A' }), '2.000');
    view.appliedContext = null;
    assert.equal(view.individualCarrierScore({ id: 'A' }), 'no context');
    view.$destroy();
    console.log('Gene2 individual Z-scores: exact reference/variant, zero/missing, timeout/retry, and stale-response checks PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
