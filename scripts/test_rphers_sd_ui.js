// Real view-model consumers and CSV export against distinct raw/display values.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');
const vueCompiler = require('vue-template-compiler');
const units = require('../src/utils/rphersUnits');
const singleHpoUnits = require('../src/utils/singleHpoUnits');
const root = path.resolve(__dirname, '..');
const terms = ['HP:0001250', 'HP:0001256'];
const reference = { version: units.VERSION, status: 'ok', reference_id: 'reference', data_release_id: 'data',
    scoring_cohort_id: 'cohort', reference_n: 100, reference_mean: 2, reference_sd: 4, ddof: 1, query_hpo: terms };
const fields = { standardization_status: 'ok', standardization_reference_id: 'reference' };
const gene = { ...fields, status: 'ok', beta: 8, standard_error: 2, beta_sd: 2,
    beta_sd_per_0_1_grs: .2, standard_error_sd_per_0_1_grs: .05, p_value: .04, fdr: .08,
    score_type: 'sum', affected_only: true, n_positive: 12 };
const payload = { rphers_standardization: reference, gene_association: gene,
    variant_associations: { 'chr1:1:A:T': { ...fields, status: 'ok', beta: 8, beta_sd: 2, p_value: .03 } },
    variant_match_scores: { 'chr1:1:A:T': { ...fields, status: 'ok', match_score: 6, mean_rphers_z: 1,
        carrier_count: 2, scored_carrier_count: 2 } },
    variant_carrier_residuals: { variant_id: 'chr1:1:A:T', rphers_standardization: reference,
        sample_scores: { A: 10, B: 2 }, sample_rphers_z: { A: 2, B: 0 } } };
const requests = [];
let csvText;
const browser = { location: { search: '' } };
function load(relative, mocks = {}, globals = {}) {
    const filename = path.join(root, relative);
    let source = fs.readFileSync(filename, 'utf8');
    if (relative.endsWith('.vue')) source = vueCompiler.parseComponent(source).script.content;
    const code = babel.transformSync(source, { filename, babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    const module = { exports: {} };
    vm.runInNewContext(code, { module, exports: module.exports, process: { env: {} }, window: browser, URLSearchParams,
        setTimeout, clearTimeout, ...globals,
        require(name) {
            if (name.includes('rphersUnits')) return units;
            if (name.includes('singleHpoUnits')) return singleHpoUnits;
            if (mocks[name]) return mocks[name];
            if (name.startsWith('./') && !name.endsWith('.vue')) {
                try { return require(path.resolve(path.dirname(filename), name)); } catch (_) { return {}; }
            }
            return {};
        },
    });
    return module.exports;
}
const fetcher = async (url, options) => {
    requests.push({ url, body: JSON.parse(options.body) });
    return { ok: true, json: async () => payload };
};
const hpoMock = { resolveHpoTerms: () => terms, contextApiError: async () => 'error', hpoLabel: id => id };

(async () => {
    const geneModule = load('src/views/PbGene/pageModel.js', { './hpoContextSearch': hpoMock }, { fetch: fetcher });
    const view = { contextInput: terms.join(','), contextSignificanceThreshold: .05, contextMinCarriers: 10,
        contextScoreType: 'sum', contextAnalysisSet: 'affected', geneInfo: { symbol: 'HBB' },
        contextRuns: [], contextTermDetails: [], variantRows: [{ id: 'chr1:1:A:T' }],
        $set: (row, key, value) => { row[key] = value; }, ...geneModule.pbGeneMethods };
    await view.runContextAnalysis();
    assert.equal(view.contextError, '');
    assert.equal(view.contextRuns[0].beta, '0.200');
    assert.equal(view.contextRuns[0].betaRaw, 8);
    assert.equal(view.contextRuns[0].pValue, '0.040');
    assert.equal(view.variantRows[0].phenotypeMatchScore, 1);
    assert.equal(view.variantRows[0].variantEffectBeta, 2);
    assert.equal(requests[0].body.affected_only, true);
    assert.equal(requests[0].body.score_type, 'sum');

    const variantModule = load('src/views/PbVariant/pageModel.js', {
        '@/views/PbGene/hpoContextSearch': hpoMock,
    }, { fetch: fetcher });
    const variant = { ...variantModule.pbVariantMethods, contextInput: terms.join(','), contextRunId: 0,
        contextScoreTypeInput: 'sum', contextAnalysisSetInput: 'affected',
        variantIdentity: { gene: 'HBB', canonicalId: 'chr1:1:A:T' }, contextTermDetails: [],
        runCoGeneAssociations() {} };
    await variant.runVariantContext();
    assert.equal(variant.contextError, '');
    assert.equal(variant.contextMatch.matchScore, 1);
    assert.equal(variant.contextAssociation.beta, 2);
    assert.equal(variant.contextResidualById.a, 2);
    assert.equal(variant.contextResidualById.b, 0);
    variant.coGeneAssociationStatus = 'ready';
    variant.coGeneAssociationByGene = { HBB: gene };
    variant.coGeneStandardization = reference;
    assert.equal(variant.geneAssociationCell('HBB', 'beta'), '0.200');
    assert.equal(Number(variant.geneAssociationCell('HBB', 'fdr')), .08);

    const component = load('src/views/PbPhenotype/Template.vue', {
        './orphanetReference.generated': { ORPHANET_REFERENCE: { terms: {}, diseases: [] } },
        './additionalDiseaseReferences.generated.json': { terms: {}, profiles: [] },
    }, {
        Blob: class { constructor(parts) { csvText = parts.join(''); } },
        URL: { createObjectURL: () => 'blob:export', revokeObjectURL() {} },
        document: { createElement: () => ({ click() {}, remove() {} }), body: { appendChild() {} } },
    }).default;
    const phenotype = { ids: terms, multi: true, geneStandardization: reference, significantGene: () => true,
        geneSampleScope: 'whole', selectedSampleLabel: 'All 2 HPOs', geneReferenceSource: 'all',
        selectedGeneSummary: { total: 2, covered: 2, genes: {} },
        atLeastGeneSummary: { total: 2, covered: 2, genes: {} }, allGeneSummary: { total: 2, covered: 2, genes: {} },
        genes: { analysisSampleCount: 100 }, referenceSourceLabel: source => source,
        geneReferenceSources: ['orphanet', 'omim', 'ddg2p', 'decipher'].map(key => ({key, available: key !== 'decipher'})),
        sortedGenes: [{ gene: 'HBB', diseases: [], association: { beta: 8, betaSdPer0_1Grs: .2,
            standardErrorSdPer0_1Grs: .05, nPositive: 12, pValue: .04, qValue: .08 } }] };
    component.methods.exportGenes.call(phenotype);
    const rows = csvText.trim().split('\n').map(line => line.split(',').map(cell => cell.slice(1, -1)));
    const record = Object.fromEntries(rows[0].map((name, i) => [name, rows[1][i]]));
    assert.equal(Number(record.beta_sd_per_0_1_grs), phenotype.sortedGenes[0].association.betaSdPer0_1Grs);
    assert.equal(Number(record.standard_error_sd_per_0_1_grs), .05);
    assert.equal(Number(record.p), .04);
    assert.equal(Number(record.q), .08);
    assert.equal(record.rphers_reference_id, reference.reference_id);
    assert.equal(component.methods.score(2), '2.000');
    assert.equal(component.methods.score(null), '—');

    phenotype.multi = false;
    phenotype.sortedGenes[0].association = singleHpoUnits.withSingleHpoDisplayUnits({ beta: 8, standardError: 2, betaCiLow: 4.08, betaCiHigh: 11.92, oddsRatio: 2, ciLow: 1.1, ciHigh: 3, pValue: .04, qValue: .08 });
    component.methods.exportGenes.call(phenotype);
    assert(csvText.includes('"beta_log_odds_per_0_1_grs"'));
    assert(!csvText.includes('beta_sd'));
    assert(!csvText.includes('or_per_0.1'));
    const singleRows = csvText.trim().split('\n').map(line => line.split(',').map(cell => cell.slice(1, -1)));
    const singleRecord = Object.fromEntries(singleRows[0].map((name, i) => [name, singleRows[1][i]]));
    assert.equal(Number(singleRecord.beta_log_odds_per_0_1_grs), .8, 'Single-HPO beta gets only the 0.1 predictor step; no SD division');
    assert.equal(Number(singleRecord.standard_error_log_odds_per_0_1_grs), .2);
    assert.equal(Number(singleRecord.beta_ci_low_log_odds_per_0_1_grs), .40800000000000003);
    assert.equal(Number(singleRecord.beta_ci_high_log_odds_per_0_1_grs), 1.192);
    assert.equal(Number(singleRecord.p), .04);
    assert.equal(Number(singleRecord.q), .08);
    const negative = singleHpoUnits.withSingleHpoDisplayUnits({beta: -3, standardError: .5, betaCiLow: -4, betaCiHigh: -2, pValue: .2});
    assert.equal(negative.betaPer0_1Grs, -.30000000000000004);
    assert(negative.betaCiLowPer0_1Grs < negative.betaCiHighPer0_1Grs);
    assert.equal(singleHpoUnits.withSingleHpoDisplayUnits({beta: 0, standardError: 0}).betaPer0_1Grs, 0);
    assert.equal(singleHpoUnits.withSingleHpoDisplayUnits({oddsRatio: 100}).betaPer0_1Grs, null);
    assert.deepEqual(singleHpoUnits.withSingleHpoDisplayUnits(negative), negative, 'Never rescale a display coefficient twice');
    const displayedSingle = load('src/views/PbGene/geneHpoDisplay.js').displayGeneHpoAssociations([phenotype.sortedGenes[0].association])[0];
    assert.equal(displayedSingle.betaPer0_1Grs, Number(singleRecord.beta_log_odds_per_0_1_grs), 'Gene and Phenotype use the same single-HPO effect');

    assert.equal(units.standardizedField({ beta: 8, ...fields }, 'beta_sd', reference), null);
    assert.equal(units.standardizedField({ beta_sd: 2, ...fields }, 'beta_sd', null), null);
    assert.equal(units.standardizedField({ ...fields, beta_sd: 2, standardization_reference_id: 'other' }, 'beta_sd', reference), null);
    console.log('RPHERS_SD_UI_AND_CSV_PASS');
})().catch(error => { console.error(error); process.exitCode = 1; });
