// Run: node scripts/test_pb_gene_variant_association_ui.js
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const babel = require('@babel/core');

const root = path.resolve(__dirname, '..');
const filename = path.join(root, 'src/views/PbGene/pageModel.js');
const code = babel.transformSync(fs.readFileSync(filename, 'utf8'), {
    filename, babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'],
}).code;
const moduleExports = {};
vm.runInNewContext(code, {
    exports: moduleExports,
    require: () => ({}),
    window: { location: { search: '' } },
    URLSearchParams,
    process: { env: {} },
});

const row = { id: 'chr14:50587963:T:G', phenotypeMatchScore: null };
const view = {
    variantRows: [row],
    $set(target, key, value) { target[key] = value; },
    contextStatistic: moduleExports.pbGeneMethods.contextStatistic,
};
moduleExports.pbGeneMethods.applyVariantContextScores.call(view, {
    variant_match_scores: {
        'CHR14:50587963:T:G': { match_score: 0.37, status: 'ok', carrier_count: 12, scored_carrier_count: 12 },
    },
    variant_associations: {
        'CHR14:50587963:T:G': { beta: -0.24, p_value: 0.004, status: 'ok', n_carriers: 12, low_carrier_count: false },
    },
});
assert.equal(row.phenotypeMatchScore, 0.37);
assert.equal(row.variantEffectBeta, -0.24);
assert.equal(row.variantEffectPValue, 0.004);
assert.equal(row.variantAssociationStatus, 'ok');
assert.equal(row.variantAssociationCarrierCount, 12);
assert.equal(moduleExports.pbGeneMethods.variantPValueDisplay.call(view, row.variantEffectPValue), '0.004');

moduleExports.pbGeneMethods.applyVariantContextScores.call(view, {
    variant_associations: {
        'chr14:50587963:T:G': { beta: 9, p_value: 0.0001, status: 'constant_outcome', n_carriers: 1, low_carrier_count: true },
    },
});
assert.equal(row.variantEffectBeta, null, 'Non-ok association must not display a numeric beta');
assert.equal(row.variantEffectPValue, null, 'Non-ok association must not display a numeric p-value');
assert.equal(row.variantAssociationLowCarrierCount, true);

moduleExports.pbGeneMethods.applyVariantContextScores.call(view, {});
assert.equal(row.variantAssociationStatus, 'not_returned');
assert.equal(row.variantEffectBeta, null, 'A new response must clear a stale beta');
assert.equal(row.variantEffectPValue, null, 'A new response must clear a stale p-value');
assert.equal(moduleExports.pbGeneMethods.variantPValueDisplay.call(view, 0), '<1e-300');
console.log('PB_GENE_VARIANT_ASSOCIATION_UI_TEST_PASS');
