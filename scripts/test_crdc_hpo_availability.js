const assert = require('node:assert/strict');
const fs = require('node:fs'), vm = require('node:vm');
const { hpoAvailability, validateCrdcHpos, loadCrdcHpoCounts, requireCrdcHpos } = require('../src/utils/crdcHpoAvailability');
const counts = { 'HP:0000001': 0, 'HP:0000002': 1, 'HP:0000003': 50 };
async function main() {
    assert.equal(hpoAvailability('HP:0000002',counts,'ready').enabled,true, 'Exactly one recorded sample is enough');
    assert.equal(hpoAvailability('HP:0000001',counts,'ready').enabled,false);
    assert.equal(hpoAvailability('HP:9999999',counts,'ready').count,null, 'An absent matrix term must not be reported as a measured zero');
    for (const status of ['loading','error']) { assert.equal(hpoAvailability('HP:0000002',null,status).count,null); assert.throws(()=>validateCrdcHpos(['HP:0000002'],null,status),/availability/); }
    assert.doesNotThrow(()=>validateCrdcHpos(['HP:0000002','HP:0000003'],counts,'ready'));
    for (const ids of [['HP:0000001'],['HP:9999999'],['HP:0000003','HP:0000001']]) assert.throws(()=>validateCrdcHpos(ids,counts,'ready'),/at least 1 CRDC sample/);
    let calls=0;
    const fetcher=async path=>{calls++;assert.equal(path,'/__pb_phenotype_profile__/hpo-counts');return{ok:true,json:async()=>({counts})};};
    const [a,b]=await Promise.all([loadCrdcHpoCounts(fetcher),loadCrdcHpoCounts(fetcher)]);
    assert.equal(calls,1,'All inputs share one in-flight availability request');assert.equal(a,b);
    await requireCrdcHpos(['HP:0000002']);assert.equal(calls,1,'Model guards reuse the validated count snapshot');
    await assert.rejects(requireCrdcHpos(['HP:0000001']),/at least 1 CRDC sample/);
    const output={exports:{}};vm.runInNewContext(fs.readFileSync('src/utils/crdcHpoAvailability.js','utf8'),{module:output});
    await assert.rejects(output.exports.loadCrdcHpoCounts(async()=>({ok:false})),/availability/);
    await assert.rejects(output.exports.loadCrdcHpoCounts(async()=>({ok:true,json:async()=>({counts:{a:'1'}})})),/invalid counts/);
    const retried=await output.exports.loadCrdcHpoCounts(fetcher);assert.equal(retried['HP:0000002'],1,'A failed check must be retryable, not cached as no samples');
    console.log('CRDC HPO >=1, zero/absent/loading/error separation, whole-profile rejection, shared cache and failed-check retry PASS');
}
main().catch(error=>{console.error(error);process.exitCode=1});
