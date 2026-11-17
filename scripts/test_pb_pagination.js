const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const compiler = require('vue-template-compiler');
const babel = require('@babel/core');
const Vue = require('vue');
const root = path.resolve(__dirname, '..');
const files = [
    'PbGene/SummaryPager.vue', 'PbGene/Template.vue', 'PbGene2/Template.vue',
    'PbGene2/Demographics.vue', 'PbGene2/VariantOverview.vue',
    'PbSample/Template.vue', 'PbSample/SamplePagination.vue',
    'PbSample/SampleVariants.vue', 'PbSample/SampleComparison.vue',
    'PbPhenotype/Template.vue', 'PbPhenotype/ResultPagination.vue',
];
for (const file of files) {
    const parsed = compiler.parseComponent(fs.readFileSync(path.join(root, 'src/views', file), 'utf8'));
    assert.deepEqual(compiler.compile(parsed.template.content).errors, [], file);
}
const parsed = compiler.parseComponent(fs.readFileSync(path.join(root, 'src/views/PbGene/SummaryPager.vue'), 'utf8'));
const code = babel.transformSync(parsed.script.content, {babelrc:false, configFile:false, plugins:['@babel/plugin-transform-modules-commonjs']}).code;
const output = {exports:{}};
vm.runInNewContext(code, {module:output, exports:output.exports});
const functions = compiler.compileToFunctions(parsed.template.content);
const pager = new Vue({...output.exports.default, ...functions, propsData:{page:1, totalPages:16, label:'Test pages'}});
const changes = [];
pager.$on('change', value => changes.push(value));
const walk = (node, predicate) => predicate(node) ? node : (node.children || []).map(child => walk(child, predicate)).find(Boolean);
const text = node => [node.text || '', ...(node.children || []).map(text)].join('').trim();
async function main() {
    let rendered = pager._render();
    const buttons = () => pager._render().children.filter(node => node.tag === 'button');
    assert.equal(text(buttons()[0]), 'Previous');
    assert.equal(buttons()[0].data.attrs.disabled, true);
    assert.equal(text(buttons().at(-1)), 'Next');
    assert.deepEqual(Array.from(pager.pageNumbers), [1,2,3,4,5]);
    assert(walk(rendered, node => node.tag === 'button' && text(node) === 'Go'));
    assert(text(rendered).includes('1 / 16'));
    buttons()[2].data.on.click();
    assert.equal(changes.at(-1), 2);
    pager.target = '16'; pager.jump();
    assert.equal(changes.at(-1), 16);
    for (const invalid of ['0','17','-1','2.5','abc','']) {
        const before = changes.length;
        pager.target = invalid; pager.jump();
        assert.equal(changes.length, before, `Reject ${invalid}`);
        assert.equal(pager.error, 'Invalid page');
    }
    pager.page = 16;
    await Vue.nextTick();
    assert.equal(pager.error, '');
    assert.deepEqual(Array.from(pager.pageNumbers), [12,13,14,15,16]);
    assert.equal(buttons().at(-1).data.attrs.disabled, true);
    const other = new Vue({...output.exports.default, propsData:{page:1,totalPages:16,label:'Other pages'}});
    assert.notEqual(pager.resolvedInputId, other.resolvedInputId, 'Repeated pagers have distinct label/input IDs');
    pager.totalPages = 1;
    await Vue.nextTick();
    assert(pager._render().isComment, 'Single-page lists do not show unnecessary controls');
    pager.$destroy(); other.$destroy();
    console.log('PB shared pagination: all page templates, numbered navigation, bounds, direct jump, state reset and unique input IDs PASS');
}
main().catch(error => {console.error(error); process.exitCode = 1;});
