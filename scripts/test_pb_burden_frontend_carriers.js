const assert=require('node:assert/strict');
const {burdenCarrierCounts}=require('../src/views/PbPhenotype/singleBurdenCarriers');
const rows=[{gene:'A',association:{nSamples:6,nCases:3,nPositive:2,betaPer0_1Grs:.2,pValue:.01,qValue:.03}},{gene:'B',association:{nSamples:6,nCases:3,nPositive:3}}];
const data={schema:'original-burden-memberships-v1',cohortId:'sha256:original-cohort',hpoId:'HP:0000365',analysisN:6,nCases:3,hpoSampleIds:[0,1,2],geneCarrierSampleIds:{A:[2,3],B:[1,2,4]}};
let x=burdenCarrierCounts('HP:0000365',rows,data);
assert.equal(x.analysisN,6);assert.equal(x.nCases,3);assert.deepEqual(x.byGene.get('A'),{all:2,withPhenotype:1});assert.deepEqual(x.byGene.get('B'),{all:3,withPhenotype:2});
for(const patch of [{hpoId:'HP:0000001'},{analysisN:7},{nCases:4},{hpoSampleIds:[0,0,2]},{hpoSampleIds:[0,1,99]},{schema:'other-source'}]) {
 x=burdenCarrierCounts('HP:0000365',rows,{...data,...patch});assert.equal(x.byGene.get('A').withPhenotype,null);assert.equal(x.byGene.get('A').all,2,'Stored original gene count survives missing or inconsistent memberships');
}
x=burdenCarrierCounts('HP:0000365',rows,{...data,geneCarrierSampleIds:{A:[2,2],B:[1,2]}});assert.equal(x.byGene.get('A').withPhenotype,null);assert.equal(x.byGene.get('B').withPhenotype,null);
x=burdenCarrierCounts('HP:0000365',rows,null);assert.equal(x.byGene.get('A').withPhenotype,null);assert.equal(x.byGene.get('A').all,2);
assert.equal(rows[0].association.betaPer0_1Grs,.2);assert.equal(rows[0].association.pValue,.01);assert.equal(rows[0].association.qValue,.03);
console.log('Frontend burden membership intersection, shared-cohort checks, duplicates/missing IDs, unchanged statistics PASS');
