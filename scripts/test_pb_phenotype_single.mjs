import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import matchingRule from '../src/views/PbPhenotype/matchingRule.js';
assert.equal(matchingRule.describeMatchingRule('all', 2, 3).label, 'All (AND)');
assert.match(matchingRule.describeMatchingRule('all', 2, 3).description, /All 3.*same sample/);
assert.equal(matchingRule.describeMatchingRule('any', 2, 3).label, 'Any (OR)');
assert.match(matchingRule.describeMatchingRule('atLeastTwo', 2, 3).description, /At least 2.*3.*same sample/);
assert.equal(matchingRule.describeMatchingRule('atLeastTwo', 2, 2).label, 'All (AND)', 'Two of two is explicit AND');
assert.equal(matchingRule.describeMatchingRule('atLeastTwo', 1, 3).label, 'Any (OR)');
const modelSource = readFileSync('src/views/PbPhenotype/phenotypeModel.js');
const modelUrl = `data:text/javascript;base64,${modelSource.toString('base64')}`;
const source = readFileSync('src/views/PbPhenotype/singlePhenotypeModel.js', 'utf8').replace("'./phenotypeModel'", JSON.stringify(modelUrl));
const { isSinglePhenotypeView, recordedTerms, separatingTerms, summarizeProjects, sortSamples, pageRows, splitPinnedRows, matchingCombinations, filterSampleProjects } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const state = { ids: ['child'], excluded: [], advancedRules: [], ageBandFilter: '', sexFilter: '', affectedFilter: '', selectedProjects: [] };
assert.ok(isSinglePhenotypeView(state));
for (const patch of [{ids: []}, {ids: ['child','other']}, {excluded: ['other']}, {ageBandFilter:'0'}, {sexFilter:'female'}, {affectedFilter:'Y'}, {selectedProjects:['P']}, ...['age','sex','affected','project','investigator'].map(field => ({advancedRules:[{field,operator:'is',value:'x'}]})), {advancedRules:[{field:'phenotype',operator:'exclude',value:'x'}]}]) assert.equal(isSinglePhenotypeView({...state,...patch}),false);
assert.ok(isSinglePhenotypeView({...state, advancedRules:[{field:'phenotype',operator:'include',value:'child'}]}));
const terms = {root:['Root','',[]], parent:['Parent','',['root']], child:['Child','',['parent']], other:['Other','',[]], extra:['Extra','',[]]};
const samples = [
 {id:'B',project:'Second',investigator:'two',age:30,sex:'F',affected:'Y',z:2,terms:['root','parent','child','other','other']},
 {id:'A',project:'First',investigator:'one',age:10,sex:'M',affected:'N',z:0,terms:['root','parent','child','other','extra']},
 {id:'C',project:'First',investigator:'one',age:null,sex:'—',affected:'Y',z:null,terms:['root','parent','child']},
];
assert.deepEqual(recordedTerms(samples,'child',terms),[{id:'other',count:2},{id:'extra',count:1}], 'All ancestors and duplicate per-sample observations must be excluded');
const projects=summarizeProjects(samples);
assert.equal(projects[0].name,'First'); assert.equal(projects[0].total,2); assert.equal(projects[0].meanResidualPhers,0,'Zero score contributes; missing score does not'); assert.equal(projects[0].phersKnown,1);
const affectedProjects = summarizeProjects([...samples, { ...samples[0], id:'D', affected:null }]);
for (const row of affectedProjects) assert.equal(row.affected + row.unaffected + row.affectedUnknown, row.total, 'Yes, No and Unknown must account for every project sample');
assert.equal(affectedProjects.find(row=>row.name==='Second').affectedUnknown,1, 'Missing affected status must not become No');
assert.deepEqual(filterSampleProjects(samples, null), samples, 'All projects preserves the search group');
assert.deepEqual(filterSampleProjects(samples, []).map(row=>row.id), [], 'Clearing the selection must produce an empty table');
assert.deepEqual(filterSampleProjects(samples, ['First']).map(row=>row.id), ['A','C']);
assert.equal(samples.length,3, 'Local table filtering must not alter the search cohort');
assert.deepEqual(splitPinnedRows(filterSampleProjects(samples,['First']), ['B','C'], row=>row.id,1).display.map(row=>row.id), ['C','A'], 'Project filtering also applies to pins, with no duplicate rows');
assert.deepEqual(sortSamples(samples,{key:'project',dir:'asc'}).map(row=>row.id),['A','C','B']);
const diseases=Array.from({length:30},(_,i)=>({profile:[{hpoId:'child'},{hpoId:i<20?'other':'extra'}]}));
assert.equal(separatingTerms(diseases,'child',terms).find(row=>row.id==='other').count,20);
assert.equal(separatingTerms(diseases,'child',terms)[0].total,30,'Separators count the whole selected disease source, not only ten diseases');
const ids=Array.from({length:449},(_,i)=>i); const pages=Array.from({length:90},(_,i)=>pageRows(ids,i+1,5));
assert.equal(pages[89].length,4); assert.deepEqual(pages.flat(),ids,'Pagination must preserve every matching sample exactly once');
const pinned = splitPinnedRows(ids, [2,8], x=>x, 4, 5);
assert.deepEqual(pinned.pinned,[2,8]); assert.equal(pinned.page.length,5); assert.equal(new Set(pinned.display).size,7);
assert.ok(!pinned.page.includes(2) && !pinned.page.includes(8));
const afterSort = splitPinnedRows([...ids].reverse(),[2,8],x=>x,7,5); assert.deepEqual(afterSort.pinned,[8,2]);
assert.deepEqual(afterSort.display.slice(0,2),[8,2], 'Pins remain above page results after sorting');
assert.deepEqual(matchingCombinations([{terms:['A','B']},{terms:['A']},{terms:['A','B']}],['A','B']).map(row=>row.count),[2,1]);
assert.deepEqual(recordedTerms(samples,['child','other'],terms),[{id:'extra',count:1}]);
console.log('Single-HPO gate, ancestor exclusion, complete disease-set separators, score missingness and 449-sample pagination PASS');
