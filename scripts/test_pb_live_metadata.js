const assert = require('assert');
const fs = require('fs');
const vm = require('vm');
const babel = require('@babel/core');
const record = require('../src/views/PbSample/sampleRecord');

function load(file, imports) {
    const exports = {};
    const code = babel.transformSync(fs.readFileSync(file, 'utf8'), { babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    vm.runInNewContext(code, { exports, require: name => {
        if (!(name in imports)) throw Error(`Missing test import: ${name}`);
        return imports[name];
    }, structuredClone });
    return exports;
}

async function main() {
    const info = { sample_id: 'sample1', SampleInVCF: 'sample1_G38', age_at_enrollment: '0', gender: 'male', initial_study_affected: 'Y',
        genes: ['GJB2', 'GJB2', 'USH2A'], phenotypes: [
            { hpo_id: 'HP:0001250', is_observed: true }, { hpo_id: 'HP:0001250', is_observed: true },
            { hpo_id: 'HP:0000365', is_observed: false }, { hpo_id: 'HP:9999999', is_observed: true }] };
    const sample = record.sampleFromInfoRow(info);
    assert.equal(sample.ageAtEnrollment, 0);
    assert.equal(sample.sex, 'male');
    assert.equal(sample.affected, 'Yes');
    assert.equal(sample.phenotypeTotal, 2);
    assert.deepEqual(sample.phenotypeGroups.flatMap(g => g.terms.map(t => t.id)).sort(), ['HP:0001250', 'HP:9999999']);
    assert.deepEqual(sample.genes, ['GJB2', 'USH2A']);
    assert.deepEqual(sample.allVariants, [], 'Gene names must never become invented variant calls');
    const calls = [];
    let mode = 'live';
    const adapter = load('src/views/PbSample/pbSampleBioIndexAdapter.js', {
        './sampleRecord': record,
        '@/utils/bioIndexUtils': { query: async (index, key, opts, privateFlag) => {
            assert.equal(index, 'samples-info'); assert.equal(privateFlag, true); calls.push(key);
            if (mode === 'error') { opts.onError({ detail: 'offline' }); return []; }
            if (mode === 'mismatch') return [{ ...info, sample_id: 'someone-else' }];
            return key === info.SampleInVCF ? [info] : [];
        } },
    });
    assert.equal((await adapter.fetchPbSampleBioIndexState('sample1')).patientStatus, 'live');
    assert.deepEqual(calls, ['sample1_E38', 'sample1_G38']);
    calls.length = 0;
    assert.equal((await adapter.fetchPbSampleBioIndexState('sample1_G38')).patientStatus, 'live');
    assert.deepEqual(calls, ['sample1_G38']);
    mode = 'mismatch';
    assert.equal((await adapter.fetchPbSampleBioIndexState('sample1_G38')).patientStatus, 'not-found');
    mode = 'error';
    assert.equal((await adapter.fetchPbSampleBioIndexState('sample1_G38')).patientStatus, 'unavailable');
    const gene = load('src/views/PbGene/pbGeneBioIndexAdapter.js', {
        '@/utils/bioIndexUtils': { query: async index => index === 'gene' ? [] : [{
            chromosome: '13', position: 20189005, reference: 'CTG', alt: 'C', samples: ['sample1_E38', 'sample2_E38'],
            af: '8.70549e-05', ac: 2, an: 22974,
        }] },
        './geneHpoDisplay': {},
        './geneAnnotationReference': { getGeneReferenceAnnotation: () => null },
        './geneExonReference': { getGeneExons: () => [] },
        './geneIdReference.generated': { PB_GENE_ID_REFERENCE: {} },
        './variantLookup': { collectVariantIdentifiers: () => ({}) },
    });
    const state = await gene.fetchPbGeneBioIndexState('GJB2');
    assert.equal(state.variantRows.length, 1);
    assert.equal(state.variantRows[0].carrierCount, 2);
    assert.equal(state.variantRows[0].crdcFrequencyKind, 'allele');
    assert.equal(Number(state.variantRows[0].crdcAF), 8.70549e-5);
    const af = gene.sourceAlleleFrequency;
    assert.equal(af({ af: 0, ac: 0, an: 100 }), 0);
    assert.equal(af({ af: 0, ac: 0, an: 0 }), null);
    assert.equal(af({ ac: 2, an: 100 }), .02);
    assert.equal(af({ af: .02, ac: 2, an: 100 }), .02);
    for (const row of [{}, { af: '' }, { af: -1 }, { af: 2 }, { ac: 3, an: 2 }]) assert.equal(af(row), null);
    const compiler = require('vue-template-compiler');
    const parsed = compiler.parseComponent(fs.readFileSync('src/views/PbSample/Template.vue', 'utf8'));
    assert.deepEqual(compiler.compile(parsed.template.content).errors, []);
    console.log('Live sample adapter, observed HPO, allele frequency and Vue template: PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
