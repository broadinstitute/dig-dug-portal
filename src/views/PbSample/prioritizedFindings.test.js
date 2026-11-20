const fs = require('fs');
const assert = require('assert');
const vm = require('vm');
const compiler = require('vue-template-compiler');
const babel = require('@babel/core');
const path = require('path');
const parsed = compiler.parseComponent(fs.readFileSync(path.join(__dirname, 'PrioritizedFindings.vue'), 'utf8'));
assert.deepEqual(compiler.compile(parsed.template.content).errors, []);
const compiled = babel.transformSync(parsed.script.content, { babelrc: false, configFile: false,
    plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
const moduleExports = {};
vm.runInNewContext(compiled, { exports: moduleExports });
const options = moduleExports.default;
const context = { variants: [
    { gene: 'GJB2', id: 'v1', type: 'Type 1', diseases: [{ id: 'OMIM:1' }, { id: 'OMIM:2' }] },
    { gene: 'OTHER', id: 'v2', type: 'Type 2', diseases: [] },
], type: '', search: '', selectedKey: '' };
context.records = options.computed.records.call(context);
assert.equal(context.records.length, 3, 'Count disease evidence records, including two records for one variant');
context.filtered = options.computed.filtered.call(context);
assert.equal(context.filtered.length, 3);
context.selectedKey = '0:1';
assert.equal(options.computed.selected.call(context).disease.id, 'OMIM:2');
context.type = 2;
context.filtered = options.computed.filtered.call(context);
context.selected = options.computed.selected.call(context);
assert.equal(context.selected.gene, 'OTHER', 'Changing Type clears an incompatible detail selection');
assert.equal(options.computed.scope.call(context), 'OUTSIDE');
context.type = '';
context.search = 'omim:2';
context.filtered = options.computed.filtered.call(context);
assert.equal(context.filtered.length, 1);
context.search = 'missing';
context.filtered = options.computed.filtered.call(context);
assert.equal(options.computed.selected.call(context), null);
console.log('Prioritized findings: evidence counts, Type/search filtering, selection and template PASS');
