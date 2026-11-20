const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');
const search = require('../src/views/PbPhenotype/hpoSearch');
const filters = require('../src/views/PbPhenotype/profileFilters');
const availability = require('../src/utils/crdcHpoAvailability');

function loadComponent(file, imports) {
    const sfc = compiler.parseComponent(fs.readFileSync('src/views/PbPhenotype/' + file, 'utf8'));
    const result = compiler.compile(sfc.template.content);
    assert.deepEqual(result.errors, []);
    const code = babel.transformSync(sfc.script.content, { babelrc: false, configFile: false,
        plugins: ['@babel/plugin-transform-modules-commonjs'] }).code;
    const exports = {};
    vm.runInNewContext(code, { exports, require: key => {
        if (!(key in imports)) throw new Error('Unexpected import: ' + key);
        return imports[key];
    } });
    return { ...exports.default, render: new Function(result.render), staticRenderFns: result.staticRenderFns.map(code => new Function(code)) };
}
function loadPicker() { return loadComponent('PhenotypeTermPicker.vue', { './hpoSearch': search, '../../utils/crdcHpoAvailability': availability }); }
function loadEditor() { return loadComponent('PhenotypeProfileEditor.vue', {
    './hpoSearch': search, './profileFilters': filters, './matchingRule': require('../src/views/PbPhenotype/matchingRule'), '../../utils/crdcHpoAvailability': availability, './PhenotypeTermPicker.vue': loadPicker(),
}); }

async function main() {
    const terms = Object.freeze({ 'HP:0000001': ['First phenotype'], 'HP:0000002': ['Hearing impairment'], 'HP:0000003': ['Seizure'], 'HP:0000004': ['Unrecorded phenotype'], 'HP:0000005': ['Zero samples phenotype'] });
    const index = search.createHpoSearchIndex(terms);
    const resolve = value => { const id = search.resolveIndexedHpo(index, value); return terms[id] ? id : ''; };
    const ids = Object.freeze(['HP:0000001']);
    const editor = new Vue({ ...loadEditor(), propsData: { ids, terms, searchIndex: index,
        sampleCounts: Object.freeze({'HP:0000001': 449, 'HP:0000002': 1204, 'HP:0000003': 37, 'HP:0000005': 0}), countsStatus: 'ready' } });
    const applied = [];
    editor.$on('apply', state => {
        applied.push(state);
        editor.ids = state.ids; editor.excluded = state.excluded; editor.rules = state.rules;
        editor.matchMode = state.matchMode; editor.minimum = state.minimum;
    });
    editor.query = 'hea'; editor.open = true;
    assert.equal(applied.length, 0, 'Typing must not start a result query');
    assert.equal(editor.suggestions[0].id, 'HP:0000002');
    assert.equal(editor.countLabel('HP:0000002'), '1,204 samples');
    assert.match(editor.countLabel('HP:0000004'), /Not available/);
    editor.choose('HP:0000004'); assert.equal(applied.length, 0, 'Absent matrix terms must never start a search');
    editor.choose('HP:0000005'); assert.equal(applied.length, 0, 'A known zero-count term must never start a search');
    assert.match(editor.error, /at least 1 CRDC sample/);
    assert.ok(editor.highlight('Hearing impairment').some(part => part.match && part.text === 'Hea'));
    editor.choose('HP:0000002'); await Vue.nextTick();
    assert.equal(applied.length, 1, 'Choosing a suggestion immediately applies Include');
    assert.deepEqual(Array.from(editor.ids), ['HP:0000001', 'HP:0000002']);
    assert.equal(editor.query, '');
    editor.setMode('exclude'); editor.choose('HP:0000003'); await Vue.nextTick();
    assert.equal(applied.length, 2, 'Choosing a suggestion immediately applies Exclude');
    assert.deepEqual(Array.from(editor.excluded), ['HP:0000003']);
    assert.deepEqual(ids, ['HP:0000001'], 'Never mutate source props in place');
    function find(node, predicate, matches = []) {
        if (!node) return matches;
        if (Array.isArray(node)) { node.forEach(child => find(child, predicate, matches)); return matches; }
        if (predicate(node)) matches.push(node);
        find(node.children || [], predicate, matches); return matches;
    }
    const hasClass = name => node => String(node.data && node.data.staticClass || '').split(' ').includes(name);
    let rendered = editor._render();
    assert.equal(find(rendered, node => node.tag === 'input' && node.data && node.data.attrs && node.data.attrs.role === 'combobox').length, 1);
    assert.equal(find(rendered, hasClass('pbp-builder-apply')).length, 0, 'No Apply button outside Advanced');
    assert.equal(find(rendered, hasClass('pbp-match-control')).length, 0, 'Collapsed summary must not offer another Match control');
    assert.equal(Boolean(find(rendered, hasClass('pbp-unified-submit'))[0].data.attrs.disabled), false);
    assert.equal(find(rendered, hasClass('pbp-summary-excludes')).length, 0, 'Without is grouped with the other limits');
    const limits = find(rendered, hasClass('pbp-summary-limits'))[0];
    assert.equal(find(limits, hasClass('pbp-search-chip-excluded')).length, 1, 'Without appears inside Limited to');
    assert.equal(editor.limitCount, 1, 'The Advanced badge includes exclusions');
    editor.toggleAdvanced();
    rendered = editor._render();
    assert.equal(find(rendered, hasClass('pbp-unified-submit'))[0].data.attrs.disabled, true, 'Search is disabled while Advanced is expanded');
    const topInput = find(rendered, node => node.tag === 'input' && node.data.attrs.role === 'combobox')[0];
    assert.equal(topInput.data.attrs.disabled, true, 'The simple search input is disabled during Advanced editing');
    assert.equal(find(rendered, hasClass('pbp-mode-toggle'))[0].data.attrs.disabled, true);
    editor.query = 'hea'; editor.open = true;
    assert.equal(find(editor._render(), hasClass('pbp-suggestion-list')).length, 0, 'A stale top-level autocomplete cannot appear over Advanced');
    editor.onEnter(); assert.equal(applied.length, 2, 'Simple-search keyboard actions cannot bypass Apply');
    editor.query = 'HP:0000002'; editor.search();
    assert.equal(applied.length, 2, 'Form submission must not bypass Advanced Apply');
    editor.query = '';
    assert.equal(editor.includedRows.length, 2, 'Advanced reuses both included phenotypes');
    assert.equal(editor.draftRows.filter(row => row.operator === 'exclude').length, 1, 'Advanced reuses the excluded phenotype');
    editor.addRule(); const ageRow = editor.draftRows.at(-1); ageRow.field = 'age'; editor.changeField(ageRow); ageRow.value = '0'; ageRow.max = '17';
    editor.addRule(); const invRow = editor.draftRows.at(-1); invRow.field = 'investigator'; editor.changeField(invRow); invRow.value = 'investigator_a';
    assert.equal(ageRow.operator, 'between'); assert.equal(invRow.operator, 'is');
    assert.equal(editor.limitedRules.length, 2, 'Summary chips and Advanced edit the same working conditions');
    assert.equal(editor.limitCount, 3, 'Required limits and Without share one applied-condition count');
    assert.equal(applied.length, 2, 'Editing advanced values waits for its Apply button');
    editor.setMatch('any');
    rendered = editor._render();
    const advancedPanel = find(rendered, hasClass('pbp-advanced-builder'))[0];
    const isPicker = node => node.componentOptions && node.componentOptions.Ctor.options.name === 'PhenotypeTermPicker';
    assert.equal(find(advancedPanel, isPicker).length, 3, 'Each Advanced phenotype row has its own local autocomplete');
    assert.equal(find(rendered, isPicker).length, 3, 'Phenotype pickers live inside the expanded panel');
    const classes = (rendered.children || []).filter(node => node && node.data).map(node => node.data.staticClass || '');
    assert.ok(classes.indexOf('pbp-advanced-builder') < classes.indexOf('pbp-search-summary'), 'Advanced opens directly beneath the search bar, before the summary');
    editor.apply(); await Vue.nextTick();
    assert.equal(applied.length, 3);
    assert.equal(editor.advancedOpen, false);
    assert.equal(Boolean(find(editor._render(), hasClass('pbp-unified-submit'))[0].data.attrs.disabled), false, 'Search becomes available after Apply closes Advanced');
    assert.deepEqual(Array.from(editor.ids), ['HP:0000001', 'HP:0000002']);
    assert.equal(editor.rules.length, 2, 'Do not store duplicate include/exclude conditions as a separate filter set');
    assert.equal(editor.matchMode, 'any'); assert.equal(editor.rules[0].max, '17');
    editor.removePhenotype('HP:0000003', true); await Vue.nextTick();
    assert.equal(editor.excluded.length, 0);
    editor.toggleAdvanced();
    assert.ok(!editor.draftRows.some(row => row.operator === 'exclude'), 'Removing a summary chip updates Advanced too');
    const target = editor.includedRows[0];
    const beforeAdvancedChoice = applied.length;
    const topQuery = editor.query;
    const picker = new Vue({ ...loadPicker(), propsData: { value: target.value, inputLabel: 'Condition phenotype', terms, searchIndex: index,
        sampleCounts: Object.freeze({'HP:0000003': 37}), countsStatus: 'ready' } });
    picker.$on('input', value => { target.value = value; picker.value = value; });
    picker.edit({ target: { value: 'sei' } }); await Vue.nextTick();
    assert.equal(picker.suggestions[0].id, 'HP:0000003');
    assert.equal(picker.countLabel('HP:0000003'), '37 samples');
    assert.ok(find(picker._render(), hasClass('pbp-inline-hpo-options')).length, 'Suggestions are rendered under the row input');
    assert.equal(editor.query, topQuery, 'Editing a row must not copy its query into the top search box');
    picker.selectCurrent(); await Vue.nextTick();
    assert.equal(target.value, 'HP:0000003');
    assert.equal(picker.open, false);
    assert.equal(applied.length, beforeAdvancedChoice, 'Local autocomplete selection waits for Advanced Apply');
    assert.ok(editor.summary.ids.includes('HP:0000003'), 'Advanced draft changes are visible in the summary');
    assert.ok(editor.ids.includes('HP:0000001'), 'Applied results stay unchanged until Apply');
    picker.$destroy();
    editor.apply(); await Vue.nextTick();
    assert.ok(editor.ids.includes('HP:0000003') && !editor.ids.includes('HP:0000001'), 'Phenotype row editing applies the local autocomplete selection');
    editor.advancedOpen = false; editor.removeLimit(0); await Vue.nextTick();
    assert.equal(editor.rules.length, 1);
    editor.clearAll(); await Vue.nextTick();
    assert.equal(editor.ids.length, 0); assert.equal(editor.excluded.length, 0); assert.equal(editor.rules.length, 0);
    editor.query = 'HP:9999999'; editor.search(); assert.match(editor.error, /No matching/);
    editor.setMode('include'); editor.query = 'Hearing impairment'; editor.search(); await Vue.nextTick();
    assert.deepEqual(Array.from(editor.ids), ['HP:0000002']);
    editor.query = 'HP:0000002'; editor.search(); await Vue.nextTick(); assert.equal(editor.ids.length, 1, 'Do not duplicate HPO chips');

    const access = { termsOf: row => row.terms, ageOf: row => row.age, sexOf: row => row.sex,
        affectedOf: row => row.affected, investigatorOf: row => row.investigator, projectOf: row => row.project };
    const people = [
        { terms: ['HP:0000001', 'HP:0000002'], age: 0, sex: 'female', affected: 'Y', investigator: 'investigator_a', project: 'Hearing cohort' },
        { terms: ['HP:0000001'], age: 20, sex: 'male', affected: 'N', investigator: 'investigator_b', project: 'Other cohort' },
        { terms: [], age: null, sex: 'unknown', affected: '', investigator: '', project: '' },
    ];
    const match = (field, operator, value) => people.map(row => filters.matchesRules(row, [{ field, operator, value }], access));
    assert.deepEqual(match('phenotype', 'contains', 'HP:0000002'), [true, false, false]);
    assert.deepEqual(match('age', 'contains', '0'), [true, false, false]);
    assert.deepEqual(match('age', 'gte', '18'), [false, true, false]);
    assert.deepEqual(match('age', 'lte', '1'), [true, false, false]);
    assert.deepEqual(match('age', 'contains', 'Unknown'), [false, false, true]);
    assert.deepEqual(match('age', 'exclude', '20'), [true, false, false], 'Unknown age must not become a measured age');
    assert.deepEqual(match('sex', 'exclude', 'male'), [true, false, true]);
    assert.deepEqual(match('affected', 'contains', 'unknown'), [false, false, true]);
    assert.deepEqual(match('investigator', 'contains', 'INVESTIGATOR_A'), [true, false, false]);
    assert.deepEqual(match('project', 'contains', 'hearing'), [true, false, false]);
    assert.deepEqual(match('age', 'between', '0'), [false, false, false]);
    const range = filters.normalizeRules([{field:'age',operator:'between',value:'0',max:'17'}], resolve);
    assert.deepEqual(people.map(row=>filters.matchesRules(row,range,access)), [true,false,false]);
    assert.deepEqual(match('investigator', 'is', 'investigator'), [false,false,false], 'is is exact, not substring matching');
    assert.deepEqual(match('investigator', 'is', 'INVESTIGATOR_A'), [true,false,false]);
    assert.throws(()=>filters.normalizeRules([{field:'age',operator:'between',value:'18',max:'0'}],resolve), /minimum/);
    const rules = filters.normalizeRules([{ field: 'age', operator: 'gte', value: '18' }, { field: 'sex', operator: 'contains', value: 'female' }], resolve);
    assert.ok(people.every(row => !filters.matchesRules(row, rules, access)), 'Conditions combine with AND');
    assert.deepEqual(filters.readRules(JSON.stringify(rules), resolve), rules, 'Applied filters survive URL sharing/reload');
    assert.deepEqual(filters.readRules('{broken', resolve), []);
    assert.throws(() => filters.normalizeRules([{ field: 'age', operator: 'gte', value: '-1' }], resolve), /age/);
    assert.throws(() => filters.normalizeRules([{ field: 'phenotype', operator: 'contains', value: 'HP:9999999' }], resolve), /valid phenotype/);
    editor.ids = Object.keys(terms); editor.excluded = []; editor.rules = [];
    editor.toggleAdvanced();
    rendered = editor._render();
    assert.equal(find(rendered, hasClass('pbp-match-control')).length, 0, 'No duplicate Match control even when Advanced is open');
    const matching = find(rendered, node => node.tag === 'select' && node.data.attrs['aria-label'] === 'Advanced included phenotype matching');
    assert.equal(matching.length, 1);
    assert.equal(matching[0].children.filter(node => node.tag === 'option').length, 3, 'Any / at least 2 of 3 / all 3 have one selection point');
    editor.$destroy();
    const required = filters.normalizeRules([{field:'phenotype',operator:'contains',value:'HP:0000003',required:true}],resolve);
    assert.equal(required[0].required,true);
    assert.deepEqual(filters.readRules(JSON.stringify(required),resolve),required);
    const refined = new Vue({...loadEditor(),propsData:{ids:['HP:0000001','HP:0000002'],excluded:[],rules:required,terms,searchIndex:index,matchMode:'any',sampleCounts:{'HP:0000001':1,'HP:0000002':1,'HP:0000003':1},countsStatus:'ready'}});
    const requiredChip = find(refined._render(), hasClass('pbp-limit-chip'))[0];
    assert.equal(find(requiredChip, node => node.tag === 'b')[0].children[0].text, 'Includes · Seizure');
    assert.equal(find(requiredChip, node => node.tag === 'small')[0].children[0].text, 'HP:0000003', 'Includes shows the same HPO ID line as Without');
    refined.toggleAdvanced();
    assert.equal(refined.includedPhenotypeCount,2,'AND required HPO does not enter the Any/k/All group');
    assert.equal(refined.summary.rules[0].required,true);
    const committed=[];refined.$on('apply',value=>committed.push(value));refined.apply();
    assert.equal(committed[0].rules[0].required,true,'Advanced Apply preserves required HPO refinement');
    assert.equal(committed[0].matchMode,'any');
    const matchingEditor = new Vue({...loadEditor(),propsData:{ids:['HP:0000001','HP:0000002','HP:0000003'],terms,searchIndex:index,sampleCounts:{'HP:0000001':1,'HP:0000002':1,'HP:0000003':1},countsStatus:'ready'}});
    const matches=[];matchingEditor.$on('apply',value=>matches.push(value));
    matchingEditor.toggleAdvanced();assert.equal(matchingEditor.draftMatch,'all','A new profile defaults to All, not a hidden minimum of two');
    matchingEditor.draftMatch='atLeastTwo';matchingEditor.draftMinimum=2;matchingEditor.apply(false);
    assert.equal(matches[0].matchMode,'atLeastTwo');assert.equal(matches[0].minimum,2);
    matchingEditor.draftMinimum=0;matchingEditor.apply(false);assert.equal(matches.length,1);assert.match(matchingEditor.error,/whole minimum/);
    matchingEditor.draftMinimum=1.5;matchingEditor.apply(false);assert.equal(matches.length,1);
    matchingEditor.draftMinimum=4;matchingEditor.apply(false);assert.equal(matches.length,1);
    matchingEditor.draftMinimum=3;matchingEditor.apply(false);assert.equal(matches[1].matchMode,'all','A custom minimum equal to all terms is canonical All');
    matchingEditor.draftMinimum=1;matchingEditor.apply(false);assert.equal(matches[2].matchMode,'any','A custom minimum of one is canonical Any');
    matchingEditor.$destroy();
    console.log('Single phenotype search: immediate Include/Exclude, counted suggestions, shared Advanced/summary, local Advanced autocomplete, disabled simple search, range/exact filters, matching, URL roundtrip PASS');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
