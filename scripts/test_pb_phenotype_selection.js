const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const babel = require('@babel/core');
const compiler = require('vue-template-compiler');
const Vue = require('vue');
const {decodeSampleGeneScores, summarizeSampleGenes} = require('../src/views/PbPhenotype/sampleSelection');
const location = {search:'?query=HP%3A0000001%2CHP%3A0000002%2CHP%3A0000003',href:'http://localhost/pb_phenotype.html?query=HP%3A0000001%2CHP%3A0000002%2CHP%3A0000003'};
const window = {location,history:{replaceState(_,__,url){location.href=new URL(url,location.href).href;location.search=new URL(location.href).search;}}};
function load(file, imports={}) {
 let source=fs.readFileSync(file,'utf8');
 if(file.endsWith('.vue')){
  const parsed=compiler.parseComponent(source);
  assert.deepEqual(compiler.compile(parsed.template.content).errors,[]);
  source=parsed.script.content;
 }
 const code=babel.transformSync(source,{filename:file,babelrc:false,configFile:false,plugins:['@babel/plugin-transform-modules-commonjs']}).code;
 const exports={};vm.runInNewContext(code,{exports,module:{exports},require(name){if(Object.hasOwn(imports,name))return imports[name];throw new Error(name);},window,URL,URLSearchParams,console});return exports;
}
const model=load('src/views/PbPhenotype/phenotypeModel.js');
const terms=Object.fromEntries([1,2,3,4,5].map(i=>[`HP:000000${i}`,[`Term ${i}`,'',[],[]]]));
const reference={terms,associations:{
 'HP:0000001':[[0,'Obligate (100%)'],[1,'Obligate (100%)'],[2,'Obligate (100%)']],
 'HP:0000004':[[0,'Obligate (100%)']],
 'HP:0000005':[[0,'Obligate (100%)'],[1,'Obligate (100%)']],
},diseases:[[10,'Disease A',[]],[11,'Disease B',[]],[12,'Disease C',[]]],meta:{}};
let requestedMemberships=0;
const options=load('src/views/PbPhenotype/Template.vue',{
 './orphanetReference.generated':{ORPHANET_REFERENCE:reference},
 './additionalDiseaseReferences.generated.json':{terms:{},profiles:[
  ['omim-x','omim','OMIM:1','OMIM disease X',['HP:0000001'],['X'],[]],
  ['ddg-y','ddg2p','OMIM:2','DDG2P disease Y',['HP:0000002'],['Y'],[]],
  ['omim-only','omim','OMIM:3','Excluded disease',['HP:0000001','HP:0000004'],['ONLY_A'],[]],
  ['decipher-no-map','decipher','DECIPHER:1','Unmapped disease',['HP:0000001'],[],[]],
 ]},
 './phenotypeModel':model,
 './PhenotypeQueryInput.vue':{},
 './hpoSearch':require('../src/views/PbPhenotype/hpoSearch'),
 './geneReferenceEvidence':require('../src/views/PbPhenotype/geneReferenceEvidence'),
 '@/utils/bioIndexUtils':{request:async()=>{throw new Error('No metadata I/O expected');}},
 './profileGeneApi':{fetchProfileGeneAssociations:async()=>{throw new Error('No association I/O expected');}},
 './sampleSelection':{summarizeSampleGenes,fetchSampleGeneScores:async()=>{requestedMemberships++;throw new Error('Unavailable');}},
 '../../utils/rphersUnits':require('../src/utils/rphersUnits'),
}).default;
const payload={score_type:'max',definition:'existing gene_score > 0',analysis_sample_count:100,genes:['X','Y','Z'],available_sample_ids:['A','B','C','D'],unavailable_sample_ids:[],sample_gene_indices:{A:[0,1],B:[0,1],C:[0],D:[2]}};
async function main(){
 const membership=decodeSampleGeneScores(payload,['A','B','C','D']);
 assert.equal(decodeSampleGeneScores(payload,['A','B','C','D'],['X']).bySample.A.length,1,'Selected-sample genes retain the approved catalog scope');
 assert.throws(()=>decodeSampleGeneScores({...payload,available_sample_ids:['A']},['A','B','C','D']),/coverage/);
 assert.throws(()=>decodeSampleGeneScores({...payload,sample_gene_indices:{...payload.sample_gene_indices,A:[999]}},['A','B','C','D']),/membership/);
 const page=new Vue(options);
 let metadataCalls=0,membershipCalls=0,analysisCalls=0;
 page.loadSampleInfo=async()=>{metadataCalls++;};page.loadSampleGeneScores=async()=>{membershipCalls++;};
 page.loadGenes=async()=>{analysisCalls++;};page.loadSamples=async()=>{};
 page.matches=[
  {sample_id:'A',matches:'3/3',expanded_hpo_ids:['HP:0000001','HP:0000002','HP:0000003','HP:0000004','HP:0000005'],age_at_enrollment:5,gender:'female',cohort_category:'Old A',initial_study_affected:'Y',rphers_z:2},
  {sample_id:'B',matches:'3/3',expanded_hpo_ids:['HP:0000001','HP:0000002','HP:0000003'],age_at_enrollment:20,gender:'male',cohort_category:'Old B',initial_study_affected:'Y',rphers_z:1},
  {sample_id:'C',matches:'2/3',expanded_hpo_ids:['HP:0000001','HP:0000002'],age_at_enrollment:8,gender:'male',cohort_category:'Old C',initial_study_affected:'N',rphers_z:0},
  {sample_id:'D',matches:'2/3',expanded_hpo_ids:['HP:0000001','HP:0000003'],age_at_enrollment:10,gender:'female',cohort_category:'Old D',initial_study_affected:'Y',rphers_z:-1},
  {sample_id:'E',matches:'1/3',expanded_hpo_ids:['HP:0000001'],age_at_enrollment:30,gender:'female',cohort_category:'E'},
 ];
 page.sampleInfo={A:{clean_name:'Project P'},B:{Project:'Project P'},C:{clean_name:'Project Q'},D:{clean_name:'Project Q'}};
 page.scoreMembership=membership;
 page.genes={nTests:3,analysisSampleCount:100,associations:[{gene:'X',qValue:.1,pValue:.01,nPositive:40},{gene:'Y',qValue:.2,pValue:.02,nPositive:30},{gene:'OUTSIDE',qValue:1e-20,pValue:1e-21,nPositive:10}]};
 page.matchesLoaded=true;await Vue.nextTick();
 assert.equal(metadataCalls,1);assert.equal(membershipCalls,1);
 const originalGenes=page.genes;
 assert.equal(page.geneSampleScope,'whole','The existing whole-cohort result is the default');
 assert.deepEqual(Array.from(page.filteredGenes,row=>row.gene),['OUTSIDE']);
 page.selectGeneSampleScope('atLeastTwo');await Vue.nextTick();
 assert.equal(page.qualifyingSamples.length,4);
 assert.equal(page.cohortDiseaseSummary.length,2,'Project group and sample row use identical current labels');
 assert.deepEqual(Array.from(page.sortedGenes,row=>row.gene),['X','Y','Z'],'List and sort follow the selected samples, not smallest full-cohort q');
 assert.equal(page.groupScoreCell('X',page.atLeastGeneSummary),'3/4');
 assert.equal(page.groupScoreCell('X',page.allGeneSummary),'2/2');
 assert.deepEqual(Array.from(page.geneRows.find(row=>row.gene==='X').diseases,item=>item.source),['omim']);
 assert.equal(page.geneReferenceSources.find(item=>item.key==='decipher').available,false);
 page.geneReferenceSource='omim';await Vue.nextTick();
 assert.deepEqual(Array.from(page.filteredGenes,row=>row.gene),['X']);
 assert.equal(page.genes,originalGenes,'Reference DB selection never changes regression results');
 page.geneReferenceSource='ddg2p';await Vue.nextTick();
 assert.deepEqual(Array.from(page.filteredGenes,row=>row.gene),['Y']);
 assert.equal(analysisCalls,0);assert.equal(membershipCalls,1);
 page.geneReferenceSource='all';await Vue.nextTick();
 page.sampleMatchMode='all';page.samplePage=9;await Vue.nextTick();
 assert.equal(page.samplePage,1);assert.equal(page.qualifyingSamples.length,2);
 assert.equal(page.cohortDiseaseSummary[0].name,'Project P');assert.equal(page.cohortDiseaseSummary[0].total,2);
 assert.equal(page.ageSummary.remaining,2);assert.equal(page.sexSummary.remaining,2);
 assert.equal(page.atLeastGeneSummary.total,4,'Both comparison columns retain their own correct populations');
 assert.equal(page.geneProjectCell('X'),'1');
 assert.equal(new URL(location.href).searchParams.get('match'),'all');
 page.geneFilter='shared';assert.deepEqual(Array.from(page.filteredGenes,row=>row.gene),['X','Y']);
 assert.equal(analysisCalls,0);assert.equal(metadataCalls,1);assert.equal(membershipCalls,1,'Switching groups never reloads scores or regression');
 assert.equal(page.genes,originalGenes,'Do not replace full-cohort p/q on selection');
 page.selectGeneSampleScope('whole');await Vue.nextTick();
 assert.ok(page.filteredGenes.some(row=>row.gene==='OUTSIDE'),'Whole-cohort results remain accessible even when a gene is absent from selected samples');
 assert.equal(page.qualifyingSamples.length,2,'The whole-cohort gene view does not replace the sample group');
 page.scoreMembership=decodeSampleGeneScores({...payload,genes:[...payload.genes,'ONLY_A'],sample_gene_indices:{...payload.sample_gene_indices,A:[0,1,3]}},['A','B','C','D']);
 page.selectGeneSampleScope('all');await Vue.nextTick();
 assert.ok(page.filteredGenes.some(row=>row.gene==='ONLY_A'));
 page.selectGeneSampleScope('whole');await Vue.nextTick();
 const originalMatches=page.matches, originalIds=page.ids;
 page.addExcluded('HP:0000004');await Vue.nextTick();
 assert.equal(page.matches,originalMatches,'Excluding a non-query HPO must retain the loaded samples');
 assert.equal(page.ids,originalIds,'Exclude must not spuriously replace unchanged query IDs and refit regression');
 assert.equal(analysisCalls,0);assert.equal(metadataCalls,1);assert.equal(membershipCalls,1);
 assert.equal(page.genes,originalGenes);
 assert.equal(page.geneSampleScope,'all','Exclude opens the current sample-group gene view');
 assert.equal(page.qualifyingSamples.length,1);assert.equal(page.ageSummary.before,2);assert.equal(page.ageSummary.remaining,1);
 assert.equal(page.allGeneSummary.total,1);assert.equal(page.cohortDiseaseSummary[0].total,1);
 assert.equal(page.selectedGeneSummary.total,page.qualifyingSamples.length);
 assert.equal(page.groupScoreCell('Y',page.selectedGeneSummary),'1/1');
 assert.ok(!page.filteredGenes.some(row=>row.gene==='ONLY_A'),'Genes only present in excluded samples must leave the selected gene list');
 assert.equal(page.geneReferenceLinks.ONLY_A,undefined,'Excluded disease reference links also disappear');
 assert.equal(page.countChange(page.allTermsSampleCount,page.matchingSampleGroups.all.length,'samples'),'2 → 1 samples (1 excluded)');
 assert.equal(page.countChange(page.atLeastTwoSampleCount,page.matchingSampleGroups.atLeastTwo.length,'samples'),'4 → 3 samples (1 excluded)');
 page.addExcluded('HP:0000005');await Vue.nextTick();
 const term=page.termSummaries.find(row=>row.id==='HP:0000001');
 assert.equal(term.samples,5);assert.equal(term.remainingSamples,4,'Overlapping exclusions remove a sample once');
 assert.deepEqual(Array.from(term.exclusions,row=>row.samples),[1,1]);
 assert.equal(term.diseases,3);assert.equal(term.remainingDiseases,1,'Overlapping disease exclusions are counted once');
 assert.equal(term.veryFrequent,3);assert.equal(term.remainingVeryFrequent,1);
 assert.deepEqual(Array.from(term.exclusions,row=>row.diseases),[1,2]);
 assert.equal(page.matchingSampleGroups.all.length,1);
 assert.equal(page.filteredGenes.some(row=>row.gene==='ONLY_A'),false);
 page.geneFilter='shared';
 page.excluded=[];page.ageBandFilter='3–5';await Vue.nextTick();
 assert.equal(page.qualifyingSamples.length,1);assert.equal(page.selectedGeneSummary.total,1);
 page.ageBandFilter='';page.cohortDiseaseFilter='Project Q';await Vue.nextTick();
 assert.equal(page.qualifyingSamples.length,0);assert.equal(page.filteredGenes.length,0,'Zero-case group must not show universally shared genes');
 page.cohortDiseaseFilter='';
 page.scoreMembership=decodeSampleGeneScores({...payload,available_sample_ids:['A','C','D'],unavailable_sample_ids:['B'],sample_gene_indices:{A:[0,1],C:[0],D:[2]}},['A','B','C','D']);
 await Vue.nextTick();
 assert.equal(page.allGeneSummary.covered,1);assert.equal(page.groupScoreCell('X',page.allGeneSummary),'1/1');
 assert.equal(page.sharedByAllSelected('X'),false,'An unavailable sample is not a zero score and cannot establish sharing by all');
 assert.equal(page.filteredGenes.length,0);
 page.geneFilter='selected';page.genePage=3;page.geneSearch=' y ';await Vue.nextTick();
 assert.deepEqual(Array.from(page.filteredGenes,row=>row.gene),['Y']);assert.equal(page.genePage,1);
 page.$destroy();
 // Explicit covered zero scores must remain in the denominator.
 const zero=decodeSampleGeneScores({...payload,available_sample_ids:['A'],unavailable_sample_ids:['B','C','D'],sample_gene_indices:{A:[]}},['A','B','C','D']);
 const summary=summarizeSampleGenes([{id:'A'},{id:'B'}],zero,row=>row.id,()=> 'P');
 assert.equal(summary.covered,1);assert.equal(Object.keys(summary.genes).length,0);
 console.log('Phenotype scope selection: synchronized samples/demographics/Projects/genes, correct score coverage, sharing, URL, unchanged full-cohort results PASS');
}
main().catch(error=>{console.error(error);process.exitCode=1;});
