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
const { isSinglePhenotypeView, recordedTerms, separatingTerms, summarizeProjects, sortSamples, pageRows, splitPinnedRows, matchingCombinations, filterSampleProjects, filterSamplePhenotypes, projectPhenotypeTree } = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
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

assert.equal(filterSamplePhenotypes(samples, null), samples);
assert.deepEqual(filterSamplePhenotypes(samples, []), []);
assert.deepEqual(filterSamplePhenotypes(samples, ['other', 'extra']).map(row => row.id), ['B', 'A']);
assert.deepEqual(filterSamplePhenotypes(filterSampleProjects(samples, ['First']), ['other']).map(row => row.id), ['A']);
const hierarchyTerms = { root: ['Root', '', []], left: ['Left', '', ['root']], right: ['Right', '', ['root']], leaf: ['Leaf', '', ['left', 'right']], absent: ['Absent', '', ['root']] };
const tree = projectPhenotypeTree([{ terms: ['leaf', 'leaf', 'root'] }, { terms: ['right'] }], hierarchyTerms);
const flatten = rows => rows.flatMap(row => [row, ...flatten(row.children)]);
const flat = flatten(tree);
assert.equal(tree[0].count, 2, 'Shared ancestors count distinct samples, not descendant totals');
assert.equal(flat.find(row => row.id === 'left').count, 1);
assert.equal(flat.find(row => row.id === 'right').count, 2);
assert.equal(flat.filter(row => row.id === 'leaf').length, 1, 'Multiple-parent HPO terms appear only once');
assert.ok(!flat.some(row => row.id === 'absent'), 'Unobserved branches are hidden');
assert.equal(new Set(flat.map(row => row.id)).size, flat.length);
assert.deepEqual(projectPhenotypeTree([], hierarchyTerms), []);
assert.equal(flatten(projectPhenotypeTree([{ terms: ['a'] }], {a: ['A', '', ['b']], b: ['B', '', ['a']]})).length, 2, 'Malformed cycles cannot recurse forever');
console.log('Phenotype checkbox intersection and distinct-sample hierarchy counts PASS');

const { createRequire } = await import('node:module');
const require = createRequire(import.meta.url);
const Vue = require('vue');
const singleModel = await import(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`);
const resultSource = readFileSync('src/views/PbPhenotype/SinglePhenotypeResults.vue', 'utf8').split('<script>')[1].split('</script>')[0];
const dependencies = {
    ...singleModel, ...await import(modelUrl), describeMatchingRule: matchingRule.describeMatchingRule,
    ResultInfo: {}, DiseaseRankDetails: {}, ResultPagination: {}, resultTooltip: {}, ProjectTableFilter: {}, RefineButton: {}, QueryMatchMarkers: {}, ProjectPhenotypeTree: {}, CohortPhenotypeTree: {}, burdenCarrierCounts: () => ({}),
};
const resultComponent = new Function(...Object.keys(dependencies), resultSource.replace(/^import .*;$/gm, '').replace('export default', 'return'))(...Object.values(dependencies));
const vm = new Vue({ ...resultComponent, propsData: {
    profileIds: ['other', 'extra'], matchMode: 'any', terms, samples, cohortCount: 10, counts: {},
    geneRows: [], sources: [], diseases: [
        { rank: 1, name: 'No gene', genes: [], matchedIds: ['other'], profile: [] },
        { rank: 2, name: 'Z disease', genes: [['ZZZ']], matchedIds: ['other'], profile: [] },
        { rank: 3, name: 'A disease', genes: [['AAA']], matchedIds: ['other', 'extra'], profile: [] },
    ],
} });
vm.pages.samples = 3;
vm.samplePhenotypeFilter = ['extra'];
await Vue.nextTick();
assert.equal(vm.pages.samples, 1);
assert.deepEqual(vm.sortedSamples.map(row => row.id), ['A']);
assert.equal(vm.total, 3, 'Filtering the sample table leaves the overall cohort unchanged');
vm.pinned.samples = ['B'];
assert.deepEqual(vm.displaySamples.map(row => row.id), ['A'], 'Pins respect phenotype selection');
vm.sampleProjectFilter = ['Second'];
assert.deepEqual(vm.filteredSamples, [], 'Filters intersect rather than union');
vm.sortBy('diseases', 'genes');
assert.deepEqual(vm.sortedDiseases.map(row => row.rank), [3, 2, 1], 'Gene symbols sort alphabetically with missing values last');
vm.sortBy('diseases', 'genes');
assert.deepEqual(vm.sortedDiseases.map(row => row.rank), [2, 3, 1]);
vm.profileIds = ['child'];
await Vue.nextTick();
assert.equal(vm.samplePhenotypeFilter, null, 'Changing query terms clears obsolete phenotype selections');
vm.$destroy();
console.log('Result component filter pipeline, pin visibility, pagination and curated-gene sorting PASS');

const { selectedHierarchyBranches } = singleModel;
const queryTree = [{ id: 'ear', children: [
    { id: 'physiology', children: [{ id: 'intermediate', children: [{ id: 'hearing', children: [] }] }] },
    { id: 'morphology', children: [{ id: 'inner-ear', children: [] }] },
] }];
assert.deepEqual([...selectedHierarchyBranches(queryTree, ['hearing', 'morphology'])].sort(), ['ear', 'intermediate', 'physiology']);
assert.deepEqual([...selectedHierarchyBranches(queryTree, ['missing'])], []);
console.log('Deep query paths open without expanding unrelated descendants PASS');

const { filterHierarchyCategories, orderPhenotypeHierarchy, hierarchyRows } = singleModel;
const categoryTree = [{ id: 'HP:0000118', label: 'Phenotypic abnormality', count: 10, children: [
    { id: 'ear', label: 'Ear', count: 3, children: [{ id: 'hearing', label: 'Hearing', count: 2, children: [] }] },
    { id: 'nervous', label: 'Nervous system', count: 9, children: [
        { id: 'brain', label: 'Brain', count: 7, children: [] }, { id: 'movement', label: 'Movement', count: 3, children: [] },
    ] },
] }, { id: 'modifier', label: 'Modifier', count: 1, children: [] }];
assert.equal(filterHierarchyCategories(categoryTree, null), categoryTree);
assert.deepEqual(hierarchyRows(filterHierarchyCategories(categoryTree, ['ear'])).map(row => row.id), ['HP:0000118', 'ear', 'hearing']);
assert.deepEqual(filterHierarchyCategories(categoryTree, []), []);
assert.deepEqual(filterHierarchyCategories(categoryTree, ['hearing']), [], 'Only immediate categories can be chosen');
const ordered = orderPhenotypeHierarchy(categoryTree, {key:'count',dir:'desc'}, {}, 10, ['hearing']);
assert.equal(ordered[0].children[0].id, 'ear', 'Query paths take priority even over more frequent siblings');
assert.deepEqual(ordered[0].children[1].children.map(row => row.id), ['brain','movement']);
assert.deepEqual(orderPhenotypeHierarchy(categoryTree, {key:'exclude',dir:'desc'}, {},10,[]).find(row=>row.id==='HP:0000118').children.find(row=>row.id==='nervous').children.map(row=>row.id), ['movement','brain']);
const byAll = orderPhenotypeHierarchy(categoryTree, {key:'all',dir:'desc'}, {brain:2,movement:8},10,[]);
assert.deepEqual(byAll[0].children.find(row=>row.id==='nervous').children.map(row=>row.id), ['movement','brain']);
assert.deepEqual(categoryTree[0].children.map(row=>row.id), ['ear','nervous'], 'Sorting does not mutate the source hierarchy');
const cohortVm = new Vue({ ...resultComponent, propsData: {
    profileIds: ['child','other'], matchMode:'any', terms, samples, cohortCount:10, counts:{}, geneRows:[], sources:[], diseases:[],
} });
assert.deepEqual(cohortVm.displayedCoTerms.slice(0,2).map(row=>row.id), ['child','other'], 'Query terms lead the table');
assert.equal(new Set(cohortVm.displayedCoTerms.map(row=>row.id)).size, cohortVm.displayedCoTerms.length, 'Table query rows are not duplicated');
assert.deepEqual(cohortVm.selectedPhenotypeRows.map(row=>row.id), ['child','other'], 'Query summary leads the hierarchy');
assert.ok(cohortVm.selectedPhenotypeRows.every(row=>!row.children.length), 'Query summary does not duplicate expanded branches');
cohortVm.$destroy();
console.log('Immediate-category filtering, sibling sorting and leading query rows PASS');

const evidenceSource = readFileSync('src/views/PbPhenotype/diseaseRankEvidence.js', 'utf8').replace("'./singlePhenotypeModel'", JSON.stringify(`data:text/javascript;base64,${Buffer.from(source).toString('base64')}`));
const { diseaseRankEvidence } = await import(`data:text/javascript;base64,${Buffer.from(evidenceSource).toString('base64')}`);
const weightedDisease = { profile: [{hpoId:'parent',frequency:'Frequent (79-30%)',weight:0.5446},{hpoId:'child',frequency:'Very frequent (99-80%)',weight:0.8911}] };
const explanation = diseaseRankEvidence(weightedDisease, ['parent','child','other'], terms);
assert.equal(explanation[0].annotation.hpoId, 'child', 'Explain the highest-frequency descendant, not a lower-weight exact annotation');
assert.equal(explanation[1].annotation.weight,0.8911);
assert.equal(explanation[2].annotation,null);
const referenceSource = readFileSync('src/views/PbPhenotype/orphanetReference.generated.js','utf8');
const reference = JSON.parse(referenceSource.slice(referenceSource.indexOf('=')+1).trim().replace(/;$/,''));
const model = await import(modelUrl), query = ['HP:0000364','HP:0031703'];
for (const disease of model.diseaseRows(reference,query).slice(0,10)) {
    const evidence = diseaseRankEvidence(disease,query,reference.terms);
    assert.ok(Math.abs(evidence.reduce((sum,row)=>sum+(row.annotation?.weight||0),0)-disease.numerator)<1e-10, 'Visible annotation weights reproduce the actual ranking numerator');
}
const methodVm = new Vue({ ...resultComponent, propsData: {
    profileIds:query, terms:reference.terms, samples:[], cohortCount:16366, counts:{}, geneRows:[], sources:[], diseases:[],
    multiGeneResult:{ matchingCoveredCount:1871,otherCoveredCount:13877,rows:[{gene:'OBP2B',matchingCarriers:73,comparisonCarriers:291,ratio:1.8605942390731383,pValue:5.53e-6}] },
} });
assert.deepEqual(methodVm.fisherTable.rows, [['Matching','73','1,798'],['Everyone else','291','13,586']]);
assert.match(methodVm.ratioHelp,/73 \/ 1,871/);
assert.match(methodVm.ratioHelp,/291 \/ 13,877/);
assert.match(methodVm.fisherHelp,/no correction/);
methodVm.$destroy();
console.log('Rank annotation weights reproduce live scores; Fisher help uses covered counts PASS');
